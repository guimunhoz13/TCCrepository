"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Briefcase,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Clock,
  Receipt,
  History,
  CalendarDays,
  ListChecks,
  FileText,
  FileSignature,
} from "lucide-react";
import { getFichaProcesso, createMovimentacao, deleteMovimentacao, abrirDocumento } from "@/services/api";
import { badgeStatus, rotuloStatus } from "@/lib/statusProcesso";
import { areaDireitoLabel } from "@/lib/areaDireito";
import { TIPO_HONORARIO_LABEL, situacaoDespesa } from "@/lib/contrato";
import { formatarData, formatarMoeda, formatarHoras } from "@/utils/formato";

const FORMA_PAGAMENTO_LABEL = { avista: "À vista", parcelado: "Parcelado" };

const STATUS_CONTRATO = {
  ativo: { label: "Ativo", badge: "badge-warning" },
  quitado: { label: "Quitado", badge: "badge-success" },
  cancelado: { label: "Cancelado", badge: "badge-muted" },
};

const STATUS_PARCELA = {
  pendente: { label: "Pendente", badge: "badge-muted" },
  pago: { label: "Pago", badge: "badge-success" },
  atrasado: { label: "Atrasado", badge: "badge-danger" },
};

function TituloSecao({ icon: Icon, children }) {
  return (
    <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={17} /> {children}
    </h3>
  );
}

function IndicadorFicha({ icon: Icon, rotulo, valor, detalhe, alerta }) {
  return (
    <div className={`financeiro-card ${alerta ? "alerta" : ""}`}>
      <span className="financeiro-card-icon">
        <Icon size={17} />
      </span>
      <div className="financeiro-card-rotulo">{rotulo}</div>
      <div className="financeiro-card-valor">{valor}</div>
      <div className="financeiro-card-detalhe">{detalhe}</div>
    </div>
  );
}

function Campo({ rotulo, children }) {
  return (
    <div className="ficha-campo">
      <span className="ficha-campo-rotulo">{rotulo}</span>
      <span className="ficha-campo-valor">{children}</span>
    </div>
  );
}

