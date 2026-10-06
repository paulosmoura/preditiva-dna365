"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Search, Settings2 } from "lucide-react";
import type { EquipmentCatalogItem } from "@/lib/domain";
import { normalizeSearch } from "@/lib/domain";

const number = new Intl.NumberFormat("pt-BR");
const PAGE_SIZE = 50;

export function CriticalEquipmentPanel({ catalog, initialSelected }: { catalog: EquipmentCatalogItem[]; initialSelected: string[] }) {
  const [selected, setSelected] = useState(() => new Set(initialSelected));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const filtered = useMemo(() => {
    const term = normalizeSearch(search);
    return term
      ? catalog.filter((item) => normalizeSearch(`${item.equipment} ${item.location}`).includes(term))
      : catalog;
  }, [catalog, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggle(equipment: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(equipment)) next.delete(equipment);
      else next.add(equipment);
      return next;
    });
    setMessage("");
  }

  function save() {
    startTransition(async () => {
      setMessage("");
      try {
        const response = await fetch("/api/equipamentos-criticos", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ equipment: [...selected] }),
        });
        const body = await response.json() as { count?: number; error?: string };
        if (!response.ok) throw new Error(body.error || "Não foi possível salvar a seleção.");
        setMessage(`${number.format(body.count ?? selected.size)} equipamentos críticos salvos.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha inesperada ao salvar.");
      }
    });
  }

  return (
    <div className="dashboard-stack">
      <header className="page-heading">
        <div><p className="eyebrow">Parametrização</p><h1>Equipamentos críticos</h1><p>Classificação manual pelo campo de ordenação, conforme definido no plano do projeto</p></div>
        <button className="primary-button" type="button" disabled={isPending} onClick={save}><Check size={17} /> {isPending ? "Salvando…" : "Salvar classificação"}</button>
      </header>

      <section className="admin-summary">
        <article><Settings2 /><span><strong>{number.format(selected.size)}</strong><small>classificados como críticos</small></span></article>
        <article><span><strong>{number.format(catalog.length)}</strong><small>equipamentos identificados no Excel</small></span></article>
        <p>Os 15 equipamentos destacados no PPTX foram usados como seleção inicial. O administrador pode alterar essa lista a qualquer momento.</p>
      </section>

      <section className="content-panel">
        <div className="section-heading critical-toolbar">
          <div><p className="eyebrow">Cadastro administrativo</p><h2>Selecione os equipamentos</h2></div>
          <label className="input-with-icon"><Search size={16} /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar equipamento ou local" /></label>
        </div>
        {message && <p className="save-message" role="status">{message}</p>}
        <div className="equipment-selector">
          {visible.map((item) => {
            const checked = selected.has(item.equipment);
            return (
              <label key={item.equipment} className={checked ? "is-selected" : ""}>
                <input type="checkbox" checked={checked} onChange={() => toggle(item.equipment)} />
                <span><strong>{item.equipment}</strong><small>{item.location || "Local não informado"}</small></span>
                <span><strong>{number.format(item.openNotes)}</strong><small>notas abertas</small></span>
                <span><strong>{number.format(item.totalNotes)}</strong><small>notas totais</small></span>
              </label>
            );
          })}
          {!visible.length && <p className="empty-state">Nenhum equipamento encontrado.</p>}
        </div>
        <footer className="table-footer"><span>{number.format(filtered.length)} equipamentos encontrados</span><div><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Anterior</button><span>Página {currentPage} de {totalPages}</span><button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Próxima</button></div></footer>
      </section>
    </div>
  );
}
