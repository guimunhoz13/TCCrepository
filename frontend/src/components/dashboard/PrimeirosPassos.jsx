"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Rocket,
  X,
} from "lucide-react";
import { usePanel } from "@/contexts/PanelContext";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import { usePermissoes } from "@/hooks/usePermissoes";
import {
  escritorioAindaVazio,
  primeirosPassos,
  progressoDosPassos,
} from "@/lib/onboarding";

const ETAPAS_TOUR = [
  {
    titulo: "Seu dia começa na dashboard",
    texto:
      "Prazos, tarefas e compromissos que exigem atenção aparecem primeiro. Os cartões abaixo levam à lista completa de cada área.",
  },
  {
    titulo: "Cadastre na ordem certa",
    texto:
      "Comece pelo cliente, crie o processo e depois associe prazos, documentos e contratos. O checklist mostra sempre o próximo passo disponível.",
  },
  {
    titulo: "Use os atalhos do topo",
    texto:
      "Novo cliente, novo processo e nova audiência abrem diretamente o formulário. A busca encontra informações em todo o escritório.",
  },
  {
    titulo: "A ajuda acompanha a tela",
    texto:
      "Os blocos dourados explicam cada área. O botão de interrogação abre instruções e exemplos do assunto que você está usando.",
  },
  {
    titulo: "Confira antes de concluir",
    texto:
      "Revise prazos, valores, destinatários e textos criados com IA. O LexNexo organiza o trabalho, mas a decisão jurídica continua sendo do profissional.",
  },
];

function Tour({ etapa, setEtapa, onFechar }) {
  const caixaRef = useRef(null);
  const ultima = etapa === ETAPAS_TOUR.length - 1;
  const atual = ETAPAS_TOUR[etapa];

  useEffect(() => {
    const focoAnterior = document.activeElement;
    const caixa = caixaRef.current;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    caixa?.focus();

    function aoTeclar(evento) {
      if (evento.key === "Escape") {
        onFechar();
        return;
      }
      if (evento.key !== "Tab" || !caixa) return;
      const focaveis = caixa.querySelectorAll('button:not(:disabled), [tabindex]:not([tabindex="-1"])');
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    window.addEventListener("keydown", aoTeclar);
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
      if (focoAnterior?.isConnected) focoAnterior.focus();
    };
  }, [onFechar]);

  return (
    <>
      <div className="overlay-backdrop onboarding-backdrop" aria-hidden="true" onClick={onFechar} />
      <section
        className="onboarding-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-titulo"
        tabIndex={-1}
        ref={caixaRef}
      >
        <header className="onboarding-dialog-header">
          <span className="onboarding-dialog-icon" aria-hidden="true"><Rocket size={22} /></span>
          <div>
            <span className="onboarding-etapa">Passo {etapa + 1} de {ETAPAS_TOUR.length}</span>
            <h2 id="onboarding-titulo">{atual.titulo}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onFechar} aria-label="Fechar apresentação">
            <X size={18} />
          </button>
        </header>

        <div className="onboarding-dialog-body">
          <p>{atual.texto}</p>
          <div className="onboarding-pontos" aria-label={`Passo ${etapa + 1} de ${ETAPAS_TOUR.length}`}>
            {ETAPAS_TOUR.map((item, indice) => (
              <span key={item.titulo} className={indice === etapa ? "active" : ""} aria-hidden="true" />
            ))}
          </div>
        </div>

        <footer className="onboarding-dialog-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setEtapa((valor) => Math.max(0, valor - 1))}
            disabled={etapa === 0}
          >
            <ArrowLeft size={16} /> Anterior
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => ultima ? onFechar() : setEtapa((valor) => valor + 1)}
          >
            {ultima ? <><Check size={16} /> Começar a usar</> : <>Próximo <ArrowRight size={16} /></>}
          </button>
        </footer>
      </section>
    </>
  );
}

export default function PrimeirosPassos({ stats, carregando }) {
  const { openPanel } = usePanel();
  const usuario = useUsuarioLogado();
  const pode = usePermissoes();
  const [tourAberto, setTourAberto] = useState(false);
  const [etapa, setEtapa] = useState(0);

  const passos = useMemo(
    () => primeirosPassos({ stats, usuario, pode }),
    [stats, usuario, pode]
  );
  const progresso = progressoDosPassos(passos);
  const identificador = usuario?.id || usuario?.email || "usuario";
  const chaveTour = `lexnexo:onboarding:v1:${identificador}`;

  useEffect(() => {
    if (carregando || !stats || !usuario || !escritorioAindaVazio(stats)) return;
    if (localStorage.getItem(chaveTour)) return;
    const abertura = setTimeout(() => setTourAberto(true), 0);
    return () => clearTimeout(abertura);
  }, [carregando, stats, usuario, chaveTour]);

  function abrirTour() {
    setEtapa(0);
    setTourAberto(true);
  }

  const fecharTour = useCallback(() => {
    localStorage.setItem(chaveTour, "visto");
    setTourAberto(false);
  }, [chaveTour]);

  if (carregando || !stats || progresso.total === 0 || progresso.percentual === 100) {
    return tourAberto ? <Tour etapa={etapa} setEtapa={setEtapa} onFechar={fecharTour} /> : null;
  }

  return (
    <>
      <section className="primeiros-passos" aria-labelledby="primeiros-passos-titulo">
        <header className="primeiros-passos-header">
          <div>
            <span className="primeiros-passos-selo"><Rocket size={14} /> Primeiros passos</span>
            <h3 id="primeiros-passos-titulo">Configure seu LexNexo</h3>
            <p>{progresso.concluidos} de {progresso.total} etapas concluídas</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={abrirTour}>
            Ver apresentação
          </button>
        </header>

        <div
          className="primeiros-passos-barra"
          role="progressbar"
          aria-label="Progresso da configuração inicial"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={progresso.percentual}
        >
          <span style={{ width: `${progresso.percentual}%` }} />
        </div>

        <div className="primeiros-passos-lista">
          {passos.map((passo) => (
            <article key={passo.id} className={`primeiro-passo ${passo.concluido ? "concluido" : ""}`}>
              <span className="primeiro-passo-status" aria-hidden="true">
                {passo.concluido ? <CheckCircle2 size={21} /> : <Circle size={21} />}
              </span>
              <div>
                <h4>{passo.titulo}</h4>
                <p>{passo.descricao}</p>
              </div>
              {passo.concluido ? (
                <span className="primeiro-passo-concluido"><Check size={14} /> Concluído</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => openPanel(passo.painel, passo.aba)}
                >
                  {passo.acao}
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      {tourAberto && <Tour etapa={etapa} setEtapa={setEtapa} onFechar={fecharTour} />}
    </>
  );
}
