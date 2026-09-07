"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, RefreshCw } from "lucide-react";
import AppSidebar from "@/components/shell/AppSidebar";
import TopBar from "@/components/shell/TopBar";
import ChartsSection from "@/components/dashboard/ChartsSection";
import MiniCalendar from "@/components/dashboard/MiniCalendar";
import ClientesPanel from "@/components/panels/ClientesPanel";
import ProcessosPanel from "@/components/panels/ProcessosPanel";
import AgendaPanel from "@/components/panels/AgendaPanel";
import DocumentosPanel from "@/components/panels/DocumentosPanel";
import ContatoPanel from "@/components/panels/ContatoPanel";
import ConfigPanel from "@/components/panels/ConfigPanel";
import AdvogadosPanel from "@/components/panels/AdvogadosPanel";
import PlanosPanel from "@/components/panels/PlanosPanel";
import { PanelProvider } from "@/contexts/PanelContext";
import { DashboardDataProvider, useDashboardData } from "@/contexts/DashboardDataContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";

function DashboardContent() {
  const router = useRouter();
  const { stats, processos, agenda, carregando, erro, atualizadoEm, refresh } = useDashboardData();
  const [pulsar, setPulsar] = useState(false);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (erro && (erro.includes("401") || erro.toLowerCase().includes("token"))) {
      router.replace("/");
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
        />

        {erro && <div className="alert alert-error">{erro}</div>}

        <div className="dashboard-toolbar">
          <Link href="/assistente-ia" className="btn btn-primary ai-quick-btn">
            <Bot size={18} />
            Abrir Assistente IA
          </Link>

          <span className={`sync-indicator ${pulsar ? "pulsing" : ""}`}>
            <RefreshCw size={13} className={pulsar ? "spin" : ""} />
            {pulsar ? "Atualizado agora" : "Dados em tempo real"}
          </span>
        </div>

        <div className="stats-grid">
          {[
            ["Clientes", totais.clientes],
            ["Processos", totais.processos],
            ["Audiências", totais.agenda],
            ["Documentos", totais.documentos],
          ].map(([label, valor]) => (
            <div key={label} className={`stat-card ${pulsar ? "updated" : ""}`}>
              <div className="stat-card-label">{label}</div>
              <div className="stat-card-value">
                {carregando ? "..." : valor ?? 0}
              </div>
            </div>
          ))}
        </div>

        <ChartsSection
          processosPorStatus={stats?.processos_por_status || []}
          totais={totais}
        />

        <div className="dashboard-grid" style={{ marginTop: 18 }}>
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
                        <td>{processo.cliente_nome}</td>
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

          <MiniCalendar eventos={agenda} onEventoCriado={refresh} />
        </div>
      </main>

      <ClientesPanel />
      <ProcessosPanel />
      <AgendaPanel />
      <DocumentosPanel />
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
