"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/shell/AppSidebar";
import TopBar from "@/components/shell/TopBar";
import ClientesPanel from "@/components/panels/ClientesPanel";
import ProcessosPanel from "@/components/panels/ProcessosPanel";
import AgendaPanel from "@/components/panels/AgendaPanel";
import DocumentosPanel from "@/components/panels/DocumentosPanel";
import ContatoPanel from "@/components/panels/ContatoPanel";
import ConfigPanel from "@/components/panels/ConfigPanel";
import AdvogadosPanel from "@/components/panels/AdvogadosPanel";
import PlanosPanel from "@/components/panels/PlanosPanel";
import { PanelProvider } from "@/contexts/PanelContext";
import { getAgenda, normalizarLista } from "@/services/api";
import { MapPin, Briefcase } from "lucide-react";

function CompromissosContent() {
  const router = useRouter();
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      router.replace("/");
      return;
    }

    async function carregar() {
      try {
        const dados = await getAgenda();
        const lista = normalizarLista(dados);
        const agora = new Date();
        const futuros = lista
          .filter((e) => new Date(e.data_evento) >= agora)
          .sort(
            (a, b) =>
              new Date(a.data_evento).getTime() -
              new Date(b.data_evento).getTime()
          );
        setEventos(futuros);
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

  const eventosPorData = eventos.reduce((acc, evento) => {
    const chave = new Date(evento.data_evento).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!acc[chave]) acc[chave] = [];
    acc[chave].push(evento);
    return acc;
  }, {});

  return (
    <div className="app-shell">
      <AppSidebar />

      <main className="app-main">
        <TopBar
          title="Compromissos futuros"
          subtitle="Todos os eventos e audiências agendados"
        />

        {erro && <div className="alert alert-error">{erro}</div>}

        {carregando && (
          <div className="empty-state">Carregando compromissos...</div>
        )}

        {!carregando && eventos.length === 0 && (
          <div className="panel-card">
            <div className="empty-state">
              Nenhum compromisso futuro agendado. Use o calendário no dashboard
              ou a aba Agenda para criar eventos.
            </div>
          </div>
        )}

        {!carregando &&
          Object.entries(eventosPorData).map(([data, items]) => (
            <div key={data} style={{ marginBottom: 24 }}>
              <h3
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                  textTransform: "capitalize",
                  marginBottom: 12,
                }}
              >
                {data}
              </h3>
              {items.map((evento) => (
                <div key={evento.id} className="compromisso-card">
                  <div className="compromisso-date">
                    {new Date(evento.data_evento).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <h4>{evento.titulo}</h4>
                  <div className="compromisso-meta">
                    {evento.numero_processo && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Briefcase size={14} />
                        {evento.numero_processo}
                      </span>
                    )}
                    {evento.local_evento && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={14} />
                        {evento.local_evento}
                      </span>
                    )}
                  </div>
                  {evento.descricao && (
                    <p
                      style={{
                        marginTop: 8,
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {evento.descricao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
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

export default function CompromissosPage() {
  return (
    <PanelProvider>
      <CompromissosContent />
    </PanelProvider>
  );
}
