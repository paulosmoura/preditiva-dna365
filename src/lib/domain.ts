export const REQUIRED_HEADERS = [
  "Nota",
  "Descrição",
  "Campo de ordenação",
  "Denom.loc.instalação",
  "Status usuário",
  "Status do sistema",
  "Data da nota",
  "Impacto",
  "Ordem",
] as const;

export type NoteRecord = {
  noteId: string;
  description: string;
  equipment: string;
  location: string;
  statusUser: string;
  statusSystem: string;
  noteDate: string;
  impact: string;
  orderId: string;
};

export type NoteField = {
  label: string;
  value: string;
  kind: "text" | "date" | "time";
};

export type NoteDetails = NoteRecord & {
  fields: NoteField[];
};

export type EquipmentCatalogItem = {
  equipment: string;
  location: string;
  totalNotes: number;
  openNotes: number;
  latestNoteDate: string;
};

export type SourceMetadata = {
  fileName: string;
  sourceKind: "managed-upload" | "configured-file";
  modifiedAt: string;
  sizeBytes: number;
  rows: number;
};

export type NotesDatabase = {
  notes: NoteRecord[];
  equipment: EquipmentCatalogItem[];
  metadata: SourceMetadata;
};

export type DashboardPayload = {
  metadata: SourceMetadata;
  criticalEquipment: string[];
  openNotes: NoteRecord[];
  equipment: EquipmentCatalogItem[];
};

export function isOpenStatus(statusUser: string): boolean {
  const configuredPrefix = process.env.PREDITIVA_OPEN_STATUS_PREFIX?.trim() || "OPN";
  return statusUser
    .split(/\s+/)
    .filter(Boolean)
    .some((code) => code.toLocaleUpperCase("pt-BR") === configuredPrefix.toLocaleUpperCase("pt-BR"));
}

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/\s+/g, " ");
}
