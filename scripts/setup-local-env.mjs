import { randomBytes, randomInt } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(projectRoot, ".env.local");
const suggestedWorkbook = "C:/Users/paulo/Downloads/NOTAS 1.XLSX";

function upsert(source, key, value, { replaceBlank = false } = {}) {
  const pattern = new RegExp(`^${key}=(.*)$`, "m");
  const match = source.match(pattern);
  if (match) {
    if (replaceBlank && match[1].trim() === "") {
      return source.replace(pattern, `${key}=${value}`);
    }
    return source;
  }
  const separator = source.length === 0 || source.endsWith("\n") ? "" : "\n";
  return `${source}${separator}${key}=${value}\n`;
}

let contents = existsSync(envPath)
  ? readFileSync(envPath, "utf8")
  : "# Configuração local da aplicação Preditiva. Não versionar.\n";

contents = upsert(contents, "PREDITIVA_PORT", "3200");
contents = upsert(contents, "PREDITIVA_ADMIN_USER", "admin", { replaceBlank: true });
contents = upsert(
  contents,
  "PREDITIVA_ADMIN_PASSWORD",
  `Preditiva-${randomInt(100_000, 1_000_000)}`,
  { replaceBlank: true },
);
contents = upsert(
  contents,
  "PREDITIVA_AUTH_SECRET",
  randomBytes(32).toString("base64url"),
  { replaceBlank: true },
);
contents = upsert(
  contents,
  "PREDITIVA_XLSX_PATH",
  existsSync(suggestedWorkbook) ? suggestedWorkbook : "",
  { replaceBlank: true },
);
contents = upsert(contents, "PREDITIVA_OPEN_STATUS_PREFIX", "OPN");

writeFileSync(envPath, contents, { encoding: "utf8", mode: 0o600 });
console.log("[Preditiva] Configuração local pronta em .env.local.");
