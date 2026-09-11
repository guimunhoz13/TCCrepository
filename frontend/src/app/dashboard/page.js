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
import MiniCalendar from "@/components/dashboard/MiniCalendar";
import NoticiasSection from "@/components/dashboard/NoticiasSection";
import ClientesPanel from "@/components/panels/ClientesPanel";
import ProcessosPanel from "@/components/panels/ProcessosPanel";
import AgendaPanel from "@/components/panels/AgendaPanel";
import DocumentosPanel from "@/components/panels/DocumentosPanel";
import ContratosPanel from "@/components/panels/ContratosPanel";
import ContatoPanel from "@/components/panels/ContatoPanel";
import ConfigPanel from "@/components/panels/ConfigPanel";
import AdvogadosPanel from "@/components/panels/AdvogadosPanel";
import PlanosPanel from "@/components/panels/PlanosPanel";
import Avatar from "@/components/ui/Avatar";
import { PanelProvider, usePanel, PANELS } from "@/contexts/PanelContext";
import { DashboardDataProvider, useDashboardData } from "@/contexts/DashboardDataContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";

function contarUltimosDias(lista, campoData, dias) {
  const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
  return lista.filter((item) => {
    const valor = item?.[campoData];
    return valor && new Date(valor).getTime() >= limite;
  }).length;
}

