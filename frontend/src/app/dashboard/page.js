"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  RefreshCw,
  Newspaper,
  Users,
  Briefcase,
  CalendarDays,
  FileText,
  ArrowUpRight,
  UserPlus,
  FilePlus,
  CalendarPlus,
  Clock,
  AlertTriangle,
} from "lucide-react";
import AppSidebar from "@/components/shell/AppSidebar";
import TopBar from "@/components/shell/TopBar";
import AppFooter from "@/components/shell/AppFooter";
import ChartsSection from "@/components/dashboard/ChartsSection";
import FinanceiroSection from "@/components/dashboard/FinanceiroSection";
import MiniCalendar from "@/components/dashboard/MiniCalendar";
import NoticiasSection from "@/components/dashboard/NoticiasSection";
import ClientesPanel from "@/components/panels/ClientesPanel";
import ProcessosPanel from "@/components/panels/ProcessosPanel";
import AgendaPanel from "@/components/panels/AgendaPanel";
import DocumentosPanel from "@/components/panels/DocumentosPanel";
import ContratosPanel from "@/components/panels/ContratosPanel";
import HorasPanel from "@/components/panels/HorasPanel";
import TarefasPanel from "@/components/panels/TarefasPanel";
import ModelosPanel from "@/components/panels/ModelosPanel";
import ContatoPanel from "@/components/panels/ContatoPanel";
import ConfigPanel from "@/components/panels/ConfigPanel";
import AdvogadosPanel from "@/components/panels/AdvogadosPanel";
import PlanosPanel from "@/components/panels/PlanosPanel";
import Avatar from "@/components/ui/Avatar";
import { PanelProvider, usePanel, PANELS } from "@/contexts/PanelContext";
import { DashboardDataProvider, useDashboardData } from "@/contexts/DashboardDataContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import useRegistroDeAtividade from "@/hooks/useRegistroDeAtividade";
import { useAgora } from "@/hooks/useAgora";
import { useAvisos } from "@/contexts/AvisosContext";
import { usePermissoes } from "@/hooks/usePermissoes";
import { badgeStatus, rotuloStatus } from "@/lib/statusProcesso";
import { abrirDocumento } from "@/services/api";
import GuiaContextual from "@/components/shell/GuiaContextual";
import PrimeirosPassos from "@/components/dashboard/PrimeirosPassos";
import { resumirAlertasAgenda, selecionarAlertasAgenda } from "@/lib/alertasAgenda";

function formatarPrazoTarefa(prazo) {
  // "2026-09-21" montado com hora zero local: sem isso o fuso de Brasília
  // mostraria o dia anterior.
  const data = new Date(`${prazo}T00:00:00`);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dias = Math.round((data - hoje) / 86400000);
  if (dias < 0) return `Venceu ${data.toLocaleDateString("pt-BR")}`;
  if (dias === 0) return "Vence hoje";
  if (dias === 1) return "Vence amanhã";
  return `Vence em ${dias} dias`;
}

