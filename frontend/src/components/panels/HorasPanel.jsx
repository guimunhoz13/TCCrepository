"use client";

import { useConfirmacao } from "@/contexts/ConfirmacaoContext";
import { useAvisos } from "@/contexts/AvisosContext";

import { useState } from "react";
import { useListaPaginada, useRecurso } from "@/hooks/useRecurso";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import RodapeLista from "@/components/ui/RodapeLista";
import { Trash2 } from "lucide-react";
import { usePanel } from "@/contexts/PanelContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import {
  getApontamentos,
  createApontamento,
  deleteApontamento,
  getDespesas,
  createDespesa,
  updateDespesa,
  deleteDespesa,
  getTempoDeUso,
  getProcessos,
  listarTudo,
} from "@/services/api";
import LinhasCarregando from "@/components/ui/LinhasCarregando";

const TIPOS_DESPESA = [
  { value: "custas", label: "Custas processuais" },
  { value: "diligencia", label: "Diligência" },
  { value: "copias", label: "Cópias e autenticações" },
  { value: "viagem", label: "Viagem e deslocamento" },
  { value: "pericia", label: "Honorários periciais" },
  { value: "outros", label: "Outros" },
];

function formatarMoeda(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${horas}h${String(resto).padStart(2, "0")}`;
}

function mesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

const horaInicial = {
  processo: "",
  data: new Date().toISOString().slice(0, 10),
  horas: "",
  minutos: "",
  descricao: "",
  faturavel: true,
  valor_hora: "",
};

const despesaInicial = {
  processo: "",
  tipo: "custas",
  descricao: "",
  valor: "",
  data: new Date().toISOString().slice(0, 10),
  reembolsavel: true,
};

export default function HorasPanel() {
  const { activePanel, panelTab, setPanelTab } = usePanel();
  const { t } = usePreferences();
  const confirmar = useConfirmacao();
  const avisar = useAvisos();

  const [mes, setMes] = useState(mesAtual());
  const [formHora, setFormHora] = useState(horaInicial);
  const [formDespesa, setFormDespesa] = useState(despesaInicial);
  const [erro, setErro] = useState("");

  const ativo = activePanel === "horas";
  const usuario = useUsuarioLogado();

  const listaHoras = useListaPaginada((page) => getApontamentos({ page }), [], { ativo });
  const listaDespesas = useListaPaginada((page) => getDespesas({ page }), [], { ativo });
  const recursoProcessos = useRecurso(() => listarTudo(getProcessos), [], { ativo });
  const recursoTempo = useRecurso(() => getTempoDeUso(mes), [mes], {
    ativo: ativo && panelTab === "tempo",
  });

  const processos = recursoProcessos.dados ?? [];
  const apontamentos = listaHoras.itens;
  const despesas = listaDespesas.itens;
  const tempoUso = recursoTempo.dados?.usuarios ?? [];
  const carregando =
    (listaHoras.carregando && apontamentos.length === 0) ||
    (listaDespesas.carregando && despesas.length === 0);
  const erroCarga =
    listaHoras.erro || listaDespesas.erro || recursoProcessos.erro || recursoTempo.erro;

  function carregar() {
    listaHoras.recarregar();
    listaDespesas.recarregar();
  }

  async function salvarHora(evento) {
    evento.preventDefault();
    setErro("");

    const minutos =
      Number(formHora.horas || 0) * 60 + Number(formHora.minutos || 0);

    if (minutos <= 0) {
      setErro("Informe quanto tempo foi trabalhado.");
      return;
    }

    try {
      await createApontamento({
        processo: formHora.processo,
        data: formHora.data,
        minutos,
        descricao: formHora.descricao,
        faturavel: formHora.faturavel,
        valor_hora: formHora.valor_hora || null,
      });
      setFormHora(horaInicial);
      setPanelTab("horas");
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function salvarDespesa(evento) {
    evento.preventDefault();
    setErro("");
    try {
      await createDespesa(formDespesa);
      setFormDespesa(despesaInicial);
      setPanelTab("despesas");
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  const totalMinutos = apontamentos.reduce((soma, a) => soma + a.minutos, 0);
  const totalFaturavel = apontamentos
    .filter((a) => a.faturavel && a.valor)
    .reduce((soma, a) => soma + Number(a.valor), 0);
  const totalDespesas = despesas.reduce((soma, d) => soma + Number(d.valor), 0);
  const totalAReembolsar = despesas
    .filter((d) => d.reembolsavel && !d.reembolsada)
    .reduce((soma, d) => soma + Number(d.valor), 0);

  const abas = [
    { id: "horas", label: "Horas" },
    { id: "nova-hora", label: "Apontar hora" },
    { id: "despesas", label: "Despesas" },
    { id: "nova-despesa", label: "Nova despesa" },
    { id: "tempo", label: "Tempo de uso" },
  ];

  if (!ativo) return null;

  return (
    <OverlayPanel tabs={abas}>
      {(erro || erroCarga) && <div className="form-error">{erro || erroCarga}</div>}

      {panelTab === "horas" && (
        <>
          <div className="resumo-linha">
            <span>
              Total lançado: <strong>{formatarDuracao(totalMinutos)}</strong>
            </span>
            <span>
              Faturável: <strong>{formatarMoeda(totalFaturavel)}</strong>
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Processo</th>
                <th>Quem</th>
                <th>Tempo</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && <LinhasCarregando colunas={7} />}
              {!carregando && apontamentos.length === 0 && (
                <tr>
                  <td colSpan="7">Nenhuma hora apontada ainda.</td>
                </tr>
              )}
              {!carregando &&
                apontamentos.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(`${a.data}T00:00:00`).toLocaleDateString("pt-BR")}</td>
                    <td>{a.numero_processo}</td>
                    <td>{a.usuario_nome}</td>
                    <td>{formatarDuracao(a.minutos)}</td>
                    <td>{a.descricao}</td>
                    <td>
                      {a.faturavel ? (
                        formatarMoeda(a.valor)
                      ) : (
                        <span className="badge badge-muted">Não faturável</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="row-action row-action-danger"
                          title={t("acao_excluir")}
                          aria-label={t("acao_excluir")}
                          onClick={async () => {
                            const ok = await confirmar({
                              titulo: "Excluir apontamento",
                              mensagem: "As horas deste apontamento deixam de contar no faturamento.",
                            });
                            if (!ok) return;
                            try {
                              await deleteApontamento(a.id);
                              avisar("Apontamento excluído.");
                              carregar();
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
            quantidade={apontamentos.length}
            total={listaHoras.total}
            temMais={listaHoras.temMais}
            carregandoMais={listaHoras.carregandoMais}
            onCarregarMais={listaHoras.carregarMais}
          />
        </>
      )}

      {panelTab === "nova-hora" && (
        <form onSubmit={salvarHora}>
          <div className="form-grid">
            <div className="form-field">
              <label>Processo</label>
              <select
                required
                value={formHora.processo}
                onChange={(e) => setFormHora({ ...formHora, processo: e.target.value })}
              >
                <option value="">Selecione</option>
                {processos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.numero_processo} — {p.titulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Data</label>
              <input
                type="date"
                required
                value={formHora.data}
                onChange={(e) => setFormHora({ ...formHora, data: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Horas</label>
              <input
                type="number"
                min="0"
                max="24"
                value={formHora.horas}
                onChange={(e) => setFormHora({ ...formHora, horas: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Minutos</label>
              <input
                type="number"
                min="0"
                max="59"
                value={formHora.minutos}
                onChange={(e) => setFormHora({ ...formHora, minutos: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Valor por hora (opcional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formHora.valor_hora}
                onChange={(e) => setFormHora({ ...formHora, valor_hora: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Faturável</label>
              <select
                value={formHora.faturavel ? "sim" : "nao"}
                onChange={(e) =>
                  setFormHora({ ...formHora, faturavel: e.target.value === "sim" })
                }
              >
                <option value="sim">Sim, cobrar do cliente</option>
                <option value="nao">Não faturável</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label>O que foi feito</label>
            <input
              required
              maxLength={255}
              value={formHora.descricao}
              onChange={(e) => setFormHora({ ...formHora, descricao: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Apontar hora
            </button>
          </div>
        </form>
      )}

      {panelTab === "despesas" && (
        <>
          <div className="resumo-linha">
            <span>
              Total: <strong>{formatarMoeda(totalDespesas)}</strong>
            </span>
            <span>
              A reembolsar: <strong>{formatarMoeda(totalAReembolsar)}</strong>
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Processo</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && <LinhasCarregando colunas={7} />}
              {!carregando && despesas.length === 0 && (
                <tr>
                  <td colSpan="7">Nenhuma despesa lançada ainda.</td>
                </tr>
              )}
              {!carregando &&
                despesas.map((d) => (
                  <tr key={d.id}>
                    <td>{new Date(`${d.data}T00:00:00`).toLocaleDateString("pt-BR")}</td>
                    <td>{d.numero_processo}</td>
                    <td>{d.tipo_display}</td>
                    <td>{d.descricao}</td>
                    <td>{formatarMoeda(d.valor)}</td>
                    <td>
                      {!d.reembolsavel ? (
                        <span className="badge badge-muted">Não reembolsável</span>
                      ) : d.reembolsada ? (
                        <span className="badge badge-success">Reembolsada</span>
                      ) : (
                        <span className="badge badge-warning">A reembolsar</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {d.reembolsavel && !d.reembolsada && (
                          <button
                            type="button"
                            className="row-action row-action-success"
                            title="Marcar como reembolsada"
                            aria-label="Marcar como reembolsada"
                            onClick={async () => {
                              await updateDespesa(d.id, { reembolsada: true });
                              carregar();
                            }}
                          >
                            <span aria-hidden="true">R$</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="row-action row-action-danger"
                          title={t("acao_excluir")}
                          aria-label={t("acao_excluir")}
                          onClick={async () => {
                            const ok = await confirmar({
                              titulo: "Excluir despesa",
                              mensagem: "A despesa sai do relatório do cliente e do reembolso.",
                            });
                            if (!ok) return;
                            try {
                              await deleteDespesa(d.id);
                              avisar("Despesa excluída.");
                              carregar();
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
            quantidade={despesas.length}
            total={listaDespesas.total}
            temMais={listaDespesas.temMais}
            carregandoMais={listaDespesas.carregandoMais}
            onCarregarMais={listaDespesas.carregarMais}
          />
        </>
      )}

      {panelTab === "nova-despesa" && (
        <form onSubmit={salvarDespesa}>
          <div className="form-grid">
            <div className="form-field">
              <label>Processo</label>
              <select
                required
                value={formDespesa.processo}
                onChange={(e) => setFormDespesa({ ...formDespesa, processo: e.target.value })}
              >
                <option value="">Selecione</option>
                {processos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.numero_processo} — {p.titulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Tipo</label>
              <select
                value={formDespesa.tipo}
                onChange={(e) => setFormDespesa({ ...formDespesa, tipo: e.target.value })}
              >
                {TIPOS_DESPESA.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Valor</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formDespesa.valor}
                onChange={(e) => setFormDespesa({ ...formDespesa, valor: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Data</label>
              <input
                type="date"
                required
                value={formDespesa.data}
                onChange={(e) => setFormDespesa({ ...formDespesa, data: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Reembolsável pelo cliente</label>
              <select
                value={formDespesa.reembolsavel ? "sim" : "nao"}
                onChange={(e) =>
                  setFormDespesa({ ...formDespesa, reembolsavel: e.target.value === "sim" })
                }
              >
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label>Descrição</label>
            <input
              required
              maxLength={255}
              value={formDespesa.descricao}
              onChange={(e) => setFormDespesa({ ...formDespesa, descricao: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Lançar despesa
            </button>
          </div>
        </form>
      )}

      {panelTab === "tempo" && (
        <>
          <div className="form-field" style={{ maxWidth: 220 }}>
            <label>Mês</label>
            <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
          </div>
          <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", marginBottom: 12 }}>
            Tempo com o sistema aberto e em uso, medido por sinais periódicos
            enquanto a aba está visível. Não é o mesmo que tempo trabalhado em
            um processo — isso é o que a aba Horas registra.
            {usuario?.tipo_usuario !== "admin" && " Você vê apenas o seu próprio tempo."}
          </p>
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Tempo no mês</th>
                <th>Sessões</th>
              </tr>
            </thead>
            <tbody>
              {tempoUso.length === 0 && (
                <tr>
                  <td colSpan="3">Nenhum uso registrado neste mês.</td>
                </tr>
              )}
              {tempoUso.map((linha) => (
                <tr key={linha.usuario}>
                  <td>{linha.usuario_nome}</td>
                  <td>{formatarDuracao(linha.minutos)}</td>
                  <td>{linha.sessoes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </OverlayPanel>
  );
}