function formatarPrazo(dataISO) {
  const data = new Date(dataISO);
  const diffDias = Math.round(
    (new Date(data).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000
  );
  if (diffDias <= 0) return "Vence hoje";
  if (diffDias === 1) return "Em 1 dia";
  return `Em ${diffDias} dias`;
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
      <div className="stat-card-value">{carregando ? "..." : valor ?? 0}</div>
      <div className={`stat-card-trend ${novos > 0 ? "up" : ""}`}>
        {novos > 0 ? `+${novos} nesta semana` : "sem novidades esta semana"}
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const {
    stats,
    processos,
    agenda,
    clientes,
    documentos,
    carregando,
    erro,
    atualizadoEm,
    refresh,
  } = useDashboardData();
  const { openPanel } = usePanel();
  const [pulsar, setPulsar] = useState(false);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (erro && (erro.includes("401") || erro.toLowerCase().includes("token"))) {
      router.replace("/login");
    }
  }, [erro, router]);

  useEffect(() => {
    if (!atualizadoEm) return;
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    setPulsar(true);
    const timer = setTimeout(() => setPulsar(false), 1200);
    return () => clearTimeout(timer);
  }, [atualizadoEm]);

  const totais = stats?.totais || {};

  const proximosCompromissos = useMemo(() => {
    const agora = Date.now();
    return agenda
      .filter((e) => new Date(e.data_evento).getTime() >= agora)
      .sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento))
      .slice(0, 5);
  }, [agenda]);

  const prazosVencendo = useMemo(() => {
    const agora = Date.now();
    const limite = agora + 3 * 24 * 60 * 60 * 1000;
    return agenda
      .filter((e) => {
        const t = new Date(e.data_evento).getTime();
        return t >= agora && t <= limite;
      })
      .sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento))
      .slice(0, 5);
  }, [agenda]);

  const ultimosDocumentos = useMemo(
    () =>
      [...documentos]
        .sort((a, b) => new Date(b.enviado_em) - new Date(a.enviado_em))
        .slice(0, 5),
    [documentos]
  );

  function abrirResultadoBusca(tipo, item) {
    if (tipo === "clientes") openPanel(PANELS.CLIENTES, "lista");
    else if (tipo === "processos") openPanel(PANELS.PROCESSOS, "lista");
    else if (tipo === "documentos") openPanel(PANELS.DOCUMENTOS, "lista");
  }

  return (
    <div className="app-shell">
      <AppSidebar />

      <main className="app-main">
        <TopBar
          showGreeting
          subtitle={
            stats?.escritorio?.nome
              ? `${stats.escritorio.nome} — visão geral`
              : "Visão geral do escritório"
          }
          searchData={{ clientes, processos, documentos }}
          onSelectSearchResult={abrirResultadoBusca}
          notificacoes={prazosVencendo}
          onSelectNotificacao={() => openPanel(PANELS.AGENDA, "lista")}
        />

        {erro && <div className="alert alert-error">{erro}</div>}

        <div className="dashboard-hero">
          <div className="dashboard-hero-text">
            <h1>Gestão eficiente para mais tempo no que realmente importa: o seu cliente.</h1>
            <p>Clientes, processos, prazos e documentos num só lugar — atualizados em tempo real.</p>
          </div>
          <p className="dashboard-hero-quote">
            &ldquo;Um bom escritório não corre atrás de prazos — ele os antecipa.&rdquo;
          </p>
        </div>

        <div className="dashboard-toolbar">
          <div className="quick-actions-bar">
            <button
              type="button"
              className="quick-action-btn"
              onClick={() => openPanel(PANELS.CLIENTES, "novo")}
            >
              <UserPlus size={16} /> Novo cliente
            </button>
            <button
              type="button"
              className="quick-action-btn"
              onClick={() => openPanel(PANELS.PROCESSOS, "novo")}
            >
              <FilePlus size={16} /> Novo processo
            </button>
            <button
              type="button"
              className="quick-action-btn"
              onClick={() => openPanel(PANELS.AGENDA, "novo")}
            >
              <CalendarPlus size={16} /> Nova audiência
            </button>
            <Link href="/assistente-ia" className="btn btn-primary ai-quick-btn">
              <Bot size={18} />
              Abrir Assistente IA
            </Link>
            <a href="#noticias" className="btn btn-secondary">
              <Newspaper size={18} />
              Conferir notícias
            </a>
          </div>

          <span className={`sync-indicator ${pulsar ? "pulsing" : ""}`}>
            <RefreshCw size={13} className={pulsar ? "spin" : ""} />
            {pulsar ? "Atualizado agora" : "Dados em tempo real"}
          </span>
        </div>

        <div className="stats-grid">
          <StatCard
            icon={Users}
            label="Clientes"
            valor={totais.clientes}
            novos={contarUltimosDias(clientes, "criado_em", 7)}
            carregando={carregando}
            pulsar={pulsar}
            onVerTodos={() => openPanel(PANELS.CLIENTES, "lista")}
          />
          <StatCard
            icon={Briefcase}
            label="Processos"
            valor={totais.processos}
            novos={contarUltimosDias(processos, "criado_em", 7)}
            carregando={carregando}
            pulsar={pulsar}
            onVerTodos={() => openPanel(PANELS.PROCESSOS, "lista")}
          />
          <StatCard
            icon={CalendarDays}
            label="Audiências"
            valor={totais.agenda}
            novos={contarUltimosDias(agenda, "criado_em", 7)}
            carregando={carregando}
            pulsar={pulsar}
            onVerTodos={() => openPanel(PANELS.AGENDA, "lista")}
          />
          <StatCard
            icon={FileText}
            label="Documentos"
            valor={totais.documentos}
            novos={contarUltimosDias(documentos, "enviado_em", 7)}
            carregando={carregando}
            pulsar={pulsar}
            onVerTodos={() => openPanel(PANELS.DOCUMENTOS, "lista")}
          />
        </div>

        <div className="dashboard-grid" style={{ marginTop: 18 }}>
          <div className="panel-card">
            <h3>Próximos compromissos</h3>
            {proximosCompromissos.length === 0 ? (
              <div className="empty-state">Nenhum compromisso agendado.</div>
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
            <h3>Prazos vencendo</h3>
            {prazosVencendo.length === 0 ? (
              <div className="empty-state">Nenhum prazo nos próximos 3 dias.</div>
            ) : (
              <div className="list-widget">
                {prazosVencendo.map((evento) => {
                  const label = formatarPrazo(evento.data_evento);
                  const hoje = label === "Vence hoje";
                  return (
                    <div
                      key={evento.id}
                      className={`compromisso-card ${hoje ? "urgente" : ""}`}
                    >
                      <div>
                        <h4 style={{ marginBottom: 4 }}>{evento.titulo}</h4>
                        <div className="compromisso-meta">
                          {evento.numero_processo && <span>Proc. {evento.numero_processo}</span>}
                        </div>
                      </div>
                      <span className={`badge ${hoje ? "badge-danger" : "badge-warning"}`}>
                        {hoje ? <AlertTriangle size={12} /> : <Clock size={12} />} {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <ChartsSection
            processosPorStatus={stats?.processos_por_status || []}
            totais={totais}
          />
        </div>

        <div className="dashboard-grid dashboard-grid-inicio" style={{ marginTop: 18 }}>
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
                      <tr key={processo.id}>
                        <td>{processo.numero_processo}</td>
                        <td>
                          <span className="avatar-cell">
                            <Avatar src={processo.cliente_foto} nome={processo.cliente_nome} size={24} />
                            {processo.cliente_nome}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-muted">
                            {processo.status === "Concluido"
                              ? "Concluído"
                              : processo.status}
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

          <div className="panel-card">
            <h3>Últimos documentos</h3>
            {ultimosDocumentos.length === 0 ? (
              <div className="empty-state">Nenhum documento enviado ainda.</div>
            ) : (
              <div className="list-widget">
                {ultimosDocumentos.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.arquivo || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doc-mini-card"
                    onClick={(e) => {
                      if (!doc.arquivo) e.preventDefault();
                    }}
                  >
                    <span className="doc-mini-icon">
                      <FileText size={16} />
                    </span>
                    <span className="doc-mini-info">
                      <strong>{doc.nome_arquivo}</strong>
                      <span>Proc. {doc.numero_processo}</span>
                    </span>
                  </a>
                ))}
              </div>
            )}
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