function StatCard({ icon: Icon, label, valor, novos, carregando, pulsar, onVerTodos }) {
  return (
    <div className={`stat-card ${pulsar ? "updated" : ""}`}>
      <div className="stat-card-top">
        <span className="stat-card-icon">
          <Icon size={19} />
        </span>
        <button type="button" className="stat-card-link" onClick={onVerTodos}>
          Ver todos <ArrowUpRight size={13} />
        </button>
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">
        {carregando ? <span className="skeleton skeleton-valor" /> : valor ?? 0}
      </div>
      <div className={`stat-card-trend ${novos > 0 ? "up" : ""}`}>
        {novos > 0 ? `+${novos} nesta semana` : "sem novidades esta semana"}
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  useRegistroDeAtividade();
  const {
    stats,
    processos,
    agenda,
    documentos,
    tarefas,
    novosNaSemana,
    carregando,
    erro,
    versaoDados,
    atualizadoEm,
    refresh,
  } = useDashboardData();
  const agora = useAgora();
  const avisar = useAvisos();
  const pode = usePermissoes();
  const { openPanel } = usePanel();
  const [pulsar, setPulsar] = useState(false);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  // Uma página independente pode enviar o usuário de volta à dashboard já
  // com o painel escolhido. Isso impede que fechar Clientes/Agenda/etc. o
  // devolva para a tela anterior e gere a sensação de estar preso nela.
  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const painel = parametros.get("painel");
    if (!painel || !Object.values(PANELS).includes(painel)) return;
    openPanel(painel, "lista");
    router.replace("/dashboard", { scroll: false });
  }, [openPanel, router]);

  useEffect(() => {
    if (erro && (erro.includes("401") || erro.toLowerCase().includes("token"))) {
      router.replace("/login");
    }
  }, [erro, router]);

  // Pisca o indicador "dados em tempo real" quando chega uma resposta nova
  // (não na primeira carga).
  useEffect(() => {
    if (!versaoDados) return undefined;
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return undefined;
    }
    const inicio = setTimeout(() => setPulsar(true), 0);
    const fim = setTimeout(() => setPulsar(false), 1200);
    return () => {
      clearTimeout(inicio);
      clearTimeout(fim);
    };
  }, [versaoDados]);

  const totais = stats?.totais || {};

  // A lista já vem do back-end filtrada (minhas, em aberto) e ordenada por
  // prioridade e prazo; aqui só se corta o que cabe no cartão.
  const minhasTarefas = useMemo(() => tarefas.slice(0, 5), [tarefas]);

  const proximosCompromissos = useMemo(() => {
    return agenda
      .filter(
        (e) =>
          e.tipo === "compromisso" &&
          !e.cumprido &&
          new Date(e.data_evento).getTime() >= agora
      )
      .sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento))
      .slice(0, 5);
  }, [agenda, agora]);

  const alertasAgenda = useMemo(
    () => selecionarAlertasAgenda(agenda, agora, { diasFuturos: 7, limite: 8 }),
    [agenda, agora]
  );

  const prazosEmAtencao = useMemo(() => {
    return selecionarAlertasAgenda(agenda, agora, {
      diasFuturos: 3,
      limite: 5,
      somentePrazos: true,
    });
  }, [agenda, agora]);

  const alertasCriticos = useMemo(
    () => alertasAgenda.filter((alerta) => alerta.fatal || alerta.vencido),
    [alertasAgenda]
  );
  const resumoCritico = useMemo(() => resumirAlertasAgenda(alertasCriticos), [alertasCriticos]);

  // Já vêm do servidor como os cinco mais recentes.
  const ultimosDocumentos = documentos;

  // Cada grupo de resultado já sabe a que painel pertence.
  function abrirResultadoBusca(painel, item) {
    if (painel === PANELS.PROCESSOS) {
      openPanel(painel, "ficha", { processoId: item.id });
    } else {
      openPanel(painel, "detalhe", { registroId: item.id });
    }
  }

  return (
    <div className="app-shell">
      <AppSidebar />

      <main id="conteudo-principal" className="app-main">
        <TopBar
          showGreeting
          subtitle={
            stats?.escritorio?.nome
              ? `${stats.escritorio.nome} — visão geral`
              : "Visão geral do escritório"
          }
          comBusca
          onSelectSearchResult={abrirResultadoBusca}
          notificacoes={alertasAgenda}
          onSelectNotificacao={() => openPanel(PANELS.AGENDA, "lista")}
          ajudaAssunto="dashboard"
        />

        <GuiaContextual assunto="dashboard" titulo="Comece por aqui" />

        <PrimeirosPassos stats={stats} carregando={carregando} />

        {erro && <div className="alert alert-error">{erro}</div>}

        {alertasCriticos.length > 0 && (
          <section className="alerta-agenda-critica" aria-labelledby="alerta-agenda-titulo">
            <span className="alerta-agenda-icone" aria-hidden="true">
              <AlertTriangle size={20} />
            </span>
            <div>
              <strong id="alerta-agenda-titulo">Revise sua agenda agora</strong>
              <p>
                {resumoCritico.fatais > 0 &&
                  `${resumoCritico.fatais} ${resumoCritico.fatais === 1 ? "prazo fatal" : "prazos fatais"}`}
                {resumoCritico.fatais > 0 && resumoCritico.vencidos > 0 ? " e " : ""}
                {resumoCritico.vencidos > 0 &&
                  `${resumoCritico.vencidos} ${resumoCritico.vencidos === 1 ? "item vencido" : "itens vencidos"}`}
                {" exigem conferência. Marque o que já foi cumprido para retirar o alerta."}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => openPanel(PANELS.AGENDA, "lista")}
            >
              Revisar agenda
            </button>
          </section>
        )}

        <div className="dashboard-toolbar">
          <div className="quick-actions-bar">
            {pode("clientes", "criar") && (
              <button
                type="button"
                className="quick-action-btn"
                onClick={() => openPanel(PANELS.CLIENTES, "novo")}
              >
                <UserPlus size={16} /> Novo cliente
              </button>
            )}
            {pode("processos", "criar") && (
              <button
                type="button"
                className="quick-action-btn"
                onClick={() => openPanel(PANELS.PROCESSOS, "novo")}
              >
                <FilePlus size={16} /> Novo processo
              </button>
            )}
            {pode("agenda", "criar") && (
              <button
                type="button"
                className="quick-action-btn"
                onClick={() => openPanel(PANELS.AGENDA, "novo")}
              >
                <CalendarPlus size={16} /> Nova audiência
              </button>
            )}
            {pode("ia") && (
              <Link href="/assistente-ia" className="btn btn-primary ai-quick-btn">
                <Bot size={18} />
                Abrir Assistente IA
              </Link>
            )}
            <a href="#noticias" className="btn btn-secondary">
              <Newspaper size={18} />
              Conferir notícias
            </a>
          </div>

          <button type="button" className={`sync-indicator ${pulsar ? "pulsing" : ""}`}
            onClick={refresh} disabled={carregando} aria-label="Atualizar dados do painel">
            <RefreshCw size={13} className={pulsar ? "spin" : ""} />
            {carregando ? "Atualizando…" : pulsar ? "Atualizado agora" : atualizadoEm
              ? `Atualizado às ${new Date(atualizadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
              : "Atualizar dados"}
          </button>
        </div>

        {/* O que pede ação hoje vem primeiro: é para isso que se abre a
            dashboard de manhã. */}
        <div className="dashboard-grid dashboard-atencao">
          <div className="panel-card">
            <h3>Prazos em atenção</h3>
            {prazosEmAtencao.length === 0 ? (
              <div className="empty-state">
                Nenhum prazo vencido nem previsto para os próximos 3 dias.
              </div>
            ) : (
              <div className="list-widget">
                {prazosEmAtencao.map((evento) => {
                  const urgente = evento.vencido || evento.fatal || evento.dias === 0;
                  return (
                    <div
                      key={evento.id}
                      className={`compromisso-card ${urgente ? "urgente" : ""}`}
                    >
                      <div>
                        <h4 style={{ marginBottom: 4 }}>{evento.titulo}</h4>
                        <div className="compromisso-meta">
                          {evento.numero_processo && <span>Proc. {evento.numero_processo}</span>}
                        </div>
                      </div>
                      <span className="prazo-card-badges">
                        {evento.fatal && <span className="badge badge-danger">Prazo fatal</span>}
                        <span
                          className={`badge ${evento.vencido ? "badge-danger" : "badge-warning"}`}
                        >
                          {urgente ? <AlertTriangle size={12} /> : <Clock size={12} />} {evento.quando}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="panel-card">
            <h3>Minhas tarefas</h3>
            {minhasTarefas.length === 0 ? (
              <div className="empty-state">
                Nenhuma tarefa em aberto para você.
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginTop: 12 }}
                  onClick={() => openPanel(PANELS.TAREFAS, "nova")}
                >
                  Criar tarefa
                </button>
              </div>
            ) : (
              <div className="list-widget tarefas-widget">
                {minhasTarefas.map((tarefa) => (
                  <div
                    key={tarefa.id}
                    className={`compromisso-card ${tarefa.atrasada ? "urgente" : ""}`}
                  >
                    <div>
                      <h4 style={{ marginBottom: 4 }}>{tarefa.titulo}</h4>
                      <div className="compromisso-meta">
                        {tarefa.numero_processo && <span>Proc. {tarefa.numero_processo}</span>}
                        <span>{tarefa.prazo ? formatarPrazoTarefa(tarefa.prazo) : "Sem prazo"}</span>
                      </div>
                    </div>
                    <span
                      className={`badge ${tarefa.atrasada ? "badge-danger" : "badge-muted"}`}
                    >
                      {tarefa.atrasada ? (
                        <>
                          <AlertTriangle size={12} /> Atrasada
                        </>
                      ) : (
                        tarefa.prioridade_display
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {minhasTarefas.length > 0 && (
              <button
                type="button"
                className="stat-card-link"
                style={{ marginTop: 12 }}
                onClick={() => openPanel(PANELS.TAREFAS, "minhas")}
              >
                Ver todas <ArrowUpRight size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="stats-grid" style={{ marginTop: 18 }}>
          <StatCard
            icon={Users}
            label="Clientes"
            valor={totais.clientes}
            novos={novosNaSemana.clientes}
            carregando={carregando}
            pulsar={pulsar}
            onVerTodos={() => openPanel(PANELS.CLIENTES, "lista")}
          />
          <StatCard
            icon={Briefcase}
            label="Processos"
            valor={totais.processos}
            novos={novosNaSemana.processos}
            carregando={carregando}
            pulsar={pulsar}
            onVerTodos={() => openPanel(PANELS.PROCESSOS, "lista")}
          />
          <StatCard
            icon={CalendarDays}
            label="Audiências"
            valor={totais.agenda}
            novos={novosNaSemana.agenda}
            carregando={carregando}
            pulsar={pulsar}
            onVerTodos={() => openPanel(PANELS.AGENDA, "lista")}
          />
          <StatCard
            icon={FileText}
            label="Documentos"
            valor={totais.documentos}
            novos={novosNaSemana.documentos}
            carregando={carregando}
            pulsar={pulsar}
            onVerTodos={() => openPanel(PANELS.DOCUMENTOS, "lista")}
          />
        </div>

        {/* A API nem manda os valores para quem não tem acesso ao financeiro. */}
        {(carregando || stats?.financeiro) && (
          <FinanceiroSection financeiro={stats?.financeiro} carregando={carregando} />
        )}

        <div style={{ marginTop: 18 }}>
          <ChartsSection
            processosPorStatus={stats?.processos_por_status || []}
            financeiroMensal={stats?.financeiro_mensal ?? null}
          />
        </div>

        <div className="dashboard-grid" style={{ marginTop: 18 }}>
          <div className="panel-card">
            <h3>Próximos compromissos</h3>
            {proximosCompromissos.length === 0 ? (
              <div className="empty-state">
                Nenhum compromisso agendado.
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginTop: 12 }}
                  onClick={() => openPanel(PANELS.AGENDA, "novo")}
                >
                  Agendar compromisso
                </button>
              </div>
            ) : (
              <div className="list-widget">
                {proximosCompromissos.map((evento) => (
                  <div key={evento.id} className="compromisso-card">
                    <div>
                      <div className="compromisso-date">
                        {new Date(evento.data_evento).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <h4>{evento.titulo}</h4>
                      <div className="compromisso-meta">
                        {evento.numero_processo && <span>Proc. {evento.numero_processo}</span>}
                        {evento.local_evento && <span>{evento.local_evento}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="panel-card">
            <h3>Últimos documentos</h3>
            {ultimosDocumentos.length === 0 ? (
              <div className="empty-state">
                Nenhum documento enviado ainda.
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginTop: 12 }}
                  onClick={() => openPanel(PANELS.DOCUMENTOS, "novo")}
                >
                  Enviar documento
                </button>
              </div>
            ) : (
              <div className="list-widget">
                {ultimosDocumentos.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    className="doc-mini-card"
                    onClick={() => abrirDocumento(doc.id).catch((error) => avisar(error.message, "erro"))}
                  >
                    <span className="doc-mini-icon">
                      <FileText size={16} />
                    </span>
                    <span className="doc-mini-info">
                      <strong>{doc.nome_arquivo}</strong>
                      <span>Proc. {doc.numero_processo}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="panel-card">
            <h3>Processos recentes</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Processo</th>
                    <th>Cliente</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!carregando &&
                    processos.slice(0, 5).map((processo) => (
                      <tr
                        key={processo.id}
                        className="tr-clicavel"
                        onClick={(e) => {
                          if (e.target.closest("button, a")) return;
                          openPanel(PANELS.PROCESSOS, "ficha", { processoId: processo.id });
                        }}
                      >
                        <td>
                          <button
                            type="button"
                            className="link-celula"
                            aria-label={`Ver ficha do processo ${processo.numero_processo}`}
                            onClick={() =>
                              openPanel(PANELS.PROCESSOS, "ficha", { processoId: processo.id })
                            }
                          >
                            {processo.numero_processo}
                          </button>
                        </td>
                        <td>
                          <span className="avatar-cell">
                            <Avatar src={processo.cliente_foto} nome={processo.cliente_nome} size={24} />
                            {processo.cliente_nome}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${badgeStatus(processo.status)}`}>
                            {rotuloStatus(processo.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {!carregando && processos.length === 0 && (
                    <tr>
                      <td colSpan="3">Nenhum processo cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <MiniCalendar eventos={agenda} onEventoCriado={refresh} />
        </div>

        <NoticiasSection />

        <AppFooter />
      </main>

      <ClientesPanel />
      <ProcessosPanel />
      <AgendaPanel />
      <DocumentosPanel />
      <ContratosPanel />
      <HorasPanel />
      <TarefasPanel />
      <ModelosPanel />
      <ContatoPanel />
      <ConfigPanel />
      <AdvogadosPanel />
      <PlanosPanel />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PreferencesProvider>
      <DashboardDataProvider>
        <PanelProvider>
          <DashboardContent />
        </PanelProvider>
      </DashboardDataProvider>
    </PreferencesProvider>
  );
}
