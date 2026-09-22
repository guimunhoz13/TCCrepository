"use client";

import { createContext, useContext, useState, useCallback } from "react";

const PanelContext = createContext(null);

export const PANELS = {
  CLIENTES: "clientes",
  PROCESSOS: "processos",
  DOCUMENTOS: "documentos",
  AGENDA: "agenda",
  CONTRATOS: "contratos",
  HORAS: "horas",
  TAREFAS: "tarefas",
  MODELOS: "modelos",
  CONTATO: "contato",
  CONFIG: "config",
  ADVOGADOS: "advogados",
  PLANOS: "planos",
};

export function PanelProvider({ children }) {
  const [activePanel, setActivePanel] = useState(null);
  const [panelTab, setPanelTab] = useState("lista");
  // Dados extras da aba atual (ex.: qual registro abrir numa aba de
  // detalhe oculta, como a ficha do processo) — genérico de propósito,
  // pra servir qualquer painel sem crescer um campo por caso de uso.
  const [panelParams, setPanelParams] = useState({});

  const openPanel = useCallback((panel, tab = "lista", params = {}) => {
    setActivePanel(panel);
    setPanelTab(tab);
    setPanelParams(params);
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
    setPanelTab("lista");
    setPanelParams({});
  }, []);

  return (
    <PanelContext.Provider
      value={{
        activePanel,
        panelTab,
        panelParams,
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
