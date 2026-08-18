"use client";

import { useState } from "react";
import { usePanel } from "@/contexts/PanelContext";
import { useTheme } from "@/contexts/ThemeContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import { getUsuarioLogado } from "@/services/api";

export default function ConfigPanel() {
  const { activePanel } = usePanel();
  const { theme, setTheme } = useTheme();
  const usuario = getUsuarioLogado();

  if (activePanel !== "config") return null;

  return (
    <OverlayPanel>
      <div className="contact-grid">
        <div className="contact-item">
          <strong>Tema da interface</strong>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "6px 0 10px" }}>
            Escolha entre modo claro ou escuro para a interface.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className={`btn btn-sm ${theme === "light" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setTheme("light")}
            >
              Claro
            </button>
            <button
              className={`btn btn-sm ${theme === "dark" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setTheme("dark")}
            >
              Escuro
            </button>
          </div>
        </div>

        <div className="contact-item">
          <strong>Usuário logado</strong>
          <span style={{ display: "block", marginTop: 6 }}>
            {usuario?.nome}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {usuario?.email} — {usuario?.tipo_usuario}
          </span>
        </div>

        <div className="contact-item">
          <strong>Escritório</strong>
          <span style={{ display: "block", marginTop: 6 }}>
            {usuario?.escritorio_nome || "—"}
          </span>
        </div>
      </div>
    </OverlayPanel>
  );
}
