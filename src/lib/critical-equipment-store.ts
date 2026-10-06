import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { replaceFileAtomically } from "./atomic-file-replace";

const storePath = resolve(process.cwd(), ".data", "critical-equipment.json");

export const PPTX_INITIAL_CRITICAL_EQUIPMENT = [
  "343-TC-001",
  "411-FC-001",
  "432",
  "500",
  "512-CP-001",
  "512-FE-001",
  "521-CJ-002",
  "541-FL-015",
  "600",
  "621",
  "621-AV-001A",
  "621-FS-001",
  "621-TQ-001B",
  "641",
  "841",
] as const;

function normalizeSelection(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "pt-BR"));
}

export async function readCriticalEquipment(): Promise<string[]> {
  try {
    const parsed = JSON.parse(await readFile(storePath, "utf8")) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === "string")) {
      throw new Error("Cadastro de equipamentos críticos inválido.");
    }
    return normalizeSelection(parsed);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return [...PPTX_INITIAL_CRITICAL_EQUIPMENT];
    }
    throw error;
  }
}

export async function writeCriticalEquipment(values: readonly string[]): Promise<string[]> {
  const normalized = normalizeSelection(values);
  await mkdir(dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  await replaceFileAtomically(temporaryPath, storePath);
  return normalized;
}
