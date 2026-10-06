"use client";

import { useConfirmacao } from "@/contexts/ConfirmacaoContext";
import { useAvisos } from "@/contexts/AvisosContext";

import { useState } from "react";
import { useListaPaginada, useRecurso } from "@/hooks/useRecurso";
import { useValorAtrasado } from "@/hooks/useValorAtrasado";
import RodapeLista from "@/components/ui/RodapeLista";
import { usePanel, PANELS } from "@/contexts/PanelContext";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import { Landmark, MessageCircle, RefreshCw, Trash2, AlertTriangle, Clock } from "lucide-react";
import { abrirWhatsApp, montarMensagemProcesso } from "@/utils/whatsapp";
import { badgeStatus, rotuloStatus } from "@/lib/statusProcesso";
import FichaProcesso from "./FichaProcesso";
import ProcessoForm from "./ProcessoForm";
import {
  consultarDataJud,
  getProcessos,
  createProcesso,
  updateProcesso,
  deleteProcesso,
  getClientes,
  getAdvogados,
  listarTudo,
} from "@/services/api";
import LinhasCarregando from "@/components/ui/LinhasCarregando";

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

/** O prazo pendente mais próximo, resumido pro selo de urgência da
 * listagem — a mesma leitura de `atrasado`/dias que a dashboard já faz
 * pros "Prazos vencendo", só que a partir do campo já calculado no
 * processo em vez de uma lista de eventos. */
