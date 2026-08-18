"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  createAgenda,
  getProcessos,
  normalizarLista,
} from "@/services/api";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatarDataLocal(ano, mes, dia) {
  const m = String(mes + 1).padStart(2, "0");
  const d = String(dia).padStart(2, "0");
  return `${ano}-${m}-${d}`;
}

export default function MiniCalendar({ eventos = [], onEventoCriado }) {
  const hoje = new Date();
  const [viewDate, setViewDate] = useState(
    () => new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  );
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [processos, setProcessos] = useState([]);
  const [formulario, setFormulario] = useState({
    processo: "",
    titulo: "",
    data_evento: "",
    local_evento: "",
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const ano = viewDate.getFullYear();
  const mes = viewDate.getMonth();

  const { dias, mesAtual } = useMemo(() => {
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    const diasDoMes = [];
    for (let i = 0; i < primeiroDia.getDay(); i += 1) {
      diasDoMes.push(null);
    }
    for (let dia = 1; dia <= ultimoDia.getDate(); dia += 1) {
      diasDoMes.push(dia);
    }

    return {
      dias: diasDoMes,
      mesAtual: viewDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
    };
  }, [ano, mes, viewDate]);

  const eventosPorDia = useMemo(() => {
    const mapa = new Map();
    eventos.forEach((evento) => {
      const data = new Date(evento.data_evento);
      if (data.getMonth() === mes && data.getFullYear() === ano) {
        const dia = data.getDate();
        if (!mapa.has(dia)) mapa.set(dia, []);
        mapa.get(dia).push(evento);
      }
    });
    return mapa;
  }, [eventos, mes, ano]);

  const eventosDoDia = diaSelecionado
    ? eventosPorDia.get(diaSelecionado) || []
    : [];

  function mesAnterior() {
    setViewDate(new Date(ano, mes - 1, 1));
    setDiaSelecionado(null);
    setMostrarForm(false);
  }

  function mesProximo() {
    setViewDate(new Date(ano, mes + 1, 1));
    setDiaSelecionado(null);
    setMostrarForm(false);
  }

  function irParaHoje() {
    setViewDate(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
    setDiaSelecionado(hoje.getDate());
    setMostrarForm(false);
  }

  async function abrirFormulario(dia) {
    setDiaSelecionado(dia);
    setMostrarForm(true);
    setErro("");

    const dataBase = formatarDataLocal(ano, mes, dia);
    setFormulario({
      processo: "",
      titulo: "",
      data_evento: `${dataBase}T09:00`,
      local_evento: "",
    });

    if (processos.length === 0) {
      try {
        const dados = await getProcessos();
        setProcessos(normalizarLista(dados));
      } catch {
        /* processos opcionais para exibição */
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSalvando(true);

    try {
      await createAgenda({
        ...formulario,
        processo: Number(formulario.processo),
        descricao: formulario.titulo,
      });
      setMostrarForm(false);
      setFormulario({ processo: "", titulo: "", data_evento: "", local_evento: "" });
      onEventoCriado?.();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="panel-card">
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav-btn"
          onClick={mesAnterior}
          aria-label="Mês anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <h3>{mesAtual}</h3>
        <button
          type="button"
          className="calendar-nav-btn"
          onClick={mesProximo}
          aria-label="Próximo mês"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <button type="button" className="btn btn-sm btn-secondary" onClick={irParaHoje}>
          Hoje
        </button>
      </div>

      <div className="calendar-grid">
        {DIAS.map((dia) => (
          <div key={dia} className="calendar-day">
            {dia}
          </div>
        ))}

        {dias.map((dia, index) => {
          if (!dia) {
            return <div key={`empty-${index}`} />;
          }

          const isToday =
            dia === hoje.getDate() &&
            mes === hoje.getMonth() &&
            ano === hoje.getFullYear();
          const hasEvent = eventosPorDia.has(dia);
          const isSelected = diaSelecionado === dia;

          return (
            <button
              type="button"
              key={`${ano}-${mes}-${dia}`}
              className={`calendar-cell ${hasEvent ? "has-event" : ""} ${
                isToday ? "today" : ""
              } ${isSelected ? "selected" : ""}`}
              onClick={() => {
                setDiaSelecionado(dia);
                setMostrarForm(false);
              }}
            >
              {dia}
            </button>
          );
        })}
      </div>

      {diaSelecionado && (
        <div className="calendar-day-detail">
          <h4>
            {new Date(ano, mes, diaSelecionado).toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h4>

          {eventosDoDia.length === 0 && !mostrarForm && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Nenhum compromisso neste dia.
            </p>
          )}

          {eventosDoDia.map((evento) => (
            <div key={evento.id} className="calendar-event-item">
              <strong>{evento.titulo}</strong>
              <span>
                {new Date(evento.data_evento).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {evento.local_evento ? ` — ${evento.local_evento}` : ""}
              </span>
            </div>
          ))}

          {!mostrarForm && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              style={{ marginTop: 8 }}
              onClick={() => abrirFormulario(diaSelecionado)}
            >
              <Plus size={14} />
              Novo compromisso
            </button>
          )}

          {mostrarForm && (
            <form className="calendar-add-form" onSubmit={handleSubmit}>
              {erro && (
                <div className="alert alert-error" style={{ marginBottom: 0 }}>
                  {erro}
                </div>
              )}
              <select
                value={formulario.processo}
                onChange={(e) =>
                  setFormulario({ ...formulario, processo: e.target.value })
                }
                required
              >
                <option value="">Processo vinculado</option>
                {processos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.numero_processo} — {p.titulo}
                  </option>
                ))}
              </select>
              <input
                placeholder="Título do compromisso"
                value={formulario.titulo}
                onChange={(e) =>
                  setFormulario({ ...formulario, titulo: e.target.value })
                }
                required
              />
              <input
                type="datetime-local"
                value={formulario.data_evento}
                onChange={(e) =>
                  setFormulario({ ...formulario, data_evento: e.target.value })
                }
                required
              />
              <input
                placeholder="Local"
                value={formulario.local_evento}
                onChange={(e) =>
                  setFormulario({ ...formulario, local_evento: e.target.value })
                }
                required
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : "Agendar"}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setMostrarForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
