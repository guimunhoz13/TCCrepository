"use client";

import { useEffect, useState } from "react";
import { usePanel } from "@/contexts/PanelContext";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import { Landmark, MessageCircle, RefreshCw, Trash2 } from "lucide-react";
import { abrirWhatsApp, montarMensagemProcesso } from "@/utils/whatsapp";
import {
  consultarDataJud,
  getProcessos,
  createProcesso,
  updateProcesso,
  deleteProcesso,
  getClientes,
  getAdvogados,
  normalizarLista,
} from "@/services/api";

const formularioInicial = {
  numero_processo: "",
  titulo: "",
  descricao: "",
  status: "Em andamento",
  cliente: "",
  advogado: "",
  data_inicio: "",
  data_fim: "",
  area_direito: "",
  vara: "",
  comarca: "",
  valor_causa: "",
  nome_parte_contraria: "",
  nome_advogado_adverso: "",
  oab_advogado_adverso: "",
  percentual_honorarios_sucumbencia: "",
};

const AREAS_DIREITO = [
  { value: "civel", label: "Cível" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "tributario", label: "Tributário" },
  { value: "criminal", label: "Criminal" },
  { value: "familia", label: "Família e Sucessões" },
  { value: "previdenciario", label: "Previdenciário" },
  { value: "empresarial", label: "Empresarial" },
  { value: "administrativo", label: "Administrativo" },
  { value: "consumidor", label: "Consumidor" },
  { value: "ambiental", label: "Ambiental" },
];

function areaDireitoLabel(valor) {
  return AREAS_DIREITO.find((a) => a.value === valor)?.label || "—";
}

