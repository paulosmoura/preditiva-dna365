import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { REQUIRED_HEADERS } from "./domain";
import { readNoteDetailsAt } from "./notes-data";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("detalhes de uma nota", () => {
  it("preserva todos os campos da linha e identifica datas e horas", async () => {
    const directory = await mkdtemp(join(tmpdir(), "preditiva-note-"));
    temporaryDirectories.push(directory);
    const path = join(directory, "notas.xlsx");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");
    worksheet.addRow([...REQUIRED_HEADERS, "Criado às", "Campo adicional"]);
    worksheet.addRow([
      "17286387",
      "REMOVER LINHA DE VIDA DESATIVADA",
      "500",
      "Reducao",
      "OPN",
      "MSPN",
      new Date("2026-08-28T00:00:00Z"),
      1,
      "",
      "16:45:38",
      "Valor preservado",
    ]);
    await workbook.xlsx.writeFile(path);

    const note = await readNoteDetailsAt(path, "17286387");

    expect(note?.noteId).toBe("17286387");
    expect(note?.fields).toHaveLength(11);
    expect(note?.fields.find((field) => field.label === "Data da nota")).toEqual({
      label: "Data da nota",
      value: "2026-08-28",
      kind: "date",
    });
    expect(note?.fields.find((field) => field.label === "Criado às")).toEqual({
      label: "Criado às",
      value: "16:45:38",
      kind: "time",
    });
    expect(note?.fields.find((field) => field.label === "Campo adicional")?.value).toBe("Valor preservado");
  });

  it("retorna nulo quando a nota não existe", async () => {
    const directory = await mkdtemp(join(tmpdir(), "preditiva-note-"));
    temporaryDirectories.push(directory);
    const path = join(directory, "notas.xlsx");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");
    worksheet.addRow(REQUIRED_HEADERS);
    await workbook.xlsx.writeFile(path);

    await expect(readNoteDetailsAt(path, "inexistente")).resolves.toBeNull();
  });
});
