"use client";

import { CircleHelp, Sparkles } from "lucide-react";
import { useAjuda } from "@/contexts/AjudaContext";
import { secaoDaAjuda } from "@/lib/ajuda";

/** Explica a área atual sem obrigar a pessoa a procurar a central de ajuda. */
export default function GuiaContextual({ assunto, titulo = "Para que serve esta área" }) {
  const { abrirAjuda } = useAjuda();
  const secao = secaoDaAjuda(assunto);

  if (!secao) return null;

  const destaques = secao.topicos.slice(0, 3).map((topico) => topico.titulo);

  return (
    <details className="guia-contextual guia-progressivo">
      <summary>
      <span className="guia-contextual-icone" aria-hidden="true">
        <Sparkles size={17} />
      </span>
      <span className="guia-contextual-texto">
        <strong>{titulo}</strong>
        <span className="guia-contextual-resumo">{secao.resumo}</span>
      </span>
      </summary>
      <div className="guia-contextual-detalhes">
        {destaques.length > 0 && (
          <p className="guia-contextual-destaques">
            Aqui você encontra: {destaques.join(" · ")}.
          </p>
        )}
      <button
        type="button"
        className="btn btn-secondary btn-sm guia-contextual-botao"
        onClick={() => abrirAjuda(assunto)}
      >
        <CircleHelp size={16} />
        Ver instruções e exemplos
      </button>
      </div>
    </details>
  );
}
