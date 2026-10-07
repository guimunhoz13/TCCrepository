"use client";

import { useConfirmacao } from "@/contexts/ConfirmacaoContext";
import { useAvisos } from "@/contexts/AvisosContext";

import { useState } from "react";
import { useListaPaginada } from "@/hooks/useRecurso";
import { useValorAtrasado } from "@/hooks/useValorAtrasado";
import RodapeLista from "@/components/ui/RodapeLista";
import { usePanel } from "@/contexts/PanelContext";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import { Download, EyeOff, MessageCircle, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { abrirWhatsApp, montarMensagemCliente } from "@/utils/whatsapp";
import { formatarCEP, formatarCNPJ, formatarCPF, formatarRG, formatarTelefone } from "@/utils/mascaras";
import { buscarEnderecoPorCep } from "@/utils/cep";
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  abrirDocumentoIdentidadeCliente,
  exportarDadosDoCliente,
  anonimizarCliente,
} from "@/services/api";
import LinhasCarregando from "@/components/ui/LinhasCarregando";
import { usePermissoes } from "@/hooks/usePermissoes";

const formularioInicial = {
  tipo_pessoa: "fisica",
  nome: "",
  cpf: "",
  cnpj: "",
  email: "",
  telefone: "",
  endereco: "",
  data_nascimento: "",
  rg: "",
  estado_civil: "",
  nacionalidade: "Brasileira",
  ativo: true,
  consentimento_lgpd: false,
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
  const confirmar = useConfirmacao();
  const avisar = useAvisos();
  const pode = usePermissoes();
  const { t } = usePreferences();
  const [busca, setBusca] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [foto, setFoto] = useState(null);
  const [documentoIdentidade, setDocumentoIdentidade] = useState(null);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const buscaAtrasada = useValorAtrasado(busca);
  const lista = useListaPaginada(
    (page) => getClientes({ busca: buscaAtrasada, page }),
    [buscaAtrasada],
    { ativo: activePanel === "clientes" }
  );
  const clientes = lista.itens;
  const carregando = lista.carregando && clientes.length === 0;
  const carregarClientes = lista.recarregar;

  function handleIniciarEdicao(cliente) {
    setErro("");
    setSucesso("");
    setClienteEditando(cliente);
    setFormulario({
      tipo_pessoa: cliente.tipo_pessoa || "fisica",
      nome: cliente.nome || "",
      cpf: cliente.cpf ? formatarCPF(cliente.cpf) : "",
      cnpj: cliente.cnpj ? formatarCNPJ(cliente.cnpj) : "",
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
      consentimento_lgpd: Boolean(cliente.consentimento_lgpd),
    });
    setFoto(null);
    setDocumentoIdentidade(null);
    setCep("");
    setPanelTab("novo");
  }

  async function handleBuscarCep(valor) {
    if ((valor || "").replace(/\D/g, "").length !== 8) return;

    try {
      setBuscandoCep(true);
      const endereco = await buscarEnderecoPorCep(valor);
      if (!endereco) return;

      const partes = [endereco.logradouro, endereco.bairro].filter(Boolean).join(", ");
      const cidadeUf = [endereco.cidade, endereco.estado].filter(Boolean).join("/");
      setFormulario((atual) => ({
        ...atual,
        endereco: [partes, cidadeUf].filter(Boolean).join(" - "),
      }));
    } finally {
      setBuscandoCep(false);
    }
  }

  function handleCancelarEdicao() {
    setClienteEditando(null);
    setFormulario(formularioInicial);
    setCep("");
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
      payload.append("tipo_pessoa", formulario.tipo_pessoa);
      payload.append("nome", formulario.nome);
      payload.append("cpf", formulario.tipo_pessoa === "fisica" ? formulario.cpf : "");
      payload.append("cnpj", formulario.tipo_pessoa === "juridica" ? formulario.cnpj : "");
      payload.append("email", formulario.email);
      payload.append("telefone", formulario.telefone);
      payload.append("endereco", formulario.endereco);
      const ehPessoaFisica = formulario.tipo_pessoa === "fisica";
      if (ehPessoaFisica && formulario.data_nascimento) {
        payload.append("data_nascimento", formulario.data_nascimento);
      }
      payload.append("rg", ehPessoaFisica ? formulario.rg : "");
      payload.append("estado_civil", ehPessoaFisica ? formulario.estado_civil : "");
      payload.append("nacionalidade", formulario.nacionalidade);
      payload.append("ativo", formulario.ativo);
      payload.append("consentimento_lgpd", formulario.consentimento_lgpd);
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
      setCep("");
      setFoto(null);
      setDocumentoIdentidade(null);
      setClienteEditando(null);
      setPanelTab("lista");
      carregarClientes();
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
        ...(pode("clientes", "criar") || clienteEditando
          ? [{ id: "novo", label: clienteEditando ? t("acao_editar") : t("aba_novo") }]
          : []),
      ]}
    >
      {(erro || lista.erro) && <div className="alert alert-error">{erro || lista.erro}</div>}
      {sucesso && <div className="alert alert-success">{sucesso}</div>}

      {panelTab === "novo" ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Tipo de pessoa</label>
            <select
              value={formulario.tipo_pessoa}
              onChange={(e) =>
                setFormulario({ ...formulario, tipo_pessoa: e.target.value })
              }
            >
              <option value="fisica">Pessoa Física</option>
              <option value="juridica">Pessoa Jurídica</option>
            </select>
          </div>
          <div className="form-field">
            <label>{formulario.tipo_pessoa === "juridica" ? "Razão social" : "Nome"}</label>
            <input
              value={formulario.nome}
              onChange={(e) =>
                setFormulario({ ...formulario, nome: e.target.value })
              }
              required
            />
          </div>
          {formulario.tipo_pessoa === "juridica" ? (
            <div className="form-field">
              <label>CNPJ</label>
              <input
                value={formulario.cnpj}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    cnpj: formatarCNPJ(e.target.value),
                  })
                }
                required
              />
            </div>
          ) : (
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
          )}
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
          <div className="form-field">
            <label>CEP</label>
            <input
              value={cep}
              onChange={(e) => setCep(formatarCEP(e.target.value))}
              onBlur={(e) => handleBuscarCep(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
            />
            {buscandoCep && (
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Buscando endereço...
              </span>
            )}
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
          {formulario.tipo_pessoa === "fisica" && (
            <>
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
            </>
          )}
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
            {clienteEditando?.documento_identidade_enviado && !documentoIdentidade && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginBottom: 8, alignSelf: "flex-start" }}
                onClick={() =>
                  abrirDocumentoIdentidadeCliente(clienteEditando.id).catch((error) =>
                    setErro(error.message)
                  )
                }
              >
                Ver documento atual
              </button>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setDocumentoIdentidade(e.target.files?.[0] || null)}
            />
          </div>
          <label className="campo-marcar full">
            <input
              type="checkbox"
              checked={formulario.consentimento_lgpd}
              onChange={(e) =>
                setFormulario({ ...formulario, consentimento_lgpd: e.target.checked })
              }
            />
            <span>
              <strong>O cliente autorizou o tratamento dos dados pessoais</strong>
              <small>
                {clienteEditando?.consentimento_lgpd_em
                  ? `Consentimento registrado em ${new Date(
                      clienteEditando.consentimento_lgpd_em
                    ).toLocaleDateString("pt-BR")}.`
                  : "LGPD, art. 7º, I — a data do aceite fica registrada ao salvar."}
              </small>
            </span>
          </label>
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
          <div className="form-field" style={{ marginBottom: 12 }}>
            <input
              type="search"
              placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Nome</th>
                <th>Documento</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && <LinhasCarregando colunas={6} />}
              {!carregando &&
                clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td><Avatar src={cliente.foto} nome={cliente.nome} /></td>
                    <td>{cliente.nome}</td>
                    <td>{cliente.tipo_pessoa === "juridica" ? cliente.cnpj : cliente.cpf}</td>
                    <td>{cliente.email}</td>
                    <td>
                      <span
                        className={`badge ${
                          cliente.ativo ? "badge-success" : "badge-muted"
                        }`}
                      >
                        {cliente.ativo ? "Ativo" : "Inativo"}
                      </span>
                      {cliente.anonimizado_em && (
                        <span className="badge badge-muted" style={{ marginLeft: 6 }}>
                          Anonimizado
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {pode("clientes", "editar") && (
                          <button
                            type="button"
                            className="row-action"
                            title={t("acao_editar")}
                            aria-label={t("acao_editar")}
                            onClick={() => handleIniciarEdicao(cliente)}
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        {cliente.telefone && (
                          <button
                            type="button"
                            className="row-action"
                            title={t("acao_enviar_whatsapp")}
                            aria-label={t("acao_enviar_whatsapp")}
                            onClick={() =>
                              abrirWhatsApp(cliente.telefone, montarMensagemCliente(cliente))
                            }
                          >
                            <MessageCircle size={15} />
                          </button>
                        )}
                        {pode("clientes", "editar") && (
                          <button
                            type="button"
                            className="row-action"
                            title={cliente.ativo ? t("acao_inativar") : t("acao_ativar")}
                            aria-label={cliente.ativo ? t("acao_inativar") : t("acao_ativar")}
                            onClick={async () => {
                              await updateCliente(cliente.id, {
                                ativo: !cliente.ativo,
                              });
                              carregarClientes();
                              refreshDashboard().catch(() => {});
                            }}
                          >
                            {cliente.ativo ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                        )}
                        {pode("clientes", "excluir") && !cliente.anonimizado_em && (
                          <button
                            type="button"
                            className="row-action"
                            title="Exportar dados do titular (LGPD)"
                            aria-label="Exportar dados do titular (LGPD)"
                            onClick={() =>
                              exportarDadosDoCliente(cliente.id).catch((error) =>
                                avisar(error.message, "erro")
                              )
                            }
                          >
                            <Download size={15} />
                          </button>
                        )}
                        {pode("clientes", "excluir") && !cliente.anonimizado_em && (
                          <button
                            type="button"
                            className="row-action row-action-danger"
                            title="Anonimizar dados (LGPD)"
                            aria-label="Anonimizar dados (LGPD)"
                            onClick={async () => {
                              const ok = await confirmar({
                                titulo: "Anonimizar cliente",
                                mensagem: `Os dados pessoais de ${cliente.nome} serão apagados de forma definitiva (nome, documentos, contato, endereço, foto). Os processos continuam no sistema, sem identificar a pessoa. Não dá para desfazer.`,
                                acao: "Anonimizar",
                              });
                              if (!ok) return;
                              try {
                                await anonimizarCliente(cliente.id);
                                avisar("Dados do cliente anonimizados.");
                                carregarClientes();
                                refreshDashboard().catch(() => {});
                              } catch (error) {
                                avisar(error.message, "erro");
                              }
                            }}
                          >
                            <EyeOff size={15} />
                          </button>
                        )}
                        {pode("clientes", "excluir") && (
                          <button
                            type="button"
                            className="row-action row-action-danger"
                            title={t("acao_excluir")}
                            aria-label={t("acao_excluir")}
                            onClick={async () => {
                              const ok = await confirmar({
                                titulo: "Excluir cliente",
                                mensagem: `${cliente.nome} será excluído. Se houver processos dele, o sistema recusa e sugere inativar.`,
                              });
                              if (!ok) return;
                              setErro("");
                              try {
                                await deleteCliente(cliente.id);
                                avisar("Cliente excluído.");
                                carregarClientes();
                                refreshDashboard().catch(() => {});
                              } catch (error) {
                                // O back-end recusa excluir cliente com
                                // processos, para não levar o histórico do
                                // caso junto. Sem este tratamento, o clique
                                // simplesmente não fazia nada.
                                setErro(error.message);
                              }
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <RodapeLista
            quantidade={clientes.length}
            total={lista.total}
            temMais={lista.temMais}
            carregandoMais={lista.carregandoMais}
            onCarregarMais={lista.carregarMais}
          />
        </div>
      )}
    </OverlayPanel>
  );
}