import type { DashboardPayload, NoteRecord } from "./domain";
import { normalizeSearch } from "./domain";

export type DashboardFilters = {
  quickFilter: "all" | "critical" | "urgent";
  equipment: string;
  location: string;
  startDate: string;
  endDate: string;
  statusUser: string;
  impact: string;
  search: string;
};

export const EMPTY_DASHBOARD_FILTERS: DashboardFilters = {
  quickFilter: "all",
  equipment: "",
  location: "",
  startDate: "",
  endDate: "",
  statusUser: "",
  impact: "",
  search: "",
};

export function filterOpenNotes(notes: readonly NoteRecord[], filters: DashboardFilters): NoteRecord[] {
  const search = normalizeSearch(filters.search);
  return notes.filter((note) => {
    if (filters.quickFilter === "urgent" && !note.statusUser.split(/\s+/).includes("URG")) return false;
    if (filters.equipment && note.equipment !== filters.equipment) return false;
    if (filters.location && note.location !== filters.location) return false;
    if (filters.startDate && (!note.noteDate || note.noteDate < filters.startDate)) return false;
    if (filters.endDate && (!note.noteDate || note.noteDate > filters.endDate)) return false;
    if (filters.statusUser && note.statusUser !== filters.statusUser) return false;
    if (filters.impact && note.impact !== filters.impact) return false;
    if (search && !normalizeSearch([
      note.noteId,
      note.description,
      note.equipment,
      note.location,
      note.orderId,
    ].join(" ")).includes(search)) return false;
    return true;
  });
}

export function buildDashboardView(payload: DashboardPayload, filters: DashboardFilters) {
  const notes = filterOpenNotes(payload.openNotes, filters);
  const equipmentMap = new Map<string, { equipment: string; location: string; notes: number; latest: string; urgent: number; impact3: number }>();
  for (const note of notes) {
    const current = equipmentMap.get(note.equipment) ?? {
      equipment: note.equipment,
      location: note.location,
      notes: 0,
      latest: "",
      urgent: 0,
      impact3: 0,
    };
    current.notes += 1;
    current.latest = note.noteDate > current.latest ? note.noteDate : current.latest;
    current.urgent += note.statusUser.split(/\s+/).includes("URG") ? 1 : 0;
    current.impact3 += note.impact === "3" ? 1 : 0;
    if (!current.location && note.location) current.location = note.location;
    equipmentMap.set(note.equipment, current);
  }
  const equipment = [...equipmentMap.values()].sort((left, right) =>
    right.notes - left.notes || left.equipment.localeCompare(right.equipment, "pt-BR"));
  return {
    notes: [...notes].sort((left, right) => right.noteDate.localeCompare(left.noteDate) || right.noteId.localeCompare(left.noteId)),
    equipment,
    kpis: {
      openNotes: notes.length,
      criticalWithOpenNotes: equipment.length,
      locations: new Set(notes.map((note) => note.location).filter(Boolean)).size,
      urgent: notes.filter((note) => note.statusUser.split(/\s+/).includes("URG")).length,
    },
  };
}
