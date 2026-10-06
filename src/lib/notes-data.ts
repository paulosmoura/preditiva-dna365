import "server-only";

import { access, stat } from "node:fs/promises";
import { basename, isAbsolute, resolve } from "node:path";
import ExcelJS, { type CellValue } from "exceljs";
import {
  type DashboardPayload,
  type EquipmentCatalogItem,
  isOpenStatus,
  type NoteDetails,
  type NoteField,
  type NoteRecord,
  type NotesDatabase,
  REQUIRED_HEADERS,
  type SourceMetadata,
} from "./domain";
import { readCriticalEquipment } from "./critical-equipment-store";

const managedWorkbookPath = resolve(process.cwd(), ".data", "notas.xlsx");

type WorkbookSource = {
  path: string;
  kind: SourceMetadata["sourceKind"];
};

type CacheEntry = {
  key: string;
  data: NotesDatabase;
};

let cache: CacheEntry | null = null;
let detailCache: { sourceKey: string; notes: Map<string, NoteDetails | null> } | null = null;

const DATE_HEADERS = new Set(["Data da nota", "Criado em", "Conclusão desejada", "Data de referência"]);
const TIME_HEADERS = new Set(["Criado às", "Hora de referência"]);

function cellText(value: CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value).trim();
  if ("text" in value && typeof value.text === "string") return value.text.trim();
  if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((item) => item.text).join("").trim();
  if ("result" in value) return cellText(value.result as CellValue);
  return String(value).trim();
}

function isoDate(value: CellValue): string {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(Math.round((value - 25_569) * 86_400_000));
    return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
  }
  const text = cellText(value);
  if (!text) return "";
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const brazilian = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return brazilian ? `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}` : "";
}

function timeText(value: CellValue): string {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return [value.getHours(), value.getMinutes(), value.getSeconds()]
      .map((part) => String(part).padStart(2, "0"))
      .join(":");
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const seconds = Math.round((((value % 1) + 1) % 1) * 86_400) % 86_400;
    return [Math.floor(seconds / 3_600), Math.floor(seconds % 3_600 / 60), seconds % 60]
      .map((part) => String(part).padStart(2, "0"))
      .join(":");
  }
  return cellText(value);
}

function detailField(label: string, value: CellValue): NoteField {
  if (DATE_HEADERS.has(label)) return { label, value: isoDate(value), kind: "date" };
  if (TIME_HEADERS.has(label)) return { label, value: timeText(value), kind: "time" };
  return { label, value: cellText(value), kind: "text" };
}

function workbookWorksheet(workbook: ExcelJS.Workbook) {
  const worksheet = workbook.getWorksheet("Data") ?? workbook.worksheets[0];
  if (!worksheet) throw new Error("A planilha não possui abas legíveis.");
  return worksheet;
}

function worksheetHeaders(worksheet: ExcelJS.Worksheet): Array<{ label: string; column: number }> {
  const headers: Array<{ label: string; column: number }> = [];
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, column) => {
    const label = cellText(cell.value);
    if (label) headers.push({ label, column });
  });
  return headers;
}

type HeaderColumn = { label: string; column: number };

function noteDetailsFromRow(
  row: ExcelJS.Row,
  headers: HeaderColumn[],
  headerMap: Map<string, number>,
  noteId: string,
): NoteDetails {
  const value = (header: typeof REQUIRED_HEADERS[number]) => row.getCell(headerMap.get(header)!).value;
  return {
    noteId,
    description: cellText(value("Descrição")),
    equipment: cellText(value("Campo de ordenação")),
    location: cellText(value("Denom.loc.instalação")),
    statusUser: cellText(value("Status usuário")),
    statusSystem: cellText(value("Status do sistema")),
    noteDate: isoDate(value("Data da nota")),
    impact: cellText(value("Impacto")),
    orderId: cellText(value("Ordem")),
    fields: headers.map(({ label, column }) => detailField(label, row.getCell(column).value)),
  };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function resolveWorkbookSource(): Promise<WorkbookSource> {
  if (await exists(managedWorkbookPath)) return { path: managedWorkbookPath, kind: "managed-upload" };

  const configured = process.env.PREDITIVA_XLSX_PATH?.trim();
  if (!configured) {
    throw new Error("Nenhuma planilha configurada. Defina PREDITIVA_XLSX_PATH ou importe um arquivo na área administrativa.");
  }
  const path = isAbsolute(configured)
    ? configured
    : resolve(/*turbopackIgnore: true*/ process.cwd(), configured);
  if (!(await exists(path))) throw new Error(`Planilha configurada não encontrada: ${path}`);
  return { path, kind: "configured-file" };
}

export function managedUploadPath(): string {
  return managedWorkbookPath;
}

export async function readWorkbookAt(path: string, kind: SourceMetadata["sourceKind"]): Promise<NotesDatabase> {
  const fileStat = await stat(path);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  const worksheet = workbookWorksheet(workbook);

  const headerRow = worksheet.getRow(1);
  const headerMap = new Map<string, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    headerMap.set(cellText(cell.value), columnNumber);
  });
  const missing = REQUIRED_HEADERS.filter((header) => !headerMap.has(header));
  if (missing.length) throw new Error(`Colunas obrigatórias ausentes: ${missing.join(", ")}.`);

  const notes: NoteRecord[] = [];
  const equipmentMap = new Map<string, EquipmentCatalogItem>();

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const value = (header: typeof REQUIRED_HEADERS[number]) => row.getCell(headerMap.get(header)!).value;
    const noteId = cellText(value("Nota"));
    if (!noteId) continue;

    const record: NoteRecord = {
      noteId,
      description: cellText(value("Descrição")),
      equipment: cellText(value("Campo de ordenação")),
      location: cellText(value("Denom.loc.instalação")),
      statusUser: cellText(value("Status usuário")),
      statusSystem: cellText(value("Status do sistema")),
      noteDate: isoDate(value("Data da nota")),
      impact: cellText(value("Impacto")),
      orderId: cellText(value("Ordem")),
    };
    notes.push(record);

    if (!record.equipment) continue;
    const current = equipmentMap.get(record.equipment) ?? {
      equipment: record.equipment,
      location: record.location,
      totalNotes: 0,
      openNotes: 0,
      latestNoteDate: "",
    };
    current.totalNotes += 1;
    if (isOpenStatus(record.statusUser)) current.openNotes += 1;
    if (record.noteDate > current.latestNoteDate) {
      current.latestNoteDate = record.noteDate;
      if (record.location) current.location = record.location;
    }
    equipmentMap.set(record.equipment, current);
  }

  const equipment = [...equipmentMap.values()].sort((left, right) =>
    right.openNotes - left.openNotes || left.equipment.localeCompare(right.equipment, "pt-BR"));
  return {
    notes,
    equipment,
    metadata: {
      fileName: basename(path),
      sourceKind: kind,
      modifiedAt: fileStat.mtime.toISOString(),
      sizeBytes: fileStat.size,
      rows: notes.length,
    },
  };
}

