"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Factory, RotateCcw, Search, Wrench } from "lucide-react";
import type { DashboardPayload } from "@/lib/domain";
import { buildDashboardView, EMPTY_DASHBOARD_FILTERS, type DashboardFilters } from "@/lib/dashboard-view";

const number = new Intl.NumberFormat("pt-BR");
const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const PAGE_SIZE = 25;

function formatDate(value: string): string {
  if (!value) return "Não informada";
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(parsed.valueOf()) ? "Não informada" : date.format(parsed);
}

function SourceSummary({ payload }: { payload: DashboardPayload }) {
  const sourceLabel = payload.metadata.sourceKind === "managed-upload" ? "Upload administrado" : "Arquivo local configurado";
  return (
    <div className="source-summary">
      <span>{sourceLabel}</span>
      <span>{payload.metadata.fileName}</span>
      <span>{number.format(payload.metadata.rows)} registros</span>
      <span>Atualizado em {new Date(payload.metadata.modifiedAt).toLocaleString("pt-BR")}</span>
    </div>
  );
}

export function DashboardClient({ payload }: { payload: DashboardPayload }) {
  const [filters, setFilters] = useState<DashboardFilters>(EMPTY_DASHBOARD_FILTERS);
  const [page, setPage] = useState(1);
  const view = useMemo(() => buildDashboardView(payload, filters), [payload, filters]);
  const options = useMemo(() => ({
    equipment: [...new Set(payload.openNotes.map((note) => note.equipment))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    location: [...new Set(payload.openNotes.map((note) => note.location).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    status: [...new Set(payload.openNotes.map((note) => note.statusUser))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    impact: [...new Set(payload.openNotes.map((note) => note.impact).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
  }), [payload.openNotes]);
  const totalPages = Math.max(1, Math.ceil(view.notes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleNotes = view.notes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const chartItems = view.equipment.slice(0, 10);
  const chartMaximum = Math.max(1, ...chartItems.map((item) => item.notes));

  function update<K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_DASHBOARD_FILTERS);
    setPage(1);
  }

  function applyQuickFilter(quickFilter: DashboardFilters["quickFilter"]) {
    setFilters((current) => ({ ...current, quickFilter }));
    setPage(1);
  }

  return (
    <div className="dashboard-stack">
      <header className="page-heading" data-tour="dashboard-intro">
        <div><p className="eyebrow">Centro de monitoramento</p><h1>Painel de gestão</h1><p>Notas abertas dos equipamentos classificados como críticos</p></div>
        <span className="status-badge status-badge--success">Base disponível</span>
      </header>
      <SourceSummary payload={payload} />
      <div className="method-notice" role="note"><AlertTriangle size={17} /><p><strong>Regra inicial de nota aberta:</strong> registros cujo campo <em>Status usuário</em> contém o código <code>OPN</code>. A regra fica centralizada para futura validação funcional.</p></div>

      <section className="filter-panel" aria-labelledby="filter-title" data-tour="filters">
        <div className="section-heading"><div><p className="eyebrow">Recorte dos dados</p><h2 id="filter-title">Filtros da gestão</h2></div><button className="text-button" type="button" onClick={clearFilters}><RotateCcw size={15} /> Limpar filtros</button></div>
        <div className="filter-grid">
          <label><span>Campo de ordenação</span><select value={filters.equipment} onChange={(event) => update("equipment", event.target.value)}><option value="">Todos os equipamentos críticos</option>{options.equipment.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Denom.loc.instalação</span><select value={filters.location} onChange={(event) => update("location", event.target.value)}><option value="">Todos os locais</option>{options.location.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Data inicial</span><input type="date" value={filters.startDate} onChange={(event) => update("startDate", event.target.value)} /></label>
          <label><span>Data final</span><input type="date" value={filters.endDate} onChange={(event) => update("endDate", event.target.value)} /></label>
          <label><span>Status usuário</span><select value={filters.statusUser} onChange={(event) => update("statusUser", event.target.value)}><option value="">Todos os status abertos</option>{options.status.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Impacto</span><select value={filters.impact} onChange={(event) => update("impact", event.target.value)}><option value="">Todos os impactos</option>{options.impact.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="filter-search"><span>Buscar nota</span><span className="input-with-icon"><Search size={16} /><input type="search" value={filters.search} onChange={(event) => update("search", event.target.value)} placeholder="Número, descrição ou ordem" /></span></label>
        </div>
      </section>

      <section className="kpi-grid" aria-label="Resumo das notas abertas">
        <article className="kpi-card"><span className="kpi-icon kpi-icon--blue"><Wrench /></span><div><small>Notas abertas</small><strong>{number.format(view.kpis.openNotes)}</strong><p>no recorte selecionado</p></div></article>
        <button className="kpi-card" type="button" data-tour="critical-filter" aria-pressed={filters.quickFilter === "critical"} onClick={() => applyQuickFilter("critical")}><span className="kpi-icon kpi-icon--red"><Factory /></span><div><small>Equipamentos críticos</small><strong>{number.format(view.kpis.criticalWithOpenNotes)}</strong><p>clique para filtrar</p></div></button>
        <button className="kpi-card" type="button" data-tour="urgent-filter" aria-pressed={filters.quickFilter === "urgent"} onClick={() => applyQuickFilter("urgent")}><span className="kpi-icon kpi-icon--amber"><AlertTriangle /></span><div><small>Notas urgentes</small><strong>{number.format(view.kpis.urgent)}</strong><p>clique para filtrar</p></div></button>
        <article className="kpi-card"><span className="kpi-icon kpi-icon--violet"><CalendarDays /></span><div><small>Locais de instalação</small><strong>{number.format(view.kpis.locations)}</strong><p>presentes no recorte</p></div></article>
      </section>

      <div className="dashboard-grid" data-tour="charts">
        <section className="content-panel">
          <div className="section-heading"><div><p className="eyebrow">Distribuição</p><h2>Notas abertas por equipamento</h2></div><span>Top 10</span></div>
          {chartItems.length ? <div className="bar-chart" role="img" aria-label={chartItems.map((item) => `${item.equipment}: ${item.notes} notas`).join("; ")}>
            {chartItems.map((item) => <div className="bar-row" key={item.equipment}><button type="button" onClick={() => update("equipment", item.equipment)}>{item.equipment}</button><span className="bar-track"><i style={{ width: `${item.notes / chartMaximum * 100}%` }} /></span><strong>{number.format(item.notes)}</strong></div>)}
          </div> : <p className="empty-state">Nenhuma nota aberta encontrada com os filtros atuais.</p>}
        </section>

        <section className="content-panel">
          <div className="section-heading"><div><p className="eyebrow">Criticidade</p><h2>Equipamentos no recorte</h2></div><span>{number.format(view.equipment.length)}</span></div>
          <div className="compact-list">
            {view.equipment.slice(0, 8).map((item) => <button type="button" key={item.equipment} onClick={() => update("equipment", item.equipment)}><span><strong>{item.equipment}</strong><small>{item.location || "Local não informado"}</small></span><span><strong>{number.format(item.notes)}</strong><small>abertas</small></span></button>)}
            {!view.equipment.length && <p className="empty-state">Nenhum equipamento neste recorte.</p>}
          </div>
        </section>
      </div>

      <section className="content-panel" id="notas-abertas" data-tour="notes-table">
        <div className="section-heading"><div><p className="eyebrow">Detalhamento</p><h2>Notas abertas</h2></div><span>{number.format(view.notes.length)} registros</span></div>
        <div className="table-scroll"><table><thead><tr><th>Nota</th><th>Campo de ordenação</th><th>Denom.loc.instalação</th><th>Data da nota</th><th>Status usuário</th><th>Impacto</th><th>Ordem</th></tr></thead><tbody>{visibleNotes.map((note) => <tr key={note.noteId}><td><Link className="note-link" href={`/dashboard/notas/${encodeURIComponent(note.noteId)}`} aria-label={`Abrir detalhes da nota ${note.noteId}`}><strong>{note.noteId}</strong><small>{note.description || "Sem descrição"}</small></Link></td><td>{note.equipment}</td><td>{note.location || "Não informado"}</td><td>{formatDate(note.noteDate)}</td><td><span className="status-badge">{note.statusUser}</span></td><td><span className={`impact impact--${note.impact || "empty"}`}>{note.impact || "—"}</span></td><td>{note.orderId || "—"}</td></tr>)}</tbody></table></div>
        <footer className="table-footer"><span>{visibleNotes.length ? `${number.format((currentPage - 1) * PAGE_SIZE + 1)}–${number.format(Math.min(currentPage * PAGE_SIZE, view.notes.length))} de ${number.format(view.notes.length)}` : "0 registros"}</span><div><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Anterior</button><span>Página {currentPage} de {totalPages}</span><button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Próxima</button></div></footer>
      </section>
    </div>
  );
}
