"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { usePanel } from "@/contexts/PanelContext";
import { usePreferences } from "@/contexts/PreferencesContext";

const PANEL_TITLE_KEYS = {
  clientes: "painel_clientes",
  processos: "painel_processos",
  documentos: "painel_documentos",
  agenda: "painel_agenda",
  contratos: "painel_contratos",
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

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    if (activePanel) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
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
      >
        <div className="overlay-header">
          <h3 id="overlay-panel-title">
            {t(PANEL_TITLE_KEYS[activePanel]) || activePanel}
          </h3>

          <button
            type="button"
            className="icon-btn"
            onClick={closePanel}
            aria-label={t("acao_fechar")}
          >
            <X size={18} />
          </button>
        </div>

        {tabs.length > 0 && (
          <div className="overlay-tabs">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={`tab-btn ${
                  panelTab === tab.id ? "active" : ""
                }`}
                onClick={() => setPanelTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="overlay-body">
          {children}
        </div>
      </div>
    </>
  );
}