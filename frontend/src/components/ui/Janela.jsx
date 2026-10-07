"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

/**
 * Janela (diálogo modal) genérica do sistema. Fecha no Esc, no fundo ou no
 * X; devolve o foco a quem a abriu. Para "tem certeza?", use o
 * ConfirmacaoContext.
 */
export default function Janela({ titulo, onFechar, children, largura = 460 }) {
  const idTitulo = useId();
  const janelaRef = useRef(null);

  useEffect(() => {
    const focoAnterior = document.activeElement;
    janelaRef.current?.focus();
    function aoTeclar(evento) {
      if (evento.key === "Escape") {
        evento.stopPropagation();
        onFechar();
      }
    }
    // Captura: o Esc fecha só a janela, não o painel que está atrás.
    window.addEventListener("keydown", aoTeclar, true);
    return () => {
      window.removeEventListener("keydown", aoTeclar, true);
      focoAnterior?.focus?.();
    };
  }, [onFechar]);

  return (
    <>
      <div className="confirmacao-fundo" onClick={onFechar} aria-hidden="true" />
      <div
        ref={janelaRef}
        className="janela"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        style={{ width: `min(${largura}px, calc(100vw - 32px))` }}
      >
        <div className="janela-topo">
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="icon-btn" onClick={onFechar} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="janela-corpo">{children}</div>
      </div>
    </>
  );
}
