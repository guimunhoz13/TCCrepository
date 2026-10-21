"use client";

import { useEffect, useRef } from "react";
import { HelpCircle, X } from "lucide-react";
import { usePanel } from "@/contexts/PanelContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAjuda } from "@/contexts/AjudaContext";
import GuiaContextual from "@/components/shell/GuiaContextual";

const PANEL_TITLE_KEYS = {
  clientes: "painel_clientes",
  processos: "painel_processos",
  documentos: "painel_documentos",
  agenda: "painel_agenda",
  contratos: "painel_contratos",
  horas: "painel_horas",
  tarefas: "painel_tarefas",
  modelos: "painel_modelos",
  contato: "painel_contato",
  config: "painel_config",
  advogados: "painel_advogados",
  planos: "painel_planos",
};

export default function OverlayPanel({
  tabs = [],
  children,
}) {
  const {
    activePanel,
    panelTab,
    closePanel,
    setPanelTab,
  } = usePanel();
  const { t } = usePreferences();
  const { abrirAjuda } = useAjuda();
  const painelRef = useRef(null);
  const focoAnteriorRef = useRef(null);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        closePanel();
        return;
      }
      if (event.key !== "Tab" || !painelRef.current?.contains(event.target)) return;
      const focaveis = painelRef.current.querySelectorAll(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
      }
    }

    if (activePanel) {
      focoAnteriorRef.current = document.activeElement;
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKeyDown);
      requestAnimationFrame(() => painelRef.current?.focus());
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      if (focoAnteriorRef.current?.isConnected) focoAnteriorRef.current.focus();
    };
  }, [activePanel, closePanel]);

  if (!activePanel) {
    return null;
  }

  return (
    <>
      <div
        className="overlay-backdrop"
        onClick={closePanel}
        aria-hidden="true"
      />

      <div
        className="overlay-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlay-panel-title"
        tabIndex={-1}
        ref={painelRef}
      >
        <div className="overlay-header">
          <h3 id="overlay-panel-title">
            {t(PANEL_TITLE_KEYS[activePanel]) || activePanel}
          </h3>

          <div style={{ display: "flex", gap: 4 }}>
            {/* O painel cobre a barra superior: sem este botão, a ajuda
                ficaria inalcançável justamente quando é mais útil. */}
            <button
              type="button"
              className="icon-btn"
              onClick={() => abrirAjuda(activePanel)}
              aria-label="Abrir a ajuda desta aba"
              title="Como esta aba funciona"
            >
              <HelpCircle size={18} />
            </button>

            <button
              type="button"
              className="icon-btn"
              onClick={closePanel}
              aria-label={t("acao_fechar")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {tabs.length > 0 && (
          <div className="overlay-tabs" aria-label="Seções desta área">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                aria-current={panelTab === tab.id ? "page" : undefined}
                className={`tab-btn ${
                  panelTab === tab.id ? "active" : ""
                }`}
                onClick={() => tab.onClick ? tab.onClick() : setPanelTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <GuiaContextual assunto={activePanel} />

        {/* Focável para quem rola o conteúdo pelo teclado (setas, PgDn). */}
        <div className="overlay-body" tabIndex={0} role="region" aria-labelledby="overlay-panel-title">
          {children}
        </div>
      </div>
    </>
  );
}
