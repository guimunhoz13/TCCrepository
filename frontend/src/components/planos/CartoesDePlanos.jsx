"use client";

import { Check, Star } from "lucide-react";

export function precoDoPlano(plano) {
  if (!plano.preco_mensal) return { valor: "Grátis", periodo: "para sempre" };
  return { valor: `R$ ${plano.preco_mensal}`, periodo: "/mês" };
}

/**
 * Cartões dos planos, usados na página inicial e no painel de planos.
 *
 * `atual` é o id do plano do escritório (ou nada, na página inicial); o
 * cartão em destaque é o plano atual ou, sem ele, o primeiro plano pago.
 * `acao(plano)` devolve o botão de cada cartão.
 */
export default function CartoesDePlanos({ planos, atual, acao }) {
  const destaque = atual || planos.find((p) => p.preco_mensal > 0)?.id;

  return (
    <div className="plans-grid">
      {planos.map((plano) => {
        const preco = precoDoPlano(plano);
        const ehAtual = plano.id === atual;
        return (
          <article
            key={plano.id}
            className={`plan-card ${plano.id === destaque ? "featured" : ""}`}
            aria-label={`Plano ${plano.nome}`}
          >
            {ehAtual ? (
              <span className="badge badge-success" style={{ alignSelf: "flex-start" }}>
                <Check size={12} style={{ marginRight: 4 }} aria-hidden="true" />
                Plano atual
              </span>
            ) : (
              !atual && plano.id === destaque && (
                <span className="badge badge-muted" style={{ alignSelf: "flex-start" }}>
                  <Star size={12} style={{ marginRight: 4 }} aria-hidden="true" />
                  Mais completo para crescer
                </span>
              )
            )}
            <h4>{plano.nome}</h4>
            <div className="plan-price">
              {preco.valor}
              <span> {preco.periodo}</span>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{plano.descricao}</p>
            <ul className="plan-features">
              {plano.vantagens.map((vantagem) => (
                <li key={vantagem}>{vantagem}</li>
              ))}
            </ul>
            {acao(plano, ehAtual)}
          </article>
        );
      })}
    </div>
  );
}
