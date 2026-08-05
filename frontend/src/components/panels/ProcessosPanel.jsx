"use client";

import { useEffect, useState } from "react";
import { usePanel } from "@/contexts/PanelContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import {
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
};

export default function ProcessosPanel() {
  const { activePanel, panelTab } = usePanel();
  const [processos, setProcessos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [advogados, setAdvogados] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    try {
      setCarregando(true);
      const [dadosProcessos, dadosClientes, dadosAdvogados] =
        await Promise.all([getProcessos(), getClientes(), getAdvogados()]);
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
  }, [activePanel]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    try {
      setSalvando(true);
      await createProcesso({
        ...formulario,
        cliente: Number(formulario.cliente),
        advogado: Number(formulario.advogado),
        data_inicio: formulario.data_inicio || null,
        data_fim: formulario.data_fim || null,
      });
      setFormulario(formularioInicial);
      await carregarDados();
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
        { id: "lista", label: "Lista" },
        { id: "novo", label: "Novo processo" },
      ]}
    >
      {erro && <div className="alert alert-error">{erro}</div>}

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
            <button className="btn btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Cadastrar processo"}
            </button>
          </div>
        </form>
      ) : (
        <div className="table-wrap">
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
              {carregando && (
                <tr>
                  <td colSpan="5">Carregando...</td>
                </tr>
              )}
              {!carregando &&
                processos.map((processo) => (
                  <tr key={processo.id}>
                    <td>{processo.numero_processo}</td>
                    <td>{processo.cliente_nome}</td>
                    <td>{processo.advogado_nome}</td>
                    <td>
                      <span className="badge badge-muted">
                        {processo.status === "Concluido"
                          ? "Concluído"
                          : processo.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={async () => {
                            await updateProcesso(processo.id, {
                              status:
                                processo.status === "Em andamento"
                                  ? "Concluido"
                                  : "Em andamento",
                            });
                            carregarDados();
                          }}
                        >
                          Alternar status
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={async () => {
                            if (window.confirm("Excluir processo?")) {
                              await deleteProcesso(processo.id);
                              carregarDados();
                            }
                          }}
                        >
                          Excluir
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
