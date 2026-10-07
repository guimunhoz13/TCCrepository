"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmacaoContext = createContext(null);

/**
 * Janela de confirmação do próprio sistema, no lugar do window.confirm do
 * navegador (que não segue o tema, não explica a consequência e, em alguns
 * navegadores de celular, nem aparece).
 *
 * Uso: `if (!(await confirmar({ titulo, mensagem }))) return;`
 */
export function ConfirmacaoProvider({ children }) {
  const [pedido, setPedido] = useState(null);
  const resolverRef = useRef(null);

  const confirmar = useCallback((opcoes) => {
    return new Promise((resolver) => {
      resolverRef.current = resolver;
      setPedido({
        titulo: "Tem certeza?",
        acao: "Excluir",
        perigo: true,
        ...opcoes,
      });
    });
  }, []);

  const responder = useCallback((resposta) => {
    resolverRef.current?.(resposta);
    resolverRef.current = null;
    setPedido(null);
  }, []);

  return (
    <ConfirmacaoContext.Provider value={confirmar}>
      {children}
      {pedido && <JanelaConfirmacao pedido={pedido} onResponder={responder} />}
    </ConfirmacaoContext.Provider>
  );
}

function JanelaConfirmacao({ pedido, onResponder }) {
  const cancelarRef = useRef(null);
  const confirmarRef = useRef(null);
  const focoAnterior = useRef(null);

  useEffect(() => {
    focoAnterior.current = document.activeElement;
    // Em ação destrutiva o foco começa no "Cancelar": um Enter distraído
    // não apaga nada.
    (pedido.perigo ? cancelarRef : confirmarRef).current?.focus();
    return () => focoAnterior.current?.focus?.();
  }, [pedido]);

  useEffect(() => {
    function aoTeclar(evento) {
      if (evento.key === "Escape") {
        evento.stopPropagation();
        onResponder(false);
      }
      if (evento.key === "Tab") {
        const botoes = [cancelarRef.current, confirmarRef.current];
        const indice = botoes.indexOf(document.activeElement);
        evento.preventDefault();
        botoes[(indice + 1) % 2]?.focus();
      }
    }
    // Captura: o Esc fecha só a confirmação, não o painel que está atrás.
    window.addEventListener("keydown", aoTeclar, true);
    return () => window.removeEventListener("keydown", aoTeclar, true);
  }, [onResponder]);

  return (
    <>
      <div className="confirmacao-fundo" onClick={() => onResponder(false)} aria-hidden="true" />
      <div
        className="confirmacao-janela"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmacao-titulo"
        aria-describedby="confirmacao-mensagem"
      >
        <div className={`confirmacao-icone ${pedido.perigo ? "perigo" : ""}`}>
          <AlertTriangle size={22} />
        </div>
        <h2 id="confirmacao-titulo">{pedido.titulo}</h2>
        <p id="confirmacao-mensagem">{pedido.mensagem}</p>
        <div className="confirmacao-acoes">
          <button
            ref={cancelarRef}
            type="button"
            className="btn btn-secondary"
            onClick={() => onResponder(false)}
          >
            Cancelar
          </button>
          <button
            ref={confirmarRef}
            type="button"
            className={`btn ${pedido.perigo ? "btn-danger" : "btn-primary"}`}
            onClick={() => onResponder(true)}
          >
            {pedido.acao}
          </button>
        </div>
      </div>
    </>
  );
}

export function useConfirmacao() {
  const contexto = useContext(ConfirmacaoContext);
  if (!contexto) throw new Error("useConfirmacao deve ser usado dentro de ConfirmacaoProvider");
  return contexto;
}
