"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { usePanel } from "@/contexts/PanelContext";

const PANEL_TITLES = {
  clientes: "Clientes",
  processos: "Processos",
  documentos: "Documentos",
  agenda: "Agenda",
  contato: "Contato & Informações",
  config: "Configurações",
  advogados: "Advogados",
  planos: "Planos de Assinatura",
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
            {PANEL_TITLES[activePanel] || activePanel}
          </h3>

          <button
            type="button"
            className="icon-btn"
            onClick={closePanel}
            aria-label="Fechar"
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