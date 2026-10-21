"use client";

import { ArrowRight, Inbox } from "lucide-react";

/** Estado vazio com contexto e próximo passo, utilizável dentro ou fora de tabelas. */
export default function EstadoVazio({ titulo, descricao, acao, onAcao }) {
  return (
    <div className="estado-vazio-orientado">
      <span className="estado-vazio-icone" aria-hidden="true"><Inbox size={20} /></span>
      <div>
        <strong>{titulo}</strong>
        {descricao && <p>{descricao}</p>}
      </div>
      {acao && onAcao && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onAcao}>
          {acao} <ArrowRight size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
