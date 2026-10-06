"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSpreadsheet, Gauge, Settings2 } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Painel de gestão", icon: Gauge, exact: true, tour: "dashboard-nav" },
  { href: "/dashboard/equipamentos-criticos", label: "Equipamentos críticos", icon: Settings2, tour: "critical-admin" },
  { href: "/dashboard/importar", label: "Atualizar Excel", icon: FileSpreadsheet, tour: "excel-import" },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="side-nav" aria-label="Navegação principal">
      <p>Monitoramento</p>
      {links.map(({ href, label, icon: Icon, exact, tour }) => {
        const active = exact
          ? pathname === href || (href === "/dashboard" && pathname.startsWith("/dashboard/notas/"))
          : pathname.startsWith(href);
        return (
          <Link key={href} href={href} data-tour={tour} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