export async function getNotesDatabase(): Promise<NotesDatabase> {
  const source = await resolveWorkbookSource();
  const fileStat = await stat(/*turbopackIgnore: true*/ source.path);
  const key = `${source.path}:${fileStat.size}:${fileStat.mtimeMs}`;
  if (cache?.key === key) return cache.data;
  const data = await readWorkbookAt(source.path, source.kind);
  cache = { key, data };
  return data;
}

export function invalidateNotesCache(): void {
  cache = null;
  detailCache = null;
}

export async function getDashboardPayload(): Promise<DashboardPayload> {
  const [database, criticalEquipment] = await Promise.all([
    getNotesDatabase(),
    readCriticalEquipment(),
  ]);
  const selected = new Set(criticalEquipment);
  return {
    metadata: database.metadata,
    criticalEquipment,
    openNotes: database.notes.filter((note) => selected.has(note.equipment) && isOpenStatus(note.statusUser)),
    equipment: database.equipment.filter((item) => selected.has(item.equipment)),
  };
}

export async function getEquipmentCatalog(): Promise<EquipmentCatalogItem[]> {
  return (await getNotesDatabase()).equipment;
}

async function readNoteDetailsStreamingAt(path: string, noteId: string): Promise<NoteDetails | null> {
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(path, {
    entries: "emit",
    sharedStrings: "cache",
    hyperlinks: "ignore",
    styles: "cache",
    worksheets: "emit",
  });
  let fallback: NoteDetails | null = null;

  for await (const worksheet of reader) {
    const isDataWorksheet = (worksheet as unknown as { name?: string }).name === "Data";
    const headers: Array<{ label: string; column: number }> = [];
    let headerMap = new Map<string, number>();

    for await (const row of worksheet) {
      if (row.number === 1) {
        row.eachCell({ includeEmpty: false }, (cell, column) => {
          const label = cellText(cell.value);
          if (label) headers.push({ label, column });
        });
        headerMap = new Map(headers.map(({ label, column }) => [label, column]));
        const missing = REQUIRED_HEADERS.filter((header) => !headerMap.has(header));
        if (missing.length && isDataWorksheet) {
          throw new Error(`Colunas obrigatórias ausentes: ${missing.join(", ")}.`);
        }
        if (missing.length) break;
        continue;
      }

      const noteColumn = headerMap.get("Nota");
      if (!noteColumn || cellText(row.getCell(noteColumn).value) !== noteId) continue;
      const note = noteDetailsFromRow(row, headers, headerMap, noteId);
      if (isDataWorksheet) return note;
      fallback ??= note;
    }
    if (isDataWorksheet) return null;
  }
  return fallback;
}

async function readNoteDetailsBufferedAt(path: string, noteId: string): Promise<NoteDetails | null> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  const worksheet = workbookWorksheet(workbook);
  const headers = worksheetHeaders(worksheet);
  const headerMap = new Map(headers.map(({ label, column }) => [label, column]));
  const missing = REQUIRED_HEADERS.filter((header) => !headerMap.has(header));
  if (missing.length) throw new Error(`Colunas obrigatórias ausentes: ${missing.join(", ")}.`);
  const noteColumn = headerMap.get("Nota")!;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    if (cellText(row.getCell(noteColumn).value) === noteId) {
      return noteDetailsFromRow(row, headers, headerMap, noteId);
    }
  }
  return null;
}

export async function readNoteDetailsAt(path: string, noteId: string): Promise<NoteDetails | null> {
  try {
    return await readNoteDetailsStreamingAt(path, noteId);
  } catch {
    return readNoteDetailsBufferedAt(path, noteId);
  }
}

export async function getNoteDetails(noteId: string): Promise<NoteDetails | null> {
  const source = await resolveWorkbookSource();
  const fileStat = await stat(/*turbopackIgnore: true*/ source.path);
  const sourceKey = `${source.path}:${fileStat.size}:${fileStat.mtimeMs}`;
  if (detailCache?.sourceKey !== sourceKey) {
    detailCache = { sourceKey, notes: new Map() };
  }
  if (detailCache.notes.has(noteId)) return detailCache.notes.get(noteId) ?? null;
  const note = await readNoteDetailsAt(source.path, noteId);
  detailCache.notes.set(noteId, note);
  return note;
}
