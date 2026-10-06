import { redirect } from "next/navigation";
import { Activity, Database, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { getSession } from "@/lib/session";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="login-page">
      <section className="login-intro">
        <div className="brand-mark"><Activity aria-hidden="true" /><span>PREDITIVA</span></div>
        <p className="eyebrow">Engenharia de confiabilidade</p>
        <h1>Notas críticas sob controle</h1>
        <p className="login-lead">
          Classifique equipamentos críticos, acompanhe notas abertas e atualize a base Excel em um único fluxo.
        </p>
        <div className="login-features">
          <span><Database aria-hidden="true" /> Fonte Excel controlada</span>
          <span><ShieldCheck aria-hidden="true" /> Administração protegida</span>
        </div>
      </section>
      <section className="login-card" aria-labelledby="login-title">
        <p className="eyebrow">Acesso administrativo</p>
        <h2 id="login-title">Entrar no painel</h2>
        <p>Use suas credenciais de acesso administrativo.</p>
        <LoginForm />
      </section>
    </main>
  );
}
