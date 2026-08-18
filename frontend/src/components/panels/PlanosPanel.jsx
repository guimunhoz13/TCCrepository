"use client";

import { usePanel, PANELS } from "@/contexts/PanelContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import { Check, Star } from "lucide-react";

const PLANOS = [
  {
    id: "basico",
    nome: "Básico",
    preco: "R$ 99",
    descricao: "Ideal para escritórios pequenos começando a digitalizar.",
    features: [
      "Até 3 advogados",
      "50 processos ativos",
      "Agenda e calendário",
      "Upload de documentos (5 GB)",
      "Suporte por e-mail",
    ],
  },
  {
    id: "profissional",
    nome: "Profissional",
    preco: "R$ 249",
    descricao: "Para escritórios em crescimento com equipe maior.",
    featured: true,
    features: [
      "Até 15 advogados",
      "Processos ilimitados",
      "Dashboard com gráficos",
      "Upload de documentos (50 GB)",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
  },
  {
    id: "enterprise",
    nome: "Enterprise",
    preco: "R$ 499",
    descricao: "Solução completa para grandes bancas jurídicas.",
    features: [
      "Advogados ilimitados",
      "Processos ilimitados",
      "Multi-unidade",
      "Armazenamento ilimitado",
      "API de integração",
      "Gerente de conta dedicado",
    ],
  },
];

export default function PlanosPanel() {
  const { activePanel } = usePanel();

  if (activePanel !== PANELS.PLANOS) return null;

  return (
    <OverlayPanel>
      <p style={{ color: "var(--text-secondary)", marginBottom: 20, fontSize: "0.925rem" }}>
        Escolha o plano ideal para o seu escritório. Todos incluem isolamento
        de dados, agenda integrada e gestão de processos.
      </p>

      <div className="plans-grid">
        {PLANOS.map((plano) => (
          <div
            key={plano.id}
            className={`plan-card ${plano.featured ? "featured" : ""}`}
          >
            {plano.featured && (
              <span
                className="badge badge-muted"
                style={{ alignSelf: "flex-start" }}
              >
                <Star size={12} style={{ marginRight: 4 }} />
                Mais popular
              </span>
            )}
            <h4>{plano.nome}</h4>
            <div className="plan-price">
              {plano.preco}
              <span>/mês</span>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {plano.descricao}
            </p>
            <ul className="plan-features">
              {plano.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button
              className={`btn ${plano.featured ? "btn-primary" : "btn-secondary"}`}
              style={{ width: "100%" }}
            >
              {plano.featured ? (
                <>
                  <Check size={16} />
                  Plano atual
                </>
              ) : (
                "Saiba mais"
              )}
            </button>
          </div>
        ))}
      </div>
    </OverlayPanel>
  );
}
