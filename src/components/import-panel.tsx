"use client";

import { useRef, useState, useTransition } from "react";
import { FileCheck2, FileSpreadsheet, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SourceMetadata } from "@/lib/domain";

const number = new Intl.NumberFormat("pt-BR");

export function ImportPanel({ metadata }: { metadata: SourceMetadata }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      setMessage("");
      try {
        const response = await fetch("/api/importar", { method: "POST", body: formData });
        const body = await response.json() as { metadata?: SourceMetadata; error?: string };
        if (!response.ok) throw new Error(body.error || "Não foi possível importar o arquivo.");
        setMessage(`Importação concluída: ${number.format(body.metadata?.rows ?? 0)} registros válidos.`);
        formRef.current?.reset();
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha inesperada durante a importação.");
      }
    });
  }

  return (
    <div className="dashboard-stack">
      <header className="page-heading"><div><p className="eyebrow">Fonte de dados</p><h1>Atualizar Excel</h1><p>Substitua a base de notas por uma nova exportação no mesmo formato</p></div></header>
      <section className="source-card">
        <FileCheck2 aria-hidden="true" />
        <div><small>Fonte ativa</small><h2>{metadata.fileName}</h2><p>{number.format(metadata.rows)} registros · {(metadata.sizeBytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB · atualizado em {new Date(metadata.modifiedAt).toLocaleString("pt-BR")}</p></div>
        <span className="status-badge status-badge--success">Validada</span>
      </section>
      <section className="upload-panel">
        <div className="upload-copy"><span className="upload-icon"><FileSpreadsheet /></span><div><h2>Enviar nova base</h2><p>O arquivo deve ser `.xlsx`, possuir a aba de dados e manter as colunas obrigatórias do modelo atual.</p></div></div>
        <form ref={formRef} action={submit}>
          <label className="file-input"><Upload size={19} /><span>Selecionar arquivo Excel</span><input type="file" name="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required /></label>
          <button className="primary-button" type="submit" disabled={isPending}>{isPending ? "Validando e importando…" : "Atualizar base"}</button>
        </form>
        {message && <p className="save-message" role="status">{message}</p>}
        <div className="future-integration"><strong>Próxima etapa: SharePoint</strong><p>A leitura do Excel está isolada em uma única camada. A integração futura poderá baixar a versão autorizada do SharePoint antes do mesmo processo de validação e importação.</p></div>
      </section>
    </div>
  );
}
