"use client";

import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  CalendarDays,
  Phone,
  Settings,
  UserPlus,
  CreditCard,
  CalendarClock,
  Bot,
  ScrollText,
  Timer,
  ListChecks,
  FileSignature,
  Menu,
  X,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { PANELS, usePanel } from "@/contexts/PanelContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import Logo from "@/components/ui/Logo";
import { useMenuMovel } from "@/contexts/MenuMovelContext";
import { usePermissoes } from "@/hooks/usePermissoes";

const NAV_ITEMS = [
  {
    id: "dashboard",
    tKey: "nav_dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: PANELS.CLIENTES,
    area: "clientes",
    tKey: "nav_clientes",
    icon: Users,
  },
  {
    id: PANELS.PROCESSOS,
    area: "processos",
    tKey: "nav_processos",
    icon: Briefcase,
  },
  {
    id: PANELS.AGENDA,
    area: "agenda",
    tKey: "nav_agenda",
    icon: CalendarDays,
  },
  {
    id: "compromissos",
    area: "agenda",
    tKey: "nav_compromissos",
    icon: CalendarClock,
    href: "/dashboard/compromissos",
  },
  {
    id: "assistente-ia",
    area: "ia",
    tKey: "nav_assistente",
    icon: Bot,
    href: "/assistente-ia",
  },
  {
    id: PANELS.DOCUMENTOS,
    area: "documentos",
    tKey: "nav_documentos",
    icon: FileText,
  },
  {
    id: PANELS.CONTRATOS,
    area: "financeiro",
    tKey: "nav_contratos",
    icon: ScrollText,
  },
  {
    id: PANELS.HORAS,
    area: "horas",
    tKey: "nav_horas",
    icon: Timer,
  },
  {
    id: PANELS.TAREFAS,
    area: "tarefas",
    tKey: "nav_tarefas",
    icon: ListChecks,
  },
  {
    id: PANELS.MODELOS,
    area: "modelos",
    tKey: "nav_modelos",
    icon: FileSignature,
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

// Atalhos da barra inferior no celular: as quatro telas mais usadas e o
// botão que abre o menu completo.
const ATALHOS_CELULAR = ["dashboard", PANELS.CLIENTES, PANELS.PROCESSOS, PANELS.AGENDA];

export default function AppSidebar() {
  const { activePanel, openPanel, closePanel } = usePanel();
  const menuMovel = useMenuMovel();
  const pode = usePermissoes();
  const { t } = usePreferences();
  const router = useRouter();
  const pathname = usePathname();

  const usuario = useUsuarioLogado();

  function estaAtivo({ id, href }) {
    const isDashboard = id === "dashboard";
    if (href && pathname === href && !isDashboard) return true;
    if (!href && !isDashboard && activePanel === id) return true;
    return isDashboard && pathname === "/dashboard" && !activePanel;
  }

  function handleNav(item) {
    menuMovel.fechar();

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

  const itensVisiveis = NAV_ITEMS.filter(
    (item) =>
      (!item.adminOnly || usuario?.tipo_usuario === "admin") &&
      (!item.area || pode(item.area))
  );
  const atalhos = ATALHOS_CELULAR.map((id) => itensVisiveis.find((item) => item.id === id)).filter(
    Boolean
  );

  return (
    <>
      {menuMovel.aberto && (
        <div className="sidebar-backdrop" onClick={menuMovel.fechar} aria-hidden="true" />
      )}

      <aside
        id="menu-principal"
        className={`sidebar ${menuMovel.aberto ? "aberta" : ""}`}
        aria-label="Menu principal"
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Logo size={22} />
          </div>

          <div>
            <h1>LexOffice</h1>
            <p>{usuario?.escritorio_nome || "ERP Jurídico"}</p>
          </div>

          <button
            type="button"
            className="sidebar-fechar"
            onClick={menuMovel.fechar}
            aria-label="Fechar o menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {itensVisiveis.map(({ id, tKey, icon: Icon, href }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${estaAtivo({ id, href }) ? "active" : ""}`}
              aria-current={estaAtivo({ id, href }) ? "page" : undefined}
              onClick={() => handleNav({ id, href })}
            >
              <Icon size={18} />
              <span>{t(tKey)}</span>
            </button>
          ))}
        </nav>
      </aside>

      <nav className="barra-inferior" aria-label="Atalhos">
        {atalhos.map(({ id, tKey, icon: Icon, href }) => (
          <button
            key={id}
            type="button"
            className={`barra-inferior-item ${estaAtivo({ id, href }) ? "active" : ""}`}
            aria-current={estaAtivo({ id, href }) ? "page" : undefined}
            onClick={() => handleNav({ id, href })}
          >
            <Icon size={20} />
            <span>{t(tKey)}</span>
          </button>
        ))}
        <button
          type="button"
          className="barra-inferior-item"
          onClick={menuMovel.abrir}
          aria-expanded={menuMovel.aberto}
          aria-controls="menu-principal"
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
}
