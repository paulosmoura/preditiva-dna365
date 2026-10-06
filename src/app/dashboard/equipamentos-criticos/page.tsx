import type { Metadata } from "next";
import { CriticalEquipmentPanel } from "@/components/critical-equipment-panel";
import { readCriticalEquipment } from "@/lib/critical-equipment-store";
import { getEquipmentCatalog } from "@/lib/notes-data";

export const metadata: Metadata = { title: "Equipamentos críticos" };
export const dynamic = "force-dynamic";

export default async function CriticalEquipmentPage() {
  const [catalog, selected] = await Promise.all([getEquipmentCatalog(), readCriticalEquipment()]);
  return <CriticalEquipmentPanel catalog={catalog} initialSelected={selected} />;
}
