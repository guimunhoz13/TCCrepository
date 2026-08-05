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
} from "lucide-react";
import { PANELS, usePanel } from "@/contexts/PanelContext";
import { getUsuarioLogado } from "@/services/api";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: PANELS.CLIENTES, label: "Clientes", icon: Users },
  { id: PANELS.PROCESSOS, label: "Processos", icon: Briefcase },
  { id: PANELS.AGENDA, label: "Agenda", icon: CalendarDays },
  { id: PANELS.DOCUMENTOS, label: "Documentos", icon: FileText },
  { id: PANELS.CONTATO, label: "Contato", icon: Phone },
  { id: PANELS.CONFIG, label: "Configurações", icon: Settings },
];

export default function AppSidebar() {
  const { activePanel, openPanel, closePanel } = usePanel();
  const usuario = getUsuarioLogado();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Scale size={20} />
        </div>
        <div>
          <h1>LexOffice</h1>
          <p>{usuario?.escritorio_nome || "ERP Jurídico"}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isDashboard = id === "dashboard";
          const isActive = !isDashboard && activePanel === id;

          return (
            <button
              key={id}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => {
                if (isDashboard) {
                  closePanel();
                } else {
                  openPanel(id);
                }
              }}
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
