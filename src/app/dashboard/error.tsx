"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="error-panel" role="alert">
      <AlertTriangle size={28} aria-hidden="true" />
      <div><h1>Não foi possível carregar a base</h1><p>{error.message}</p></div>
      <button className="secondary-button" type="button" onClick={reset}><RotateCcw size={16} /> Tentar novamente</button>
    </section>
  );
}
