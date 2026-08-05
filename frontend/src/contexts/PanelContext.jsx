"use client";

import { createContext, useContext, useState, useCallback } from "react";

const PanelContext = createContext(null);

export const PANELS = {
  CLIENTES: "clientes",
  PROCESSOS: "processos",
  DOCUMENTOS: "documentos",
  AGENDA: "agenda",
  CONTATO: "contato",
  CONFIG: "config",
};

export function PanelProvider({ children }) {
  const [activePanel, setActivePanel] = useState(null);
  const [panelTab, setPanelTab] = useState("lista");

  const openPanel = useCallback((panel, tab = "lista") => {
    setActivePanel(panel);
    setPanelTab(tab);
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
    setPanelTab("lista");
  }, []);

  return (
    <PanelContext.Provider
      value={{
        activePanel,
        panelTab,
        openPanel,
        closePanel,
        setPanelTab,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
}

export function usePanel() {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error("usePanel deve ser usado dentro de PanelProvider");
  }
  return context;
}
