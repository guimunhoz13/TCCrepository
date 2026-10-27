"use client";

import { useCallback, useEffect, useRef } from "react";
import { HelpCircle, X } from "lucide-react";
import { usePanel } from "@/contexts/PanelContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAjuda } from "@/contexts/AjudaContext";
import GuiaContextual from "@/components/shell/GuiaContextual";
import { usePermissoes } from "@/hooks/usePermissoes";
import DetalheResultado from "./DetalheResultado";

const AREA_DE_PERMISSAO = {
  clientes: "clientes",
  processos: "processos",
  documentos: "documentos",
  agenda: "agenda",
  contratos: "financeiro",
  horas: "horas",
  tarefas: "tarefas",
  modelos: "modelos",
  advogados: "advogados",
};

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
    panelParams = {},
    closePanel,
    setPanelTab,
  } = usePanel();
  const { t } = usePreferences();
  const { abrirAjuda } = useAjuda();
  const pode = usePermissoes();
  const painelRef = useRef(null);
  const focoAnteriorRef = useRef(null);

  const tentarFechar = useCallback(() => {
    const evento = new CustomEvent("lexnexo:tentar-fechar-painel", { cancelable: true });
    if (window.dispatchEvent(evento)) closePanel();
  }, [closePanel]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        tentarFechar();
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
  }, [activePanel, tentarFechar]);

  if (!activePanel) {
    return null;
  }

  const areaPermissao = AREA_DE_PERMISSAO[activePanel];
  const somenteLeitura = areaPermissao &&
    pode(areaPermissao, "ver") &&
    !pode(areaPermissao, "criar") &&
    !pode(areaPermissao, "editar");

  return (
    <>
      <div
        className="overlay-backdrop"
        onClick={tentarFechar}
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
              onClick={tentarFechar}
              aria-label={t("acao_fechar")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {tabs.length > 0 && (
          <div className="overlay-tabs" aria-label="Seções desta área">
            {panelParams.registroId && <button type="button"
              aria-current={panelTab === "detalhe" ? "page" : undefined}
              className={`tab-btn ${panelTab === "detalhe" ? "active" : ""}`}
              onClick={() => setPanelTab("detalhe")}>Detalhe</button>}
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

        {somenteLeitura && (
          <p className="aviso-somente-leitura" role="status">
            Seu perfil tem acesso somente para consulta nesta área. Para criar ou alterar
            registros, solicite a um administrador a revisão do seu perfil de acesso.
          </p>
        )}

        {/* Focável para quem rola o conteúdo pelo teclado (setas, PgDn). */}
        <div className="overlay-body" tabIndex={0} role="region" aria-labelledby="overlay-panel-title">
          {panelTab === "detalhe" && panelParams.registroId
            ? <DetalheResultado painel={activePanel} registroId={panelParams.registroId} />
            : children}
        </div>
      </div>
    </>
  );
}
