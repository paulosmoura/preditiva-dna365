import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, LogOut, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { GuidedTour } from "@/components/guided-tour";
import { SidebarNav } from "@/components/sidebar-nav";
import { getSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="sidebar-brand" href="/dashboard">
          <Activity aria-hidden="true" />
          <span><strong>Preditiva</strong><small>Confiabilidade</small></span>
        </Link>
        <div className="sidebar-context">
          <small>Ambiente</small>
          <strong>Gestão de notas</strong>
          <span>Base Excel local</span>
        </div>
        <SidebarNav />
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="avatar"><ShieldCheck size={17} /></span>
            <span><strong>{session.username}</strong><small>Administrador</small></span>
          </div>
          <form action={logoutAction}>
            <button className="logout-button" type="submit"><LogOut size={16} /> Sair</button>
          </form>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-copy"><strong>Engenharia de Confiabilidade e Preditiva</strong><small>Monitoramento de notas críticas</small></div>
          <div className="topbar-actions"><GuidedTour /><span className="admin-chip"><ShieldCheck size={14} /> Administração</span></div>
        </header>
        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
