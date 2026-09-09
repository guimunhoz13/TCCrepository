"use client";

import { useEffect, useState } from "react";
import { usePanel } from "@/contexts/PanelContext";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import { MessageCircle } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { abrirWhatsApp, montarMensagemCliente } from "@/utils/whatsapp";
import { formatarCPF, formatarRG, formatarTelefone } from "@/utils/mascaras";
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
  rg: "",
  estado_civil: "",
  nacionalidade: "Brasileira",
  ativo: true,
};

const ESTADOS_CIVIS = [
  { value: "", label: "Selecione" },
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "uniao_estavel", label: "União estável" },
];

export default function ClientesPanel() {
  const { activePanel, panelTab, setPanelTab } = usePanel();
  const { refresh: refreshDashboard } = useDashboardData();
  const { t } = usePreferences();
  const [clientes, setClientes] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [foto, setFoto] = useState(null);
  const [documentoIdentidade, setDocumentoIdentidade] = useState(null);
  const [clienteEditando, setClienteEditando] = useState(null);
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

  function handleIniciarEdicao(cliente) {
    setErro("");
    setSucesso("");
    setClienteEditando(cliente);
    setFormulario({
      nome: cliente.nome || "",
      cpf: cliente.cpf ? formatarCPF(cliente.cpf) : "",
      email: cliente.email || "",
      telefone: cliente.telefone ? formatarTelefone(cliente.telefone) : "",
      endereco: cliente.endereco || "",
      data_nascimento: cliente.data_nascimento
        ? cliente.data_nascimento.slice(0, 10)
        : "",
      rg: cliente.rg ? formatarRG(cliente.rg) : "",
      estado_civil: cliente.estado_civil || "",
      nacionalidade: cliente.nacionalidade || "Brasileira",
      ativo: cliente.ativo !== undefined ? cliente.ativo : true,
    });
    setFoto(null);
    setDocumentoIdentidade(null);
    setPanelTab("novo");
  }

  function handleCancelarEdicao() {
    setClienteEditando(null);
    setFormulario(formularioInicial);
    setFoto(null);
    setDocumentoIdentidade(null);
    setPanelTab("lista");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    try {
      setSalvando(true);
      const payload = new FormData();
      payload.append("nome", formulario.nome);
      payload.append("cpf", formulario.cpf);
      payload.append("email", formulario.email);
      payload.append("telefone", formulario.telefone);
      payload.append("endereco", formulario.endereco);
      if (formulario.data_nascimento) {
        payload.append("data_nascimento", formulario.data_nascimento);
      }
      payload.append("rg", formulario.rg);
      payload.append("estado_civil", formulario.estado_civil);
      payload.append("nacionalidade", formulario.nacionalidade);
      payload.append("ativo", formulario.ativo);
      if (foto) payload.append("foto", foto);
      if (documentoIdentidade) payload.append("documento_identidade", documentoIdentidade);

      if (clienteEditando) {
        await updateCliente(clienteEditando.id, payload);
        setSucesso("Cliente atualizado com sucesso.");
      } else {
        await createCliente(payload);
        setSucesso("Cliente cadastrado com sucesso.");
      }

      setFormulario(formularioInicial);
      setFoto(null);
      setDocumentoIdentidade(null);
      setClienteEditando(null);
      setPanelTab("lista");
      await carregarClientes();
      refreshDashboard().catch(() => {});
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
        { id: "lista", label: t("aba_lista") },
        {
          id: "novo",
          label: clienteEditando ? t("acao_editar") : t("aba_novo"),
        },
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
          <div className="form-field">
            <label>RG</label>
            <input
              value={formulario.rg}
              onChange={(e) =>
                setFormulario({ ...formulario, rg: formatarRG(e.target.value) })
              }
            />
          </div>
          <div className="form-field">
            <label>Estado civil</label>
            <select
              value={formulario.estado_civil}
              onChange={(e) =>
                setFormulario({ ...formulario, estado_civil: e.target.value })
              }
            >
              {ESTADOS_CIVIS.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Nacionalidade</label>
            <input
              value={formulario.nacionalidade}
              onChange={(e) =>
                setFormulario({ ...formulario, nacionalidade: e.target.value })
              }
            />
          </div>
          <div className="form-field">
            <label>Foto (opcional)</label>
            {clienteEditando?.foto && !foto && (
              <img src={clienteEditando.foto} alt="" className="avatar-preview" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
            />
          </div>
          <div className="form-field">
            <label>Documento (RG/CPF/CNH) — opcional</label>
            {clienteEditando?.documento_identidade && !documentoIdentidade && (
              <a
                href={clienteEditando.documento_identidade}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ marginBottom: 8, alignSelf: "flex-start" }}
              >
                Ver documento atual
              </a>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setDocumentoIdentidade(e.target.files?.[0] || null)}
            />
          </div>
          <div
            className="form-field full"
            style={{ display: "flex", gap: "10px", marginTop: "8px" }}
          >
            <button className="btn btn-primary" disabled={salvando}>
              {salvando
                ? t("acao_salvando")
                : clienteEditando
                ? t("acao_salvar_alteracoes")
                : t("acao_cadastrar_cliente")}
            </button>
            {clienteEditando && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelarEdicao}
                disabled={salvando}
              >
                {t("acao_cancelar")}
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
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
                  <td colSpan="6">Carregando...</td>
                </tr>
              )}
              {!carregando &&
                clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td><Avatar src={cliente.foto} nome={cliente.nome} /></td>
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
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleIniciarEdicao(cliente)}
                        >
                          {t("acao_editar")}
                        </button>
                        {cliente.telefone && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            title={t("acao_enviar_whatsapp")}
                            onClick={() =>
                              abrirWhatsApp(cliente.telefone, montarMensagemCliente(cliente))
                            }
                          >
                            <MessageCircle size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={async () => {
                            await updateCliente(cliente.id, {
                              ativo: !cliente.ativo,
                            });
                            carregarClientes();
                            refreshDashboard().catch(() => {});
                          }}
                        >
                          {cliente.ativo ? t("acao_inativar") : t("acao_ativar")}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={async () => {
                            if (
                              window.confirm(`Excluir ${cliente.nome}?`)
                            ) {
                              await deleteCliente(cliente.id);
                              carregarClientes();
                              refreshDashboard().catch(() => {});
                            }
                          }}
                        >
                          {t("acao_excluir")}
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