function rotuloUrgencia(prazo) {
  if (prazo.atrasado) return "Atrasado";
  const diffDias = Math.round(
    (new Date(prazo.data_evento).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      86400000
  );
  if (diffDias <= 0) return "Vence hoje";
  if (diffDias === 1) return "Vence amanhã";
  return `Vence em ${diffDias} dias`;
}

export default function ProcessosPanel() {
  const { activePanel, panelTab, panelParams, openPanel, setPanelTab } = usePanel();
  const { refresh: refreshDashboard } = useDashboardData();
  const confirmar = useConfirmacao();
  const avisar = useAvisos();
  const { t } = usePreferences();
  const [busca, setBusca] = useState("");
  const [consultando, setConsultando] = useState(null);
  const [avisoDataJud, setAvisoDataJud] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroAdvogado, setFiltroAdvogado] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [formularioEdicao, setFormularioEdicao] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const painelAberto = activePanel === "processos";
  const buscaAtrasada = useValorAtrasado(busca);
  const lista = useListaPaginada(
    (page) =>
      getProcessos({
        busca: buscaAtrasada,
        status: filtroStatus,
        advogado: filtroAdvogado,
        page,
      }),
    [buscaAtrasada, filtroStatus, filtroAdvogado],
    { ativo: painelAberto }
  );
  const auxiliares = useRecurso(
    () => Promise.all([listarTudo(getClientes), listarTudo(getAdvogados)]),
    [],
    { ativo: painelAberto }
  );
  const processos = lista.itens;
  const [clientes, advogados] = auxiliares.dados ?? [[], []];
  const carregando = lista.carregando && processos.length === 0;
  const erroCarga = lista.erro || auxiliares.erro;

  function carregarDados() {
    lista.recarregar();
  }

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
      carregarDados();
      refreshDashboard().catch(() => {});
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  function iniciarEdicao(processo) {
    setFormularioEdicao({
      id: processo.id,
      numero_processo: processo.numero_processo || "",
      titulo: processo.titulo || "",
      descricao: processo.descricao || "",
      status: processo.status || "Em andamento",
      cliente: processo.cliente || "",
      advogado: processo.advogado || "",
      data_inicio: processo.data_inicio || "",
      data_fim: processo.data_fim || "",
      area_direito: processo.area_direito || "",
      vara: processo.vara || "",
      comarca: processo.comarca || "",
      valor_causa: processo.valor_causa || "",
      nome_parte_contraria: processo.nome_parte_contraria || "",
      nome_advogado_adverso: processo.nome_advogado_adverso || "",
      oab_advogado_adverso: processo.oab_advogado_adverso || "",
      percentual_honorarios_sucumbencia: processo.percentual_honorarios_sucumbencia || "",
    });
    setErro("");
    setSucesso("");
    setPanelTab("editar");
  }

  async function handleSubmitEdicao(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    const { id, ...campos } = formularioEdicao;

    try {
      setSalvando(true);
      await updateProcesso(id, {
        ...campos,
        cliente: Number(campos.cliente),
        advogado: Number(campos.advogado),
        data_inicio: campos.data_inicio || null,
        data_fim: campos.data_fim || null,
        valor_causa: campos.valor_causa || null,
        percentual_honorarios_sucumbencia: campos.percentual_honorarios_sucumbencia || null,
      });
      setSucesso("Processo atualizado com sucesso.");
      setPanelTab("ficha");
      carregarDados();
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
      {(erro || erroCarga) && <div className="alert alert-error">{erro || erroCarga}</div>}
      {sucesso && <div className="alert alert-success">{sucesso}</div>}
      {avisoDataJud && (
        <div className={`alert ${avisoDataJud.erro ? "alert-error" : "alert-success"}`}>
          {avisoDataJud.texto}
        </div>
      )}

      {panelTab === "novo" ? (
        <ProcessoForm
          formulario={formulario}
          setFormulario={setFormulario}
          clientes={clientes}
          advogados={advogados}
          onSubmit={handleSubmit}
          salvando={salvando}
          submitLabel={t("acao_cadastrar_processo")}
        />
      ) : panelTab === "editar" ? (
        formularioEdicao && (
          <ProcessoForm
            formulario={formularioEdicao}
            setFormulario={setFormularioEdicao}
            clientes={clientes}
            advogados={advogados}
            onSubmit={handleSubmitEdicao}
            salvando={salvando}
            submitLabel="Salvar alterações"
            onCancelar={() => setPanelTab("ficha")}
          />
        )
      ) : panelTab === "ficha" ? (
        <FichaProcesso
          processoId={panelParams.processoId}
          onVoltar={() => setPanelTab("lista")}
          onEditar={iniciarEdicao}
        />
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
                aria-label="Filtrar por status"
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
                aria-label="Filtrar por advogado"
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
          {!carregando && (
            <p className="celula-secundaria" style={{ marginBottom: 10 }}>
              {lista.total === 0
                ? "Nenhum processo encontrado."
                : `${lista.total} processo${lista.total > 1 ? "s" : ""} encontrado${
                    lista.total > 1 ? "s" : ""
                  }.`}
            </p>
          )}
          <table>
            <thead>
              <tr>
                <th>Processo</th>
                <th>Cliente</th>
                <th>Advogado</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && <LinhasCarregando colunas={5} />}
              {!carregando &&
                processos.map((processo) => (
                  <tr
                    key={processo.id}
                    className="tr-clicavel"
                    // Clicar em qualquer ponto da linha é atalho de mouse/toque;
                    // para teclado e leitor de tela o caminho é o botão com o
                    // número do processo. A linha em si não é um controle:
                    // antes ela era role="button" com outros botões dentro,
                    // o que leitores de tela não conseguem anunciar.
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
                      {processo.titulo && (
                        <div className="celula-secundaria">{processo.titulo}</div>
                      )}
                      {processo.proximo_prazo && (
                        <div style={{ marginTop: 5 }}>
                          <span
                            className={`badge ${
                              processo.proximo_prazo.atrasado ? "badge-danger" : "badge-warning"
                            }`}
                          >
                            {processo.proximo_prazo.atrasado ? (
                              <AlertTriangle size={11} />
                            ) : (
                              <Clock size={11} />
                            )}{" "}
                            {rotuloUrgencia(processo.proximo_prazo)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="celula-secundaria">{processo.cliente_nome}</span>
                    </td>
                    <td>
                      <span className="celula-secundaria">{processo.advogado_nome}</span>
                    </td>
                    <td>
                      <span className={`badge ${badgeStatus(processo.status)}`}>
                        {rotuloStatus(processo.status)}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
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
                            const ok = await confirmar({
                              titulo: "Excluir processo",
                              mensagem: `O processo ${processo.numero_processo} será excluído junto com movimentações, documentos, agenda e contrato. Isso não pode ser desfeito.`,
                            });
                            if (!ok) return;
                            try {
                              await deleteProcesso(processo.id);
                              avisar("Processo excluído.");
                              carregarDados();
                              refreshDashboard().catch(() => {});
                            } catch (error) {
                              avisar(error.message, "erro");
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
          <RodapeLista
            quantidade={processos.length}
            total={lista.total}
            temMais={lista.temMais}
            carregandoMais={lista.carregandoMais}
            onCarregarMais={lista.carregarMais}
          />
        </div>
      )}
    </OverlayPanel>
  );
}
