"use client";

import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  CalendarDays,
  Phone,
  Settings,
  Scale,
  UserPlus,
  CreditCard,
  CalendarClock,
  Bot,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { PANELS, usePanel } from "@/contexts/PanelContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { getUsuarioLogado } from "@/services/api";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  {
    id: "dashboard",
    tKey: "nav_dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: PANELS.CLIENTES,
    tKey: "nav_clientes",
    icon: Users,
  },
  {
    id: PANELS.PROCESSOS,
    tKey: "nav_processos",
    icon: Briefcase,
  },
  {
    id: PANELS.AGENDA,
    tKey: "nav_agenda",
    icon: CalendarDays,
  },
  {
    id: "compromissos",
    tKey: "nav_compromissos",
    icon: CalendarClock,
    href: "/dashboard/compromissos",
  },
  {
    id: "assistente-ia",
    tKey: "nav_assistente",
    icon: Bot,
    href: "/assistente-ia",
  },
  {
    id: PANELS.DOCUMENTOS,
    tKey: "nav_documentos",
    icon: FileText,
  },
  {
    id: PANELS.ADVOGADOS,
    tKey: "nav_advogados",
    icon: UserPlus,
    adminOnly: true,
  },
  {
    id: PANELS.PLANOS,
    tKey: "nav_planos",
    icon: CreditCard,
  },
  {
    id: PANELS.CONTATO,
    tKey: "nav_contato",
    icon: Phone,
  },
  {
    id: PANELS.CONFIG,
    tKey: "nav_config",
    icon: Settings,
  },
];

export default function AppSidebar() {
  const { activePanel, openPanel, closePanel } = usePanel();
  const { t } = usePreferences();
  const router = useRouter();
  const pathname = usePathname();

  // O usuário é carregado somente no cliente para evitar
  // erro de hydration causado pelo localStorage.
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioLogado = getUsuarioLogado();

    if (usuarioLogado) {
      setUsuario(usuarioLogado);
    }
  }, []);

  function handleNav(item) {
    if (item.href) {
      closePanel();
      router.push(item.href);
      return;
    }

    if (item.id === "dashboard") {
      closePanel();
      router.push("/dashboard");
      return;
    }

    openPanel(item.id);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Scale size={20} />
        </div>

        <div>
          <h1>LexOffice</h1>

          <p>
            {usuario?.escritorio_nome || "ERP Jurídico"}
          </p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.filter(
          (item) =>
            !item.adminOnly ||
            usuario?.tipo_usuario === "admin"
        ).map(({ id, tKey, icon: Icon, href }) => {
          const isDashboard = id === "dashboard";

          const isRouteActive =
            href && pathname === href;

          const isPanelActive =
            !href &&
            !isDashboard &&
            activePanel === id;

          const isActive =
            isRouteActive ||
            isPanelActive ||
            (isDashboard &&
              pathname === "/dashboard" &&
              !activePanel);

          return (
            <button
              key={id}
              type="button"
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => handleNav({ id, href })}
            >
              <Icon size={18} />
              <span>{t(tKey)}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}