export default function FichaProcesso({ processoId, onVoltar, onEditar }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [novaMovimentacao, setNovaMovimentacao] = useState("");
  const [lancando, setLancando] = useState(false);
  const [erroMovimentacao, setErroMovimentacao] = useState("");
  const [excluindoMovId, setExcluindoMovId] = useState(null);

  useEffect(() => {
    if (!processoId) return;
    let cancelado = false;
    setCarregando(true);
    setErro("");
    getFichaProcesso(processoId)
      .then((resposta) => {
        if (!cancelado) setDados(resposta);
      })
      .catch((error) => {
        if (!cancelado) setErro(error.message);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [processoId]);

  async function recarregarMovimentacoes() {
    const resposta = await getFichaProcesso(processoId);
    setDados((atual) => ({ ...atual, movimentacoes: resposta.movimentacoes }));
  }

  async function handleLancarMovimentacao(event) {
    event.preventDefault();
    if (!novaMovimentacao.trim()) return;
    setErroMovimentacao("");
    try {
      setLancando(true);
      await createMovimentacao({ processo: processoId, descricao: novaMovimentacao.trim() });
      setNovaMovimentacao("");
      await recarregarMovimentacoes();
    } catch (error) {
      setErroMovimentacao(error.message);
    } finally {
      setLancando(false);
    }
  }

  async function handleExcluirMovimentacao(id) {
    if (!window.confirm("Excluir esta movimentação?")) return;
    setExcluindoMovId(id);
    try {
      await deleteMovimentacao(id);
      await recarregarMovimentacoes();
    } catch (error) {
      setErroMovimentacao(error.message);
    } finally {
      setExcluindoMovId(null);
    }
  }

  const VoltarBtn = () => (
    <button
      type="button"
      className="btn btn-secondary"
      style={{ marginBottom: 18 }}
      onClick={onVoltar}
    >
      <ArrowLeft size={15} /> Voltar à lista
    </button>
  );

  if (!processoId) {
    return (
      <div>
        <VoltarBtn />
        <div className="empty-state">Nenhum processo selecionado.</div>
      </div>
    );
  }

  if (carregando && !dados) {
    return (
      <div>
        <VoltarBtn />
        <p>Carregando ficha do processo...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div>
        <VoltarBtn />
        <div className="alert alert-error">{erro}</div>
      </div>
    );
  }

  const {
    processo,
    movimentacoes,
    documentos,
    agenda,
    tarefas,
    apontamentos,
    despesas,
    contrato,
    resumo,
  } = dados;

  const contratoStatus = contrato ? STATUS_CONTRATO[contrato.status] : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <button type="button" className="btn btn-secondary" onClick={onVoltar}>
          <ArrowLeft size={15} /> Voltar à lista
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => onEditar(processo)}>
          <Pencil size={15} /> Editar processo
        </button>
      </div>

      <div className="ficha-identidade">
        <div>
          <h2>{processo.numero_processo}</h2>
          <p className="ficha-subtitulo">{processo.titulo}</p>
        </div>
        <div className="ficha-selos">
          <span className={`badge ${badgeStatus(processo.status)}`}>
            {rotuloStatus(processo.status)}
          </span>
          {processo.proximo_prazo && (
            <span
              className={`badge ${
                processo.proximo_prazo.atrasado ? "badge-danger" : "badge-warning"
              }`}
            >
              {processo.proximo_prazo.atrasado ? (
                <AlertTriangle size={12} />
              ) : (
                <Clock size={12} />
              )}{" "}
              {processo.proximo_prazo.atrasado
                ? "Prazo atrasado"
                : `Prazo em ${formatarData(processo.proximo_prazo.data_evento)}`}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 18 }}>
        <div className="panel-card">
          <TituloSecao icon={Briefcase}>Identificação</TituloSecao>
          <div className="ficha-grid">
            <Campo rotulo="Cliente">{processo.cliente_nome}</Campo>
            <Campo rotulo="Advogado responsável">{processo.advogado_nome}</Campo>
            <Campo rotulo="Área do direito">{areaDireitoLabel(processo.area_direito)}</Campo>
            <Campo rotulo="Vara">{processo.vara || "—"}</Campo>
            <Campo rotulo="Comarca">{processo.comarca || "—"}</Campo>
            <Campo rotulo="Valor da causa">{formatarMoeda(processo.valor_causa)}</Campo>
            <Campo rotulo="Início">{formatarData(processo.data_inicio)}</Campo>
            <Campo rotulo="Encerramento">
              {processo.data_fim ? formatarData(processo.data_fim) : "Em andamento"}
            </Campo>
            <Campo rotulo="Parte contrária">{processo.nome_parte_contraria || "—"}</Campo>
            <Campo rotulo="Advogado adverso">
              {processo.nome_advogado_adverso || "—"}
              {processo.oab_advogado_adverso && (
                <div className="celula-secundaria">OAB {processo.oab_advogado_adverso}</div>
              )}
            </Campo>
            <Campo rotulo="Honorários de sucumbência">
              {processo.percentual_honorarios_sucumbencia
                ? `${processo.percentual_honorarios_sucumbencia}% (${formatarMoeda(
                    processo.valor_estimado_honorarios_sucumbencia
                  )})`
                : "—"}
            </Campo>
            <Campo rotulo="DataJud (CNJ)">
              {processo.datajud_sincronizado_em
                ? `Sincronizado em ${formatarData(processo.datajud_sincronizado_em, true)}`
                : "Nunca sincronizado"}
            </Campo>
          </div>
          {processo.descricao && (
            <p style={{ marginTop: 16, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {processo.descricao}
            </p>
          )}
        </div>

        <div className="panel-card">
          <TituloSecao icon={Wallet}>Resumo financeiro</TituloSecao>
          <div className="financeiro-grid">
            <IndicadorFicha
              icon={Wallet}
              rotulo="Valor contratado"
              valor={formatarMoeda(resumo.valor_contratado)}
              detalhe="Honorários definidos no contrato"
            />
            <IndicadorFicha
              icon={TrendingUp}
              rotulo="Recebido"
              valor={formatarMoeda(resumo.valor_pago)}
              detalhe="Parcelas já quitadas"
            />
            <IndicadorFicha
              icon={AlertTriangle}
              rotulo="A receber"
              valor={formatarMoeda(resumo.valor_pendente)}
              detalhe="Parcelas em aberto"
              alerta={Number(resumo.valor_pendente) > 0}
            />
            <IndicadorFicha
              icon={Clock}
              rotulo="Horas faturáveis"
              valor={formatarMoeda(resumo.valor_horas_faturaveis)}
              detalhe={`${formatarHoras(resumo.minutos_faturaveis)} de ${formatarHoras(
                resumo.minutos_trabalhados
              )} trabalhadas`}
            />
            <IndicadorFicha
              icon={Receipt}
              rotulo="Despesas a reembolsar"
              valor={formatarMoeda(resumo.despesas_a_reembolsar)}
              detalhe={`Total de despesas: ${formatarMoeda(resumo.total_despesas)}`}
            />
          </div>
        </div>

        <div className="panel-card">
          <TituloSecao icon={FileSignature}>Contrato</TituloSecao>
          {!contrato ? (
            <div className="empty-state">Nenhum contrato cadastrado para este processo.</div>
          ) : (
            <>
              <div className="ficha-grid">
                <Campo rotulo="Tipo de honorário">
                  {TIPO_HONORARIO_LABEL[contrato.tipo_honorario] || contrato.tipo_honorario}
                </Campo>
                <Campo rotulo="Valor total">{formatarMoeda(contrato.valor_total)}</Campo>
                <Campo rotulo="Forma de pagamento">
                  {FORMA_PAGAMENTO_LABEL[contrato.forma_pagamento] || contrato.forma_pagamento}
                </Campo>
                <Campo rotulo="Parcelas">{contrato.numero_parcelas}</Campo>
                <Campo rotulo="Status">
                  <span className={`badge ${contratoStatus?.badge || "badge-muted"}`}>
                    {contratoStatus?.label || contrato.status}
                  </span>
                </Campo>
              </div>
              {contrato.observacoes && (
                <p className="celula-secundaria" style={{ marginTop: 12 }}>
                  {contrato.observacoes}
                </p>
              )}
              {contrato.parcelas?.length > 0 && (
                <div className="table-wrap" style={{ marginTop: 16 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Parcela</th>
                        <th>Valor</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contrato.parcelas.map((parcela) => {
                        const situacao = STATUS_PARCELA[parcela.status];
                        return (
                          <tr key={parcela.id}>
                            <td>{parcela.numero}</td>
                            <td>{formatarMoeda(parcela.valor)}</td>
                            <td>{formatarData(parcela.data_vencimento)}</td>
                            <td>
                              <span className={`badge ${situacao?.badge || "badge-muted"}`}>
                                {situacao?.label || parcela.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="panel-card">
          <TituloSecao icon={History}>Movimentações</TituloSecao>
          <form onSubmit={handleLancarMovimentacao} style={{ marginBottom: 16 }}>
            <div className="form-field">
              <label>Lançar movimentação</label>
              <textarea
                value={novaMovimentacao}
                onChange={(e) => setNovaMovimentacao(e.target.value)}
                placeholder="Ex.: Audiência realizada, cliente enviou documentos..."
                style={{ minHeight: 70 }}
              />
            </div>
            {erroMovimentacao && (
              <p style={{ color: "var(--danger)", fontSize: "0.84rem", marginTop: 6 }}>
                {erroMovimentacao}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 10 }}
              disabled={lancando || !novaMovimentacao.trim()}
            >
              {lancando ? "Lançando..." : "Lançar"}
            </button>
          </form>
          {movimentacoes.length === 0 ? (
            <div className="empty-state">Nenhuma movimentação registrada.</div>
          ) : (
            <div className="list-widget">
              {movimentacoes.map((mov) => (
                <div key={mov.id} className="compromisso-card">
                  <div style={{ width: "100%" }}>
                    <div className="compromisso-date">
                      {formatarData(mov.data_movimentacao, true)}
                    </div>
                    <p style={{ margin: "2px 0 8px" }}>{mov.descricao}</p>
                    <div className="compromisso-meta">
                      <span
                        className={`badge ${
                          mov.origem === "datajud" ? "badge-info" : "badge-muted"
                        }`}
                      >
                        {mov.origem_display}
                      </span>
                      {mov.criado_por_nome && <span>Lançado por {mov.criado_por_nome}</span>}
                    </div>
                  </div>
                  {mov.origem === "manual" && (
                    <button
                      type="button"
                      className="row-action row-action-danger"
                      title="Excluir movimentação"
                      aria-label="Excluir movimentação"
                      disabled={excluindoMovId === mov.id}
                      onClick={() => handleExcluirMovimentacao(mov.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card">
          <TituloSecao icon={CalendarDays}>Agenda</TituloSecao>
          {agenda.length === 0 ? (
            <div className="empty-state">Nenhum compromisso ou prazo agendado.</div>
          ) : (
            <div className="list-widget">
              {agenda.map((evento) => (
                <div
                  key={evento.id}
                  className={`compromisso-card ${
                    !evento.cumprido && evento.atrasado ? "urgente" : ""
                  }`}
                >
                  <div>
                    <div className="compromisso-date">
                      {formatarData(evento.data_evento, true)}
                    </div>
                    <h4>{evento.titulo}</h4>
                    <div className="compromisso-meta">
                      <span>{evento.tipo === "prazo" ? "Prazo" : "Compromisso"}</span>
                      {evento.prioridade === "fatal" && <span>Prazo fatal</span>}
                      {evento.local_evento && <span>{evento.local_evento}</span>}
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      evento.cumprido
                        ? "badge-success"
                        : evento.atrasado
                        ? "badge-danger"
                        : "badge-muted"
                    }`}
                  >
                    {evento.cumprido ? "Cumprido" : evento.atrasado ? "Atrasado" : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card">
          <TituloSecao icon={ListChecks}>Tarefas</TituloSecao>
          {tarefas.length === 0 ? (
            <div className="empty-state">Nenhuma tarefa vinculada a este processo.</div>
          ) : (
            <div className="list-widget">
              {tarefas.map((tarefa) => (
                <div
                  key={tarefa.id}
                  className={`compromisso-card ${tarefa.atrasada ? "urgente" : ""}`}
                >
                  <div>
                    <h4 style={{ marginBottom: 4 }}>{tarefa.titulo}</h4>
                    <div className="compromisso-meta">
                      <span>{tarefa.responsavel_nome}</span>
                      <span>{tarefa.prazo ? formatarData(tarefa.prazo) : "Sem prazo"}</span>
                    </div>
                  </div>
                  <span className={`badge ${tarefa.atrasada ? "badge-danger" : "badge-muted"}`}>
                    {tarefa.atrasada ? (
                      <>
                        <AlertTriangle size={12} /> Atrasada
                      </>
                    ) : (
                      tarefa.status_display
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card">
          <TituloSecao icon={FileText}>Documentos</TituloSecao>
          {documentos.length === 0 ? (
            <div className="empty-state">Nenhum documento enviado.</div>
          ) : (
            <div className="list-widget">
              {documentos.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  className="doc-mini-card"
                  onClick={async () => {
                    try {
                      await abrirDocumento(doc.id);
                    } catch (error) {
                      setErro(error.message);
                    }
                  }}
                >
                  <span className="doc-mini-icon">
                    <FileText size={16} />
                  </span>
                  <span className="doc-mini-info">
                    <strong>{doc.nome_arquivo}</strong>
                    <span>{formatarData(doc.enviado_em, true)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card">
          <TituloSecao icon={Clock}>Apontamentos de horas</TituloSecao>
          {apontamentos.length === 0 ? (
            <div className="empty-state">Nenhuma hora apontada.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Profissional</th>
                    <th>Horas</th>
                    <th>Faturável</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {apontamentos.map((apontamento) => (
                    <tr key={apontamento.id}>
                      <td>
                        {formatarData(apontamento.data)}
                        {apontamento.descricao && (
                          <div className="celula-secundaria">{apontamento.descricao}</div>
                        )}
                      </td>
                      <td>{apontamento.usuario_nome}</td>
                      <td>{formatarHoras(apontamento.minutos)}</td>
                      <td>
                        <span
                          className={`badge ${
                            apontamento.faturavel ? "badge-success" : "badge-muted"
                          }`}
                        >
                          {apontamento.faturavel ? "Sim" : "Não"}
                        </span>
                      </td>
                      <td>{formatarMoeda(apontamento.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel-card">
          <TituloSecao icon={Receipt}>Despesas</TituloSecao>
          {despesas.length === 0 ? (
            <div className="empty-state">Nenhuma despesa registrada.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {despesas.map((despesa) => (
                    <tr key={despesa.id}>
                      <td>{formatarData(despesa.data)}</td>
                      <td>{despesa.tipo_display}</td>
                      <td>{despesa.descricao}</td>
                      <td>{formatarMoeda(despesa.valor)}</td>
                      <td>
                        <span
                          className={`badge ${
                            !despesa.reembolsavel
                              ? "badge-muted"
                              : despesa.reembolsada
                              ? "badge-success"
                              : "badge-warning"
                          }`}
                        >
                          {situacaoDespesa(despesa)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
