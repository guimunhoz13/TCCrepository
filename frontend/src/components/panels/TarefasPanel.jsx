"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { usePanel } from "@/contexts/PanelContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import {
  getTarefas,
  createTarefa,
  updateTarefa,
  deleteTarefa,
  getProcessos,
  getUsuarios,
  getUsuarioLogado,
  normalizarLista,
} from "@/services/api";

const STATUS = [
  { value: "aberta", label: "Aberta" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

const PRIORIDADES = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

const BADGE_STATUS = {
  aberta: "badge-warning",
  em_andamento: "badge-warning",
  concluida: "badge-success",
  cancelada: "badge-muted",
};

const BADGE_PRIORIDADE = {
  alta: "badge-danger",
  media: "badge-warning",
  baixa: "badge-muted",
};

function formatarPrazo(tarefa) {
  if (!tarefa.prazo) return "sem prazo";
  // A data vem como "2026-09-21"; montar o Date com hora zero local evita
  // que o fuso de Brasília volte um dia.
  return new Date(`${tarefa.prazo}T00:00:00`).toLocaleDateString("pt-BR");
}

const tarefaInicial = {
  titulo: "",
  descricao: "",
  processo: "",
  responsavel: "",
  prioridade: "media",
  prazo: "",
};

export default function TarefasPanel() {
  const { activePanel, panelTab, setPanelTab } = usePanel();
  const { t } = usePreferences();

  const [tarefas, setTarefas] = useState([]);
  const [processos, setProcessos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(tarefaInicial);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const ativo = activePanel === "tarefas";
  const usuario = typeof window !== "undefined" ? getUsuarioLogado() : null;

  // A aba decide o filtro: "minhas" traz só as do usuário logado, e as duas
  // deixam de fora o que já foi concluído ou cancelado.
  const filtros =
    panelTab === "minhas"
      ? { responsavel: "eu", status: "abertas" }
      : panelTab === "todas"
        ? { status: "abertas" }
        : { };

  const carregar = useCallback(async (filtrosAtuais) => {
    setCarregando(true);
    try {
      const [listaTarefas, listaProcessos, listaUsuarios] = await Promise.all([
        getTarefas(filtrosAtuais),
        getProcessos(),
        getUsuarios(),
      ]);
      setTarefas(normalizarLista(listaTarefas));
      setProcessos(normalizarLista(listaProcessos));
      setUsuarios(normalizarLista(listaUsuarios).filter((u) => u.ativo));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (ativo) carregar(filtros);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, panelTab, carregar]);

  async function salvar(evento) {
    evento.preventDefault();
    setErro("");
    try {
      await createTarefa({
        ...form,
        processo: form.processo || null,
        prazo: form.prazo || null,
      });
      setForm({ ...tarefaInicial, responsavel: form.responsavel });
      setPanelTab("minhas");
    } catch (e) {
      setErro(e.message);
    }
  }

  async function mudarStatus(tarefa, status) {
    setErro("");
    try {
      await updateTarefa(tarefa.id, { status });
      carregar(filtros);
    } catch (e) {
      setErro(e.message);
    }
  }

  const abas = [
    { id: "minhas", label: "Minhas tarefas" },
    { id: "todas", label: "Do escritório" },
    { id: "historico", label: "Histórico" },
    { id: "nova", label: "Nova tarefa" },
  ];

  if (!ativo) return null;

  const atrasadas = tarefas.filter((tarefa) => tarefa.atrasada).length;

  return (
    <OverlayPanel tabs={abas}>
      {erro && <div className="form-error">{erro}</div>}

      {panelTab !== "nova" && (
        <>
          <div className="resumo-linha">
            <span>
              {panelTab === "historico" ? "Registros" : "Em aberto"}:{" "}
              <strong>{tarefas.length}</strong>
            </span>
            {atrasadas > 0 && (
              <span>
                Atrasadas: <strong>{atrasadas}</strong>
              </span>
            )}
          </div>
          <table>
            <thead>
              <tr>
                <th>Tarefa</th>
                <th>Responsável</th>
                <th>Processo</th>
                <th>Prazo</th>
                <th>Prioridade</th>
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
              {!carregando && tarefas.length === 0 && (
                <tr>
                  <td colSpan="7">
                    {panelTab === "minhas"
                      ? "Você não tem tarefas em aberto."
                      : "Nenhuma tarefa por aqui."}
                  </td>
                </tr>
              )}
              {!carregando &&
                tarefas.map((tarefa) => (
                  <tr key={tarefa.id}>
                    <td>
                      {tarefa.titulo}
                      {tarefa.descricao && (
                        <div className="celula-secundaria">{tarefa.descricao}</div>
                      )}
                    </td>
                    <td>{tarefa.responsavel_nome}</td>
                    <td>{tarefa.numero_processo || "—"}</td>
                    <td>
                      {formatarPrazo(tarefa)}
                      {tarefa.atrasada && (
                        <span className="badge badge-danger" style={{ marginLeft: 6 }}>
                          Atrasada
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${BADGE_PRIORIDADE[tarefa.prioridade]}`}>
                        {tarefa.prioridade_display}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${BADGE_STATUS[tarefa.status]}`}>
                        {tarefa.status_display}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {tarefa.status === "aberta" && (
                          <button
                            type="button"
                            className="row-action"
                            title="Marcar como em andamento"
                            aria-label="Marcar como em andamento"
                            onClick={() => mudarStatus(tarefa, "em_andamento")}
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                        {tarefa.status !== "concluida" && tarefa.status !== "cancelada" && (
                          <button
                            type="button"
                            className="row-action"
                            title="Concluir tarefa"
                            aria-label="Concluir tarefa"
                            onClick={() => mudarStatus(tarefa, "concluida")}
                          >
                            <Check size={15} />
                          </button>
                        )}
                        {(tarefa.status === "concluida" || tarefa.status === "cancelada") && (
                          <button
                            type="button"
                            className="row-action"
                            title="Reabrir tarefa"
                            aria-label="Reabrir tarefa"
                            onClick={() => mudarStatus(tarefa, "aberta")}
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="row-action row-action-danger"
                          title={t("acao_excluir")}
                          aria-label={t("acao_excluir")}
                          onClick={async () => {
                            if (window.confirm("Excluir esta tarefa?")) {
                              await deleteTarefa(tarefa.id);
                              carregar(filtros);
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
        </>
      )}

      {panelTab === "nova" && (
        <form onSubmit={salvar}>
          <div className="form-field">
            <label>O que precisa ser feito</label>
            <input
              required
              maxLength={200}
              placeholder="Ex.: levantar jurisprudência sobre horas in itinere"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label>Responsável</label>
              <select
                required
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
              >
                <option value="">Selecione</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                    {usuario && u.id === usuario.id ? " (você)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Processo (opcional)</label>
              <select
                value={form.processo}
                onChange={(e) => setForm({ ...form, processo: e.target.value })}
              >
                <option value="">Nenhum — tarefa do escritório</option>
                {processos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.numero_processo} — {p.titulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Prioridade</label>
              <select
                value={form.prioridade}
                onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
              >
                {PRIORIDADES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Prazo (opcional)</label>
              <input
                type="date"
                value={form.prazo}
                onChange={(e) => setForm({ ...form, prazo: e.target.value })}
              />
            </div>
          </div>
          <div className="form-field">
            <label>Detalhes (opcional)</label>
            <textarea
              rows={3}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Criar tarefa
          </button>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 10 }}>
            Quem receber a tarefa é avisado por e-mail, a menos que tenha
            desligado esse aviso nas configurações.
          </p>
        </form>
      )}
    </OverlayPanel>
  );
}
