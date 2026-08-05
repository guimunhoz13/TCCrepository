"use client";

import { useEffect, useState } from "react";
import { usePanel } from "@/contexts/PanelContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  normalizarLista,
} from "@/services/api";

const formularioInicial = {
  nome: "",
  cpf: "",
  email: "",
  telefone: "",
  endereco: "",
  data_nascimento: "",
  ativo: true,
};

function formatarCPF(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatarTelefone(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export default function ClientesPanel() {
  const { activePanel, panelTab } = usePanel();
  const [clientes, setClientes] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarClientes() {
    try {
      setCarregando(true);
      const dados = await getClientes();
      setClientes(normalizarLista(dados));
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (activePanel === "clientes") {
      carregarClientes();
    }
  }, [activePanel]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    try {
      setSalvando(true);
      await createCliente({
        ...formulario,
        data_nascimento: formulario.data_nascimento || null,
      });
      setFormulario(formularioInicial);
      setSucesso("Cliente cadastrado com sucesso.");
      await carregarClientes();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  if (activePanel !== "clientes") return null;

  return (
    <OverlayPanel
      tabs={[
        { id: "lista", label: "Lista" },
        { id: "novo", label: "Novo cliente" },
      ]}
    >
      {erro && <div className="alert alert-error">{erro}</div>}
      {sucesso && <div className="alert alert-success">{sucesso}</div>}

      {panelTab === "novo" ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Nome</label>
            <input
              value={formulario.nome}
              onChange={(e) =>
                setFormulario({ ...formulario, nome: e.target.value })
              }
              required
            />
          </div>
          <div className="form-field">
            <label>CPF</label>
            <input
              value={formulario.cpf}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  cpf: formatarCPF(e.target.value),
                })
              }
              required
            />
          </div>
          <div className="form-field">
            <label>E-mail</label>
            <input
              type="email"
              value={formulario.email}
              onChange={(e) =>
                setFormulario({ ...formulario, email: e.target.value })
              }
              required
            />
          </div>
          <div className="form-field">
            <label>Telefone</label>
            <input
              value={formulario.telefone}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  telefone: formatarTelefone(e.target.value),
                })
              }
              required
            />
          </div>
          <div className="form-field full">
            <label>Endereço</label>
            <input
              value={formulario.endereco}
              onChange={(e) =>
                setFormulario({ ...formulario, endereco: e.target.value })
              }
              required
            />
          </div>
          <div className="form-field">
            <label>Data de nascimento</label>
            <input
              type="date"
              value={formulario.data_nascimento}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  data_nascimento: e.target.value,
                })
              }
            />
          </div>
          <div className="form-field full">
            <button className="btn btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Cadastrar cliente"}
            </button>
          </div>
        </form>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>E-mail</th>
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
                clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nome}</td>
                    <td>{cliente.cpf}</td>
                    <td>{cliente.email}</td>
                    <td>
                      <span
                        className={`badge ${
                          cliente.ativo ? "badge-success" : "badge-muted"
                        }`}
                      >
                        {cliente.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={async () => {
                            await updateCliente(cliente.id, {
                              ativo: !cliente.ativo,
                            });
                            carregarClientes();
                          }}
                        >
                          {cliente.ativo ? "Inativar" : "Ativar"}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={async () => {
                            if (
                              window.confirm(
                                `Excluir ${cliente.nome}?`
                              )
                            ) {
                              await deleteCliente(cliente.id);
                              carregarClientes();
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
