import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard-client";
import { getDashboardPayload } from "@/lib/notes-data";

export const metadata: Metadata = { title: "Painel de gestão" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  return <DashboardClient payload={await getDashboardPayload()} />;
}
