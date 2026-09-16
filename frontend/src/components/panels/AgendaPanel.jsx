"use client";

import { useEffect, useState } from "react";
import { usePanel } from "@/contexts/PanelContext";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import {
  getAgenda,
  createAgenda,
  updateAgenda,
  deleteAgenda,
  getProcessos,
  calcularPrazo,
  normalizarLista,
} from "@/services/api";

const formularioInicial = {
  processo: "",
  tipo: "compromisso",
  prioridade: "normal",
  titulo: "",
  descricao: "",
  data_evento: "",
  local_evento: "",
};

const calculadoraInicial = {
  data_intimacao: "",
  dias_prazo: "",
  dias_uteis: true,
};

export default function AgendaPanel() {
  const { activePanel, panelTab, setPanelTab } = usePanel();
  const { refresh: refreshDashboard } = useDashboardData();
  const { t } = usePreferences();
  const [eventos, setEventos] = useState([]);
  const [processos, setProcessos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [calculadora, setCalculadora] = useState(calculadoraInicial);
  const [calculando, setCalculando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarDados(tipo = filtroTipo) {
    try {
      setCarregando(true);
      const [dadosAgenda, dadosProcessos] = await Promise.all([
        getAgenda({ tipo }),
        getProcessos(),
      ]);
      setEventos(normalizarLista(dadosAgenda));
      setProcessos(normalizarLista(dadosProcessos));
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (activePanel === "agenda") {
      carregarDados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePanel]);

  useEffect(() => {
    if (activePanel !== "agenda") return;
    carregarDados(filtroTipo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipo]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    try {
      await createAgenda({
        ...formulario,
        processo: Number(formulario.processo),
      });
      setFormulario(formularioInicial);
      setCalculadora(calculadoraInicial);
      setSucesso("Evento agendado com sucesso.");
      setPanelTab("lista");
      await carregarDados();
      refreshDashboard().catch(() => {});
    } catch (error) {
      setErro(error.message);
    }
  }

  async function handleCalcularPrazo() {
    setErro("");
    if (!calculadora.data_intimacao || !calculadora.dias_prazo) {
      setErro("Informe a data de início e a quantidade de dias para calcular o prazo.");
      return;
    }
    try {
      setCalculando(true);
      const resultado = await calcularPrazo({
        data_inicio: calculadora.data_intimacao,
        dias: Number(calculadora.dias_prazo),
        dias_uteis: calculadora.dias_uteis,
      });
      setFormulario((f) => ({
        ...f,
        data_evento: `${resultado.data_final}T00:00`,
      }));
    } catch (error) {
      setErro(error.message);
    } finally {
      setCalculando(false);
    }
  }

  if (activePanel !== "agenda") return null;

  return (
    <OverlayPanel
      tabs={[
        { id: "lista", label: t("aba_lista") },
        { id: "novo", label: t("aba_novo") },
      ]}
    >
      {erro && <div className="alert alert-error">{erro}</div>}
      {sucesso && <div className="alert alert-success">{sucesso}</div>}

      {panelTab === "novo" ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Processo</label>
            <select
              value={formulario.processo}
              onChange={(e) =>
                setFormulario({ ...formulario, processo: e.target.value })
              }
              required
            >
              <option value="">Selecione</option>
              {processos.map((processo) => (
                <option key={processo.id} value={processo.id}>
                  {processo.numero_processo} — {processo.titulo}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Tipo</label>
            <select
              value={formulario.tipo}
              onChange={(e) =>
                setFormulario({ ...formulario, tipo: e.target.value })
              }
            >
              <option value="compromisso">Compromisso</option>
              <option value="prazo">Prazo</option>
            </select>
          </div>
          {formulario.tipo === "prazo" && (
            <div className="form-field">
              <label>Prioridade</label>
              <select
                value={formulario.prioridade}
                onChange={(e) =>
                  setFormulario({ ...formulario, prioridade: e.target.value })
                }
              >
                <option value="normal">Normal</option>
                <option value="fatal">Prazo fatal</option>
              </select>
            </div>
          )}
          {formulario.tipo === "prazo" && (
            <div className="form-field full" style={{ background: "var(--bg-input)", padding: 14, borderRadius: 10 }}>
              <label style={{ marginBottom: 8 }}>Calculadora de prazo (opcional)</label>
              <div className="form-grid" style={{ padding: 0 }}>
                <div className="form-field">
                  <label>Data de início da contagem</label>
                  <input
                    type="date"
                    value={calculadora.data_intimacao}
                    onChange={(e) =>
                      setCalculadora({ ...calculadora, data_intimacao: e.target.value })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>Quantidade de dias</label>
                  <input
                    type="number"
                    min="1"
                    value={calculadora.dias_prazo}
                    onChange={(e) =>
                      setCalculadora({ ...calculadora, dias_prazo: e.target.value })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>Contagem</label>
                  <select
                    value={calculadora.dias_uteis ? "uteis" : "corridos"}
                    onChange={(e) =>
                      setCalculadora({ ...calculadora, dias_uteis: e.target.value === "uteis" })
                    }
                  >
                    <option value="uteis">Dias úteis</option>
                    <option value="corridos">Dias corridos</option>
                  </select>
                </div>
                <div className="form-field" style={{ justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCalcularPrazo}
                    disabled={calculando}
                  >
                    {calculando ? "Calculando..." : "Calcular data final"}
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="form-field">
            <label>Título</label>
            <input
              value={formulario.titulo}
              onChange={(e) =>
                setFormulario({ ...formulario, titulo: e.target.value })
              }
              required
            />
          </div>
          <div className="form-field full">
            <label>Descrição</label>
            <textarea
              value={formulario.descricao}
              onChange={(e) =>
                setFormulario({ ...formulario, descricao: e.target.value })
              }
              required
            />
          </div>
          <div className="form-field">
            <label>Data e hora</label>
            <input
              type="datetime-local"
              value={formulario.data_evento}
              onChange={(e) =>
                setFormulario({ ...formulario, data_evento: e.target.value })
              }
              required
            />
          </div>
          <div className="form-field">
            <label>Local</label>
            <input
              value={formulario.local_evento}
              onChange={(e) =>
                setFormulario({ ...formulario, local_evento: e.target.value })
              }
            />
          </div>
          <div className="form-field full">
            <button className="btn btn-primary">{t("acao_agendar_evento")}</button>
          </div>
        </form>
      ) : (
        <div className="table-wrap">
          <div className="form-field" style={{ marginBottom: 12, maxWidth: 220 }}>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="">Todos os tipos</option>
              <option value="compromisso">Compromissos</option>
              <option value="prazo">Prazos</option>
            </select>
          </div>
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Evento</th>
                <th>Processo</th>
                <th>Data</th>
                <th>Local</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr>
                  <td colSpan="7">Carregando...</td>
                </tr>
              )}
              {!carregando &&
                eventos.map((evento) => (
                  <tr key={evento.id}>
                    <td>
                      <span className={`badge ${evento.tipo === "prazo" ? "badge-warning" : "badge-muted"}`}>
                        {evento.tipo === "prazo" ? "Prazo" : "Compromisso"}
                      </span>
                      {evento.prioridade === "fatal" && (
                        <span className="badge badge-danger" style={{ marginLeft: 6 }}>
                          Fatal
                        </span>
                      )}
                    </td>
                    <td>{evento.titulo}</td>
                    <td>{evento.numero_processo}</td>
                    <td>
                      {new Date(evento.data_evento).toLocaleString("pt-BR")}
                    </td>
                    <td>{evento.local_evento}</td>
                    <td>
                      {evento.cumprido ? (
                        <span className="badge badge-success">Cumprido</span>
                      ) : evento.atrasado ? (
                        <span className="badge badge-danger">Atrasado</span>
                      ) : (
                        <span className="badge badge-muted">Pendente</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        {!evento.cumprido && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={async () => {
                              await updateAgenda(evento.id, { cumprido: true });
                              carregarDados();
                              refreshDashboard().catch(() => {});
                            }}
                          >
                            Marcar cumprido
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={async () => {
                            if (window.confirm("Excluir evento?")) {
                              await deleteAgenda(evento.id);
                              carregarDados();
                              refreshDashboard().catch(() => {});
                            }
                          }}
                        >
                          {t("acao_excluir")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </OverlayPanel>
  );
}
