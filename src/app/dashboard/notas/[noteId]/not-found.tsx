import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NoteNotFound() {
  return (
    <section className="content-panel note-not-found">
      <SearchX aria-hidden="true" />
      <div><p className="eyebrow">Nota não encontrada</p><h1>Este registro não está na base atual.</h1><p>A planilha pode ter sido atualizada ou o número informado não existe.</p></div>
      <Link className="secondary-button" href="/dashboard"><ArrowLeft size={17} /> Voltar ao painel</Link>
    </section>
  );
}