function formatarMoeda(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  const numero = Number(valor);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusBadge(status) {
  if (status === "Concluido") return "badge-success";
  if (status === "Em andamento") return "badge-warning";
  return "badge-muted";
}

export default function ProcessosPanel() {
  const { activePanel, panelTab, setPanelTab } = usePanel();
  const { refresh: refreshDashboard } = useDashboardData();
  const { t } = usePreferences();
  const [processos, setProcessos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [advogados, setAdvogados] = useState([]);
  const [busca, setBusca] = useState("");
  const [consultando, setConsultando] = useState(null);
  const [avisoDataJud, setAvisoDataJud] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroAdvogado, setFiltroAdvogado] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarDados(filtros = {}) {
    try {
      setCarregando(true);
      const parametros = {
        busca: filtros.busca ?? busca,
        status: filtros.status ?? filtroStatus,
        advogado: filtros.advogado ?? filtroAdvogado,
      };
      const [dadosProcessos, dadosClientes, dadosAdvogados] =
        await Promise.all([
          getProcessos(parametros),
          getClientes(),
          getAdvogados(),
        ]);
      setProcessos(normalizarLista(dadosProcessos));
      setClientes(normalizarLista(dadosClientes));
      setAdvogados(normalizarLista(dadosAdvogados));
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (activePanel === "processos") {
      carregarDados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePanel]);

  useEffect(() => {
    if (activePanel !== "processos") return;
    const timeout = setTimeout(() => carregarDados({ busca }), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  useEffect(() => {
    if (activePanel !== "processos") return;
    carregarDados({ status: filtroStatus, advogado: filtroAdvogado });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus, filtroAdvogado]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    try {
      setSalvando(true);
      await createProcesso({
        ...formulario,
        cliente: Number(formulario.cliente),
        advogado: Number(formulario.advogado),
        data_inicio: formulario.data_inicio || null,
        data_fim: formulario.data_fim || null,
        valor_causa: formulario.valor_causa || null,
        percentual_honorarios_sucumbencia:
          formulario.percentual_honorarios_sucumbencia || null,
      });
      setFormulario(formularioInicial);
      setSucesso("Processo cadastrado com sucesso.");
      setPanelTab("lista");
      await carregarDados();
      refreshDashboard().catch(() => {});
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  if (activePanel !== "processos") return null;

  return (
    <OverlayPanel
      tabs={[
        { id: "lista", label: t("aba_lista") },
        { id: "novo", label: t("aba_novo") },
      ]}
    >
      {erro && <div className="alert alert-error">{erro}</div>}
      {sucesso && <div className="alert alert-success">{sucesso}</div>}
      {avisoDataJud && (
        <div className={`alert ${avisoDataJud.erro ? "alert-error" : "alert-success"}`}>
          {avisoDataJud.texto}
        </div>
      )}

      {panelTab === "novo" ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Número do processo</label>
            <input
              value={formulario.numero_processo}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  numero_processo: e.target.value,
                })
              }
              required
            />
          </div>
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
            <label>Cliente</label>
            <select
              value={formulario.cliente}
              onChange={(e) =>
                setFormulario({ ...formulario, cliente: e.target.value })
              }
              required
            >
              <option value="">Selecione</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Advogado</label>
            <select
              value={formulario.advogado}
              onChange={(e) =>
                setFormulario({ ...formulario, advogado: e.target.value })
              }
              required
            >
              <option value="">Selecione</option>
              {advogados.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Status</label>
            <select
              value={formulario.status}
              onChange={(e) =>
                setFormulario({ ...formulario, status: e.target.value })
              }
            >
              <option value="Em andamento">Em andamento</option>
              <option value="Concluido">Concluído</option>
              <option value="Suspenso">Suspenso</option>
              <option value="Arquivado">Arquivado</option>
            </select>
          </div>
          <div className="form-field">
            <label>Data início</label>
            <input
              type="date"
              value={formulario.data_inicio}
              onChange={(e) =>
                setFormulario({ ...formulario, data_inicio: e.target.value })
              }
            />
          </div>

          <div className="form-field full">
            <label style={{ marginTop: 8 }}>Dados jurídicos adicionais</label>
          </div>
          <div className="form-field">
            <label>Área do direito</label>
            <select
              value={formulario.area_direito}
              onChange={(e) =>
                setFormulario({ ...formulario, area_direito: e.target.value })
              }
            >
              <option value="">Não informado</option>
              {AREAS_DIREITO.map((area) => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Vara</label>
            <input
              value={formulario.vara}
              onChange={(e) => setFormulario({ ...formulario, vara: e.target.value })}
              placeholder="Ex.: 3ª Vara Cível"
            />
          </div>
          <div className="form-field">
            <label>Comarca</label>
            <input
              value={formulario.comarca}
              onChange={(e) => setFormulario({ ...formulario, comarca: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>Valor da causa (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formulario.valor_causa}
              onChange={(e) => setFormulario({ ...formulario, valor_causa: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>Parte contrária</label>
            <input
              value={formulario.nome_parte_contraria}
              onChange={(e) =>
                setFormulario({ ...formulario, nome_parte_contraria: e.target.value })
              }
            />
          </div>
          <div className="form-field">
            <label>Advogado adverso</label>
            <input
              value={formulario.nome_advogado_adverso}
              onChange={(e) =>
                setFormulario({ ...formulario, nome_advogado_adverso: e.target.value })
              }
            />
          </div>
          <div className="form-field">
            <label>OAB do advogado adverso</label>
            <input
              value={formulario.oab_advogado_adverso}
              onChange={(e) =>
                setFormulario({ ...formulario, oab_advogado_adverso: e.target.value })
              }
              placeholder="123456/SP"
            />
          </div>
          <div className="form-field">
            <label>% Honorários de sucumbência</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formulario.percentual_honorarios_sucumbencia}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  percentual_honorarios_sucumbencia: e.target.value,
                })
              }
              placeholder="Ex.: 10 (fixado pelo juízo)"
            />
            {formulario.valor_causa && formulario.percentual_honorarios_sucumbencia && (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 6 }}>
                Estimativa: {formatarMoeda(
                  (Number(formulario.valor_causa) * Number(formulario.percentual_honorarios_sucumbencia)) / 100
                )}
              </p>
            )}
          </div>

          <div className="form-field full">
            <button className="btn btn-primary" disabled={salvando}>
              {salvando ? t("acao_salvando") : t("acao_cadastrar_processo")}
            </button>
          </div>
        </form>
      ) : (
        <div className="table-wrap">
          <div
            className="form-grid"
            style={{ marginBottom: 12, gridTemplateColumns: "2fr 1fr 1fr" }}
          >
            <div className="form-field">
              <input
                type="search"
                placeholder="Buscar por número, título ou cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="form-field">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Concluido">Concluído</option>
                <option value="Suspenso">Suspenso</option>
                <option value="Arquivado">Arquivado</option>
              </select>
            </div>
            <div className="form-field">
              <select
                value={filtroAdvogado}
                onChange={(e) => setFiltroAdvogado(e.target.value)}
              >
                <option value="">Todos os advogados</option>
                {advogados.map((adv) => (
                  <option key={adv.id} value={adv.id}>
                    {adv.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Processo</th>
                <th>Cliente</th>
                <th>Advogado</th>
                <th>Área</th>
                <th>Valor da causa</th>
                <th>Status</th>
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
                processos.map((processo) => (
                  <tr key={processo.id}>
                    <td>{processo.numero_processo}</td>
                    <td>{processo.cliente_nome}</td>
                    <td>{processo.advogado_nome}</td>
                    <td>{areaDireitoLabel(processo.area_direito)}</td>
                    <td>{formatarMoeda(processo.valor_causa)}</td>
                    <td>
                      <span className={`badge ${statusBadge(processo.status)}`}>
                        {processo.status === "Concluido"
                          ? "Concluído"
                          : processo.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="row-action"
                          title={t("acao_alternar_status")}
                          aria-label={t("acao_alternar_status")}
                          onClick={async () => {
                            await updateProcesso(processo.id, {
                              status:
                                processo.status === "Em andamento"
                                  ? "Concluido"
                                  : "Em andamento",
                            });
                            carregarDados();
                            refreshDashboard().catch(() => {});
                          }}
                        >
                          <RefreshCw size={15} />
                        </button>
                        <button
                          type="button"
                          className="row-action"
                          title="Consultar andamentos no DataJud (CNJ)"
                          aria-label="Consultar andamentos no DataJud"
                          disabled={consultando === processo.id}
                          onClick={async () => {
                            setConsultando(processo.id);
                            setAvisoDataJud(null);
                            try {
                              const dados = await consultarDataJud(processo.id);
                              setAvisoDataJud({
                                erro: false,
                                texto:
                                  `${processo.numero_processo}: ` +
                                  `${dados.movimentacoes_importadas} andamento(s) importado(s)` +
                                  (dados.movimentacoes_ignoradas
                                    ? `, ${dados.movimentacoes_ignoradas} já conhecido(s)`
                                    : "") +
                                  (dados.capa?.orgao_julgador ? ` — ${dados.capa.orgao_julgador}` : ""),
                              });
                              carregarDados();
                            } catch (e) {
                              setAvisoDataJud({ erro: true, texto: e.message });
                            } finally {
                              setConsultando(null);
                            }
                          }}
                        >
                          <Landmark size={15} />
                        </button>
                        {(() => {
                          const clienteDoProcesso = clientes.find((c) => c.id === processo.cliente);
                          if (!clienteDoProcesso?.telefone) return null;
                          return (
                            <button
                              type="button"
                              className="row-action"
                              title={t("acao_enviar_whatsapp")}
                              aria-label={t("acao_enviar_whatsapp")}
                              onClick={() =>
                                abrirWhatsApp(clienteDoProcesso.telefone, montarMensagemProcesso(processo))
                              }
                            >
                              <MessageCircle size={15} />
                            </button>
                          );
                        })()}
                        <button
                          type="button"
                          className="row-action row-action-danger"
                          title={t("acao_excluir")}
                          aria-label={t("acao_excluir")}
                          onClick={async () => {
                            if (window.confirm("Excluir processo?")) {
                              await deleteProcesso(processo.id);
                              carregarDados();
                              refreshDashboard().catch(() => {});
                            }
                          }}
                        >
                          <Trash2 size={15} />
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
