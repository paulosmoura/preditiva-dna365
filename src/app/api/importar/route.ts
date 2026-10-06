import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { revalidatePath } from "next/cache";
import { replaceFileAtomically } from "@/lib/atomic-file-replace";
import { getSession } from "@/lib/session";
import {
  invalidateNotesCache,
  managedUploadPath,
  readWorkbookAt,
} from "@/lib/notes-data";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await getSession())) return Response.json({ error: "Sessão administrativa necessária." }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Selecione um arquivo Excel." }, { status: 400 });
  if (!file.name.toLocaleLowerCase("pt-BR").endsWith(".xlsx")) return Response.json({ error: "Envie um arquivo no formato .xlsx." }, { status: 400 });
  if (!file.size || file.size > MAX_FILE_SIZE) return Response.json({ error: "O arquivo deve possuir entre 1 byte e 25 MB." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) return Response.json({ error: "O conteúdo enviado não corresponde a um arquivo XLSX válido." }, { status: 400 });

  const destination = managedUploadPath();
  const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`;
  await mkdir(dirname(destination), { recursive: true });
  try {
    await writeFile(temporary, bytes, { flag: "wx" });
    const validation = await readWorkbookAt(temporary, "managed-upload");
    await replaceFileAtomically(temporary, destination);
    invalidateNotesCache();
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/importar");
    revalidatePath("/dashboard/equipamentos-criticos");
    return Response.json({ metadata: { ...validation.metadata, fileName: "notas.xlsx" } });
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Falha inesperada durante a importação.";
    return Response.json({ error: message }, { status: 400 });
  }
}
