import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeCriticalEquipment } from "@/lib/critical-equipment-store";
import { getEquipmentCatalog } from "@/lib/notes-data";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

const requestSchema = z.object({
  equipment: z.array(z.string().trim().min(1).max(180)).max(5_000),
});

export async function PUT(request: Request) {
  if (!(await getSession())) return Response.json({ error: "Sessão administrativa necessária." }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Seleção de equipamentos inválida." }, { status: 400 });

  const available = new Set((await getEquipmentCatalog()).map((item) => item.equipment));
  const unknown = parsed.data.equipment.filter((item) => !available.has(item));
  if (unknown.length) return Response.json({ error: `Equipamentos não encontrados na base: ${unknown.slice(0, 5).join(", ")}.` }, { status: 400 });

  const saved = await writeCriticalEquipment(parsed.data.equipment);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/equipamentos-criticos");
  return Response.json({ count: saved.length });
}
