import type { Metadata } from "next";
import { ImportPanel } from "@/components/import-panel";
import { getNotesDatabase } from "@/lib/notes-data";

export const metadata: Metadata = { title: "Atualizar Excel" };
export const dynamic = "force-dynamic";

export default async function ImportPage() {
  return <ImportPanel metadata={(await getNotesDatabase()).metadata} />;
}
