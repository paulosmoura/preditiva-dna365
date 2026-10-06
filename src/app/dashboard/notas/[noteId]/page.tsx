import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ClipboardList, Factory, MapPin } from "lucide-react";
import type { NoteField } from "@/lib/domain";
import { getNoteDetails } from "@/lib/notes-data";

export const metadata: Metadata = { title: "Detalhes da nota" };
export const dynamic = "force-dynamic";

const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function fieldValue(field: NoteField): string {
  if (!field.value) return "Não informado";
  if (field.kind !== "date") return field.value;
  const parsed = new Date(`${field.value}T12:00:00Z`);
  return Number.isNaN(parsed.valueOf()) ? field.value : date.format(parsed);
}

function wideField(label: string): boolean {
  return ["Descrição", "Dds.adics.dispos.", "Detection Method Description", "Plano de manutenção"].includes(label);
}

export default async function NoteDetailsPage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  const note = await getNoteDetails(noteId);
  if (!note) notFound();

  return (
    <div className="dashboard-stack">
      <header className="page-heading note-page-heading">
        <div>
          <p className="eyebrow">Detalhes da nota</p>
          <h1>Nota {note.noteId}</h1>
          <p>{note.description || "Sem descrição informada"}</p>
        </div>
        <Link className="secondary-button" href="/dashboard#notas-abertas"><ArrowLeft size={17} /> Voltar ao painel</Link>
      </header>

      <section className="note-summary" aria-label="Resumo da nota">
        <article><ClipboardList aria-hidden="true" /><span><small>Status usuário</small><strong>{note.statusUser || "Não informado"}</strong></span></article>
        <article><Factory aria-hidden="true" /><span><small>Campo de ordenação</small><strong>{note.equipment || "Não informado"}</strong></span></article>
        <article><MapPin aria-hidden="true" /><span><small>Local de instalação</small><strong>{note.location || "Não informado"}</strong></span></article>
        <article><CalendarDays aria-hidden="true" /><span><small>Data da nota</small><strong>{fieldValue({ label: "Data da nota", value: note.noteDate, kind: "date" })}</strong></span></article>
      </section>

      <section className="content-panel note-details-panel">
        <div className="section-heading">
          <div><p className="eyebrow">Dados de origem</p><h2>Todos os dados da nota</h2></div>
          <span>{note.fields.length} campos do Excel</span>
        </div>
        <dl className="note-detail-grid">
          {note.fields.map((field) => (
            <div className={wideField(field.label) ? "note-field note-field--wide" : "note-field"} key={field.label}>
              <dt>{field.label}</dt>
              <dd className={field.value ? "" : "is-empty"}>{fieldValue(field)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
