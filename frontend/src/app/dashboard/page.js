"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import {
  getDashboardStats,
  getProcessos,
  getAgenda,
  normalizarLista,
} from "@/services/api";

function DashboardContent() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [processos, setProcessos] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const recarregarAgenda = useCallback(async () => {
    try {
      const dadosAgenda = await getAgenda();
      setAgenda(normalizarLista(dadosAgenda));
    } catch {
      /* silencioso */
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      router.replace("/");
      return;
    }

    async function carregar() {
      try {
        const [dadosStats, dadosProcessos, dadosAgenda] = await Promise.all([
          getDashboardStats(),
          getProcessos(),
          getAgenda(),
        ]);

        setStats(dadosStats);
        setProcessos(normalizarLista(dadosProcessos));
        setAgenda(normalizarLista(dadosAgenda));
      } catch (error) {
        if (error.message.includes("401") || error.message.includes("token")) {
          router.replace("/");
          return;
        }
        setErro(error.message);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [router]);

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

        <div className="stats-grid">
          {[
            ["Clientes", totais.clientes],
            ["Processos", totais.processos],
            ["Audiências", totais.agenda],
            ["Documentos", totais.documentos],
          ].map(([label, valor]) => (
            <div key={label} className="stat-card">
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

          <MiniCalendar eventos={agenda} onEventoCriado={recarregarAgenda} />
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
    <PanelProvider>
      <DashboardContent />
    </PanelProvider>
  );
}
