"use client";

import { useEffect, useState } from "react";
import { usePanel } from "@/contexts/PanelContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import {
  getAgenda,
  createAgenda,
  deleteAgenda,
  getProcessos,
  normalizarLista,
} from "@/services/api";

const formularioInicial = {
  processo: "",
  titulo: "",
  descricao: "",
  data_evento: "",
  local_evento: "",
};

export default function AgendaPanel() {
  const { activePanel, panelTab } = usePanel();
  const [eventos, setEventos] = useState([]);
  const [processos, setProcessos] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    try {
      setCarregando(true);
      const [dadosAgenda, dadosProcessos] = await Promise.all([
        getAgenda(),
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
  }, [activePanel]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    try {
      await createAgenda({
        ...formulario,
        processo: Number(formulario.processo),
      });
      setFormulario(formularioInicial);
      await carregarDados();
    } catch (error) {
      setErro(error.message);
    }
  }

  if (activePanel !== "agenda") return null;

  return (
    <OverlayPanel
      tabs={[
        { id: "lista", label: "Eventos" },
        { id: "novo", label: "Novo evento" },
      ]}
    >
      {erro && <div className="alert alert-error">{erro}</div>}

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
              required
            />
          </div>
          <div className="form-field full">
            <button className="btn btn-primary">Agendar evento</button>
          </div>
        </form>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Processo</th>
                <th>Data</th>
                <th>Local</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr>
                  <td colSpan="5">Carregando...</td>
                </tr>
              )}
              {!carregando &&
                eventos.map((evento) => (
                  <tr key={evento.id}>
                    <td>{evento.titulo}</td>
                    <td>{evento.numero_processo}</td>
                    <td>
                      {new Date(evento.data_evento).toLocaleString("pt-BR")}
                    </td>
                    <td>{evento.local_evento}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          if (window.confirm("Excluir evento?")) {
                            await deleteAgenda(evento.id);
                            carregarDados();
                          }
                        }}
                      >
                        Excluir
                      </button>
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
