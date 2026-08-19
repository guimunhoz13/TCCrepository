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
import { getUsuarioLogado } from "@/services/api";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: PANELS.CLIENTES,
    label: "Clientes",
    icon: Users,
  },
  {
    id: PANELS.PROCESSOS,
    label: "Processos",
    icon: Briefcase,
  },
  {
    id: PANELS.AGENDA,
    label: "Agenda",
    icon: CalendarDays,
  },
  {
    id: "compromissos",
    label: "Compromissos",
    icon: CalendarClock,
    href: "/dashboard/compromissos",
  },
  {
    id: "assistente-ia",
    label: "Assistente IA",
    icon: Bot,
    href: "/assistente-ia",
  },
  {
    id: PANELS.DOCUMENTOS,
    label: "Documentos",
    icon: FileText,
  },
  {
    id: PANELS.ADVOGADOS,
    label: "Advogados",
    icon: UserPlus,
    adminOnly: true,
  },
  {
    id: PANELS.PLANOS,
    label: "Planos",
    icon: CreditCard,
  },
  {
    id: PANELS.CONTATO,
    label: "Contato",
    icon: Phone,
  },
  {
    id: PANELS.CONFIG,
    label: "Configurações",
    icon: Settings,
  },
];

export default function AppSidebar() {
  const { activePanel, openPanel, closePanel } = usePanel();
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
        ).map(({ id, label, icon: Icon, href }) => {
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
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}