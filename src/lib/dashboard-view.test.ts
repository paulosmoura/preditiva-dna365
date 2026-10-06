import { describe, expect, it } from "vitest";
import type { DashboardPayload } from "./domain";
import { buildDashboardView, EMPTY_DASHBOARD_FILTERS, filterOpenNotes } from "./dashboard-view";

const payload: DashboardPayload = {
  metadata: { fileName: "notas.xlsx", sourceKind: "configured-file", modifiedAt: "2026-09-24T12:00:00.000Z", sizeBytes: 100, rows: 3 },
  criticalEquipment: ["A", "B"],
  equipment: [
    { equipment: "A", location: "Refinaria", totalNotes: 2, openNotes: 2, latestNoteDate: "2026-09-02" },
    { equipment: "B", location: "Redução", totalNotes: 1, openNotes: 1, latestNoteDate: "2026-09-03" },
  ],
  openNotes: [
    { noteId: "1", description: "Reparo urgente", equipment: "A", location: "Refinaria", statusUser: "OPN URG", statusSystem: "MSEN", noteDate: "2026-09-01", impact: "3", orderId: "10" },
    { noteId: "2", description: "Inspeção", equipment: "A", location: "Refinaria", statusUser: "OPN", statusSystem: "MSEN", noteDate: "2026-09-02", impact: "1", orderId: "" },
    { noteId: "3", description: "Proteção", equipment: "B", location: "Redução", statusUser: "OPN", statusSystem: "MSPR", noteDate: "2026-09-03", impact: "2", orderId: "30" },
  ],
};

describe("painel de gestão", () => {
  it("agrega notas abertas por equipamento e calcula os indicadores", () => {
    const view = buildDashboardView(payload, EMPTY_DASHBOARD_FILTERS);
    expect(view.kpis).toEqual({ openNotes: 3, criticalWithOpenNotes: 2, locations: 2, urgent: 1 });
    expect(view.equipment.map((item) => [item.equipment, item.notes])).toEqual([["A", 2], ["B", 1]]);
  });

  it("aplica em conjunto os filtros exigidos no PPTX", () => {
    const notes = filterOpenNotes(payload.openNotes, {
      ...EMPTY_DASHBOARD_FILTERS,
      equipment: "A",
      location: "Refinaria",
      startDate: "2026-09-01",
      endDate: "2026-09-01",
      statusUser: "OPN URG",
      impact: "3",
    });
    expect(notes.map((note) => note.noteId)).toEqual(["1"]);
  });

  it("pesquisa por descrição sem depender de acentos", () => {
    const notes = filterOpenNotes(payload.openNotes, { ...EMPTY_DASHBOARD_FILTERS, search: "inspecao" });
    expect(notes.map((note) => note.noteId)).toEqual(["2"]);
  });

  it("aplica o filtro rápido de urgência em indicadores, gráficos e tabela", () => {
    const view = buildDashboardView(payload, { ...EMPTY_DASHBOARD_FILTERS, quickFilter: "urgent" });
    expect(view.notes.map((note) => note.noteId)).toEqual(["1"]);
    expect(view.equipment.map((item) => [item.equipment, item.notes])).toEqual([["A", 1]]);
    expect(view.kpis).toEqual({ openNotes: 1, criticalWithOpenNotes: 1, locations: 1, urgent: 1 });
  });
});
