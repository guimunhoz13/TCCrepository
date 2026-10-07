"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRecurso } from "@/hooks/useRecurso";
import { useAvisos } from "@/contexts/AvisosContext";
import { getTarefas, listarTudo, updateTarefa } from "@/services/api";

export const COLUNAS = [
  { status: "aberta", titulo: "A fazer" },
  { status: "em_andamento", titulo: "Fazendo" },
  { status: "concluida", titulo: "Concluídas", dica: "últimas 2 semanas" },
];

const BADGE_PRIORIDADE = {
  alta: "badge-danger",
  media: "badge-warning",
  baixa: "badge-muted",
};

function formatarPrazo(prazo) {
  return new Date(`${prazo}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Agrupa as tarefas por coluna, aplicando os movimentos ainda não
 * confirmados pela API (`movidas`: id → status) para o cartão mudar de
 * lugar na hora, sem esperar a resposta.
 */
export function agruparPorColuna(tarefas, movidas = {}) {
  const grupos = Object.fromEntries(COLUNAS.map((coluna) => [coluna.status, []]));
  for (const tarefa of tarefas) {
    const status = movidas[tarefa.id] ?? tarefa.status;
    grupos[status]?.push({ ...tarefa, status });
  }
  return grupos;
}

/**
 * Quadro Kanban das tarefas. Arrastar o cartão muda a situação; no celular
 * (onde arrastar não funciona bem) e no teclado, as setas do cartão fazem
 * o mesmo.
 */
export default function TarefasQuadro({ ativo, podeEditar }) {
  const avisar = useAvisos();
  const [somenteMinhas, setSomenteMinhas] = useState(false);
  const [movidas, setMovidas] = useState({});
  const [arrastando, setArrastando] = useState(null);
  const [colunaAlvo, setColunaAlvo] = useState(null);

  const recurso = useRecurso(
    () => listarTudo(getTarefas, { status: "quadro", ...(somenteMinhas ? { responsavel: "eu" } : {}) }),
    [somenteMinhas],
    { ativo }
  );
  const tarefas = recurso.dados ?? [];
  const grupos = agruparPorColuna(tarefas, movidas);

  async function mover(tarefa, status) {
    if (!podeEditar || tarefa.status === status) return;
    setMovidas((atual) => ({ ...atual, [tarefa.id]: status }));
    try {
      await updateTarefa(tarefa.id, { status });
      const coluna = COLUNAS.find((c) => c.status === status);
      avisar(`"${tarefa.titulo}" foi para ${coluna.titulo}.`);
      recurso.recarregar();
    } catch (e) {
      avisar(e.message, "erro");
    } finally {
      setMovidas(({ [tarefa.id]: _descartado, ...resto }) => resto);
    }
  }

  function soltar(evento, status) {
    evento.preventDefault();
    setColunaAlvo(null);
    const id = Number(evento.dataTransfer.getData("text/plain"));
    const tarefa = tarefas.find((t) => t.id === id);
    setArrastando(null);
    if (tarefa) mover({ ...tarefa, status: movidas[id] ?? tarefa.status }, status);
  }

  return (
    <>
      <div className="quadro-filtros">
        <label className="toggle-row" style={{ border: 0, padding: 0 }}>
          <span className="toggle-label">Só as minhas</span>
          <span className="switch">
            <input
              type="checkbox"
              checked={somenteMinhas}
              onChange={(e) => setSomenteMinhas(e.target.checked)}
            />
            <span className="switch-track" />
          </span>
        </label>
        {podeEditar && (
          <span className="dica-campo" style={{ marginTop: 0 }}>
            Arraste o cartão ou use as setas para mudar a situação.
          </span>
        )}
      </div>

      {recurso.erro && <div className="alert alert-error">{recurso.erro}</div>}

      <div className="quadro" aria-busy={recurso.carregando}>
        {COLUNAS.map((coluna, indice) => {
          const cartoes = grupos[coluna.status];
          return (
            <section
              key={coluna.status}
              className={`quadro-coluna ${colunaAlvo === coluna.status ? "alvo" : ""}`}
              aria-labelledby={`coluna-${coluna.status}`}
              onDragOver={(e) => {
                if (!arrastando) return;
                e.preventDefault();
                setColunaAlvo(coluna.status);
              }}
              onDragLeave={() => setColunaAlvo(null)}
              onDrop={(e) => soltar(e, coluna.status)}
            >
              <header>
                <h4 id={`coluna-${coluna.status}`}>{coluna.titulo}</h4>
                <span className="quadro-contagem">{cartoes.length}</span>
                {coluna.dica && <span className="dica-campo">{coluna.dica}</span>}
              </header>

              {recurso.carregando && tarefas.length === 0 && (
                <div className="quadro-vazio">Carregando…</div>
              )}
              {!recurso.carregando && cartoes.length === 0 && (
                <div className="quadro-vazio">Nada por aqui.</div>
              )}

              <ul>
                {cartoes.map((tarefa) => {
                  const anterior = COLUNAS[indice - 1];
                  const proxima = COLUNAS[indice + 1];
                  return (
                    <li
                      key={tarefa.id}
                      className={`quadro-cartao ${arrastando === tarefa.id ? "arrastando" : ""}`}
                      draggable={podeEditar}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(tarefa.id));
                        e.dataTransfer.effectAllowed = "move";
                        setArrastando(tarefa.id);
                      }}
                      onDragEnd={() => {
                        setArrastando(null);
                        setColunaAlvo(null);
                      }}
                    >
                      <strong>{tarefa.titulo}</strong>
                      {tarefa.numero_processo && (
                        <span className="quadro-processo">{tarefa.numero_processo}</span>
                      )}
                      <div className="quadro-meta">
                        <span className={`badge ${BADGE_PRIORIDADE[tarefa.prioridade]}`}>
                          {tarefa.prioridade_display}
                        </span>
                        {tarefa.prazo && (
                          <span className={`badge ${tarefa.atrasada ? "badge-danger" : "badge-muted"}`}>
                            {tarefa.atrasada ? "Atrasada · " : ""}
                            {formatarPrazo(tarefa.prazo)}
                          </span>
                        )}
                        <span className="quadro-responsavel">{tarefa.responsavel_nome}</span>
                      </div>
                      {podeEditar && (
                        <div className="quadro-setas">
                          {anterior && (
                            <button
                              type="button"
                              className="row-action"
                              aria-label={`Mover "${tarefa.titulo}" para ${anterior.titulo}`}
                              title={`Mover para ${anterior.titulo}`}
                              onClick={() => mover(tarefa, anterior.status)}
                            >
                              <ChevronLeft size={15} />
                            </button>
                          )}
                          {proxima && (
                            <button
                              type="button"
                              className="row-action"
                              aria-label={`Mover "${tarefa.titulo}" para ${proxima.titulo}`}
                              title={`Mover para ${proxima.titulo}`}
                              onClick={() => mover(tarefa, proxima.status)}
                            >
                              <ChevronRight size={15} />
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
