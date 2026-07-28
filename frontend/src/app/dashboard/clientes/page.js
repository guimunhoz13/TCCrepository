"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/layout/Header";

import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
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


function normalizarLista(dados) {
  if (Array.isArray(dados)) {
    return dados;
  }

  if (Array.isArray(dados?.results)) {
    return dados.results;
  }

  return [];
}


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


function formatarData(data) {
  if (!data) {
    return "-";
  }

  const [ano, mes, dia] = data.split("-");

  return `${dia}/${mes}/${ano}`;
}


function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [clienteEmProcessamento, setClienteEmProcessamento] =
    useState(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [avisos, setAvisos] = useState({});


  async function carregarClientes() {
    try {
      setCarregando(true);
      setErro("");

      const dados = await getClientes();

      setClientes(normalizarLista(dados));
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);

      setErro("Não foi possível carregar os clientes.");
    } finally {
      setCarregando(false);
    }
  }


  useEffect(() => {
    carregarClientes();
  }, []);


  function alterarCampo(event) {
    const { name, value, type, checked } = event.target;

    let valorFormatado =
      type === "checkbox" ? checked : value;

    setAvisos((avisosAtuais) => ({
      ...avisosAtuais,
      [name]: "",
    }));

    if (name === "cpf") {
      if (/[a-zA-Z]/.test(value)) {
        setAvisos((avisosAtuais) => ({
          ...avisosAtuais,
          cpf: "No CPF são permitidos somente números.",
        }));
      }

      valorFormatado = formatarCPF(value);
    }

    if (name === "telefone") {
      if (/[a-zA-Z]/.test(value)) {
        setAvisos((avisosAtuais) => ({
          ...avisosAtuais,
          telefone:
            "No telefone são permitidos somente números.",
        }));
      }

      valorFormatado = formatarTelefone(value);
    }

    if (name === "email") {
      if (/\s/.test(value)) {
        setAvisos((avisosAtuais) => ({
          ...avisosAtuais,
          email: "O e-mail não pode conter espaços.",
        }));
      }

      valorFormatado = value
        .replace(/\s/g, "")
        .toLowerCase();
    }

    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      [name]: valorFormatado,
    }));
  }


  function validarEmail() {
    if (
      formulario.email &&
      !emailValido(formulario.email)
    ) {
      setAvisos((avisosAtuais) => ({
        ...avisosAtuais,
        email: "Digite um e-mail válido.",
      }));

      return false;
    }

    return true;
  }


  async function cadastrarCliente(event) {
    event.preventDefault();

    const cpfNumeros = formulario.cpf.replace(/\D/g, "");
    const telefoneNumeros =
      formulario.telefone.replace(/\D/g, "");

    if (cpfNumeros.length !== 11) {
      setAvisos((avisosAtuais) => ({
        ...avisosAtuais,
        cpf: "O CPF deve possuir 11 números.",
      }));

      return;
    }

    if (
      telefoneNumeros.length < 10 ||
      telefoneNumeros.length > 11
    ) {
      setAvisos((avisosAtuais) => ({
        ...avisosAtuais,
        telefone:
          "O telefone deve possuir 10 ou 11 números.",
      }));

      return;
    }

    if (!validarEmail()) {
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const dadosCliente = {
        ...formulario,
        data_nascimento:
          formulario.data_nascimento || null,
      };

      await createCliente(dadosCliente);

      setFormulario(formularioInicial);
      setAvisos({});
      setSucesso("Cliente cadastrado com sucesso.");

      await carregarClientes();
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);

      setErro(
        error.message ||
          "Não foi possível cadastrar o cliente."
      );
    } finally {
      setSalvando(false);
    }
  }


  async function alterarStatusCliente(cliente) {
    const novoStatus = !cliente.ativo;

    const acao = novoStatus ? "ativar" : "inativar";

    const confirmou = window.confirm(
      `Deseja realmente ${acao} o cliente ${cliente.nome}?`
    );

    if (!confirmou) {
      return;
    }

    try {
      setClienteEmProcessamento(cliente.id);
      setErro("");
      setSucesso("");

      await updateCliente(cliente.id, {
        ativo: novoStatus,
      });

      setSucesso(
        novoStatus
          ? "Cliente ativado com sucesso."
          : "Cliente inativado com sucesso."
      );

      await carregarClientes();
    } catch (error) {
      console.error(
        "Erro ao alterar status do cliente:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível alterar o status do cliente."
      );
    } finally {
      setClienteEmProcessamento(null);
    }
  }


  async function excluirCliente(cliente) {
    const confirmou = window.confirm(
      `Deseja realmente excluir o cliente ${cliente.nome}? Essa ação não poderá ser desfeita.`
    );

    if (!confirmou) {
      return;
    }

    try {
      setClienteEmProcessamento(cliente.id);
      setErro("");
      setSucesso("");

      await deleteCliente(cliente.id);

      setSucesso("Cliente excluído com sucesso.");

      await carregarClientes();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);

      setErro(
        error.message ||
          "Não foi possível excluir o cliente. Ele pode estar vinculado a algum processo."
      );
    } finally {
      setClienteEmProcessamento(null);
    }
  }


  return (
    <div
      className="d-flex"
      style={{
        background: "#F8FAFC",
        minHeight: "100vh",
      }}
    >
      <Sidebar />

      <div className="flex-grow-1 p-4">
        <Header title="Clientes" />

        {erro && (
          <div className="alert alert-danger" role="alert">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="alert alert-success" role="alert">
            {sucesso}
          </div>
        )}

        <div
          className="p-4 rounded-4 shadow-sm mb-5"
          style={{ background: "white" }}
        >
          <h4
            className="fw-bold mb-4"
            style={{ color: "var(--color-primary)" }}
          >
            Cadastrar cliente
          </h4>

          <form onSubmit={cadastrarCliente}>
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="nome" className="form-label">
                  Nome
                </label>

                <input
                  id="nome"
                  name="nome"
                  type="text"
                  className="form-control"
                  value={formulario.nome}
                  onChange={alterarCampo}
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="cpf" className="form-label">
                  CPF
                </label>

                <input
                  id="cpf"
                  name="cpf"
                  type="text"
                  inputMode="numeric"
                  className={`form-control ${
                    avisos.cpf ? "is-invalid" : ""
                  }`}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={formulario.cpf}
                  onChange={alterarCampo}
                  required
                />

                {avisos.cpf && (
                  <div className="invalid-feedback">
                    {avisos.cpf}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="email" className="form-label">
                  E-mail
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`form-control ${
                    avisos.email ? "is-invalid" : ""
                  }`}
                  placeholder="cliente@email.com"
                  value={formulario.email}
                  onChange={alterarCampo}
                  onBlur={validarEmail}
                  required
                />

                {avisos.email && (
                  <div className="invalid-feedback">
                    {avisos.email}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label
                  htmlFor="telefone"
                  className="form-label"
                >
                  Telefone
                </label>

                <input
                  id="telefone"
                  name="telefone"
                  type="text"
                  inputMode="numeric"
                  className={`form-control ${
                    avisos.telefone ? "is-invalid" : ""
                  }`}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  value={formulario.telefone}
                  onChange={alterarCampo}
                  required
                />

                {avisos.telefone && (
                  <div className="invalid-feedback">
                    {avisos.telefone}
                  </div>
                )}
              </div>

              <div className="col-md-8">
                <label
                  htmlFor="endereco"
                  className="form-label"
                >
                  Endereço
                </label>

                <input
                  id="endereco"
                  name="endereco"
                  type="text"
                  className="form-control"
                  value={formulario.endereco}
                  onChange={alterarCampo}
                  required
                />
              </div>

              <div className="col-md-4">
                <label
                  htmlFor="data_nascimento"
                  className="form-label"
                >
                  Data de nascimento
                </label>

                <input
                  id="data_nascimento"
                  name="data_nascimento"
                  type="date"
                  className="form-control"
                  value={formulario.data_nascimento}
                  onChange={alterarCampo}
                />
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    id="ativo"
                    name="ativo"
                    type="checkbox"
                    className="form-check-input"
                    checked={formulario.ativo}
                    onChange={alterarCampo}
                  />

                  <label
                    htmlFor="ativo"
                    className="form-check-label"
                  >
                    Cliente ativo
                  </label>
                </div>
              </div>

              <div className="col-12">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={salvando}
                >
                  {salvando
                    ? "Cadastrando..."
                    : "Cadastrar cliente"}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div
          className="p-4 rounded-4 shadow-sm"
          style={{ background: "white" }}
        >
          <h4
            className="fw-bold mb-4"
            style={{ color: "var(--color-primary)" }}
          >
            Clientes cadastrados
          </h4>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Nascimento</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {carregando && (
                  <tr>
                    <td colSpan="7">
                      Carregando clientes...
                    </td>
                  </tr>
                )}

                {!carregando &&
                  clientes.map((cliente) => {
                    const processando =
                      clienteEmProcessamento === cliente.id;

                    return (
                      <tr key={cliente.id}>
                        <td>{cliente.nome}</td>
                        <td>{cliente.cpf}</td>
                        <td>{cliente.email}</td>
                        <td>{cliente.telefone}</td>

                        <td>
                          {formatarData(
                            cliente.data_nascimento
                          )}
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              cliente.ativo
                                ? "text-bg-success"
                                : "text-bg-secondary"
                            }`}
                          >
                            {cliente.ativo
                              ? "Ativo"
                              : "Inativo"}
                          </span>
                        </td>

                        <td>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className={`btn btn-sm ${
                                cliente.ativo
                                  ? "btn-outline-warning"
                                  : "btn-outline-success"
                              }`}
                              onClick={() =>
                                alterarStatusCliente(cliente)
                              }
                              disabled={processando}
                            >
                              {cliente.ativo
                                ? "Inativar"
                                : "Ativar"}
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                excluirCliente(cliente)
                              }
                              disabled={processando}
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!carregando &&
                  clientes.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        Nenhum cliente cadastrado.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}