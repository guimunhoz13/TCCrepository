"use client";

import { useEffect, useState } from "react";
import { useRecurso } from "@/hooks/useRecurso";
import { useConfirmacao } from "@/contexts/ConfirmacaoContext";
import {
  X, User, Building2, Bell, Palette, Database, CreditCard,
  Eye, EyeOff, Trash2, Download, FileBarChart, Mail, MessageCircle, History,
  ShieldCheck, UserPlus,
} from "lucide-react";
import { usePermissoes } from "@/hooks/usePermissoes";
import { usePanel, PANELS } from "@/contexts/PanelContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import {
  getConfiguracoes,
  updateConta,
  alterarSenha,
  updatePreferencias,
  updateEscritorio,
  desativarEscritorio,
  exportarClientesCSV,
  exportarProcessosCSV,
  getClientes,
  getProcessos,
  getRelatorioCliente,
  getRelatorioProcesso,
  enviarRelatorioClientePorEmail,
  enviarRelatorioProcessoPorEmail,
  getAuditoria,
  normalizarLista,
  listarTudo,
  salvarUsuarioLogado,
  logout,
  configurarDoisFatores,
  registrarMembro,
  definirPerfilDoUsuario,
  redefinirDoisFatoresDoUsuario,
} from "@/services/api";
import { gerarHtmlRelatorioCliente, gerarHtmlRelatorioProcesso, abrirRelatorio } from "@/utils/relatorio";
import { abrirWhatsApp, montarMensagemCliente, montarMensagemProcesso } from "@/utils/whatsapp";
import { formatarCEP, formatarCNPJ, formatarTelefone } from "@/utils/mascaras";
import { buscarEnderecoPorCep } from "@/utils/cep";
import { senhaAtendeRequisitos } from "@/utils/senha";
import RequisitosSenha from "@/components/ui/RequisitosSenha";
import Avatar from "@/components/ui/Avatar";

const TABS = [
  { id: "conta", tKey: "config_conta", icon: User },
  { id: "escritorio", tKey: "config_escritorio", icon: Building2 },
  { id: "notificacoes", tKey: "config_notificacoes", icon: Bell },
  { id: "aparencia", tKey: "config_aparencia", icon: Palette },
  { id: "dados", tKey: "config_dados", icon: Database },
  { id: "relatorios", tKey: "config_relatorios", icon: FileBarChart, area: "relatorios" },
  { id: "auditoria", tKey: "config_auditoria", icon: History, adminOnly: true },
  { id: "faturamento", tKey: "config_faturamento", icon: CreditCard },
];

// Perfis que o administrador pode atribuir. Advogado entra pelo painel de
// Advogados, que pede a OAB; aqui a troca de perfil aceita qualquer um.
const PERFIS = [
  { value: "admin", label: "Administrador" },
  { value: "advogado", label: "Advogado" },
  { value: "estagiario", label: "Estagiário" },
  { value: "financeiro", label: "Financeiro" },
  { value: "secretaria", label: "Secretária" },
];
const PERFIS_SEM_OAB = PERFIS.filter((perfil) => perfil.value !== "advogado");

const DESCRICAO_PERFIL = {
  admin: "Tudo, inclusive equipe, auditoria e dados do escritório.",
  advogado: "Clientes, processos, agenda, documentos, financeiro e IA.",
  estagiario: "Apoia nos processos e na agenda; não exclui nada e não vê o financeiro.",
  financeiro: "Contratos, cobranças e despesas; o resto só consulta.",
  secretaria: "Atendimento, clientes e agenda; não vê o financeiro nem a IA.",
};

const PREF_DEFAULT = {
  tema: "dark",
  densidade_tabela: "comfortable",
  idioma: "pt-BR",
  pagina_inicial: "dashboard",
  notificacao_novo_processo: true,
  notificacao_novo_documento: true,
  notificacao_status_processo: false,
  notificacao_movimentacao: true,
  notificacao_novo_cliente: false,
  notificacao_tarefa_atribuida: true,
  lembrete_audiencia: true,
  antecedencia_audiencia: 2,
  lembrete_prazo: true,
  resumo_semanal: false,
};

export default function ConfigPanel() {
  const { activePanel, closePanel } = usePanel();
  const { theme, setTheme } = useTheme();
  const { t, atualizarPreferencias } = usePreferences();
  const pode = usePermissoes();
  const [activeTab, setActiveTab] = useState("conta");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const recurso = useRecurso(getConfiguracoes, [], { ativo: activePanel === PANELS.CONFIG });
  const carregando = recurso.carregando;
  // As abas editam partes dos dados (perfil, escritório, preferências) e
  // atualizam a tela sem recarregar tudo: a edição local vale enquanto for
  // sobre a mesma resposta da API que a originou.
  const [local, setLocal] = useState({ base: undefined, valor: null });
  const dados =
    local.base !== undefined && local.base === recurso.dados ? local.valor : recurso.dados ?? null;
  function setDados(atualizar) {
    setLocal({
      base: recurso.dados,
      valor: typeof atualizar === "function" ? atualizar(dados) : atualizar,
    });
  }

  // O tema salvo na conta vale sobre o do navegador: aplica quando a
  // configuração chega da API.
  const respostaConfig = recurso.dados;
  useEffect(() => {
    const temaSalvo = respostaConfig?.preferencias?.tema;
    if (temaSalvo && temaSalvo !== theme) setTheme(temaSalvo);
  }, [respostaConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  function feedback(msg, isError = false) {
    if (isError) { setErro(msg); setSucesso(""); }
    else { setSucesso(msg); setErro(""); }
  }

  if (activePanel !== PANELS.CONFIG) return null;

  return (
    <div className="overlay-backdrop" onClick={closePanel}>
      <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="overlay-header">
          <h3>Configurações</h3>
          <button className="icon-btn" onClick={closePanel} aria-label="Fechar"><X size={18} /></button>
        </div>

        <div className="overlay-tabs">
          {TABS.filter((tab) => (!tab.adminOnly || dados?.usuario?.tipo_usuario === "admin") && (!tab.area || pode(tab.area))).map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? "active" : ""}`} onClick={() => { setActiveTab(tab.id); setErro(""); setSucesso(""); }}>
                <span className="tab-label"><Icon size={15} />{t(tab.tKey)}</span>
              </button>
            );
          })}
        </div>

        <div className="overlay-body" tabIndex={0} role="region" aria-label="Conteúdo das configurações">
          {(erro || recurso.erro) && <div className="alert alert-error">{erro || recurso.erro}</div>}
          {sucesso && <div className="alert alert-success">{sucesso}</div>}
          {carregando && <div className="empty-state">Carregando configurações...</div>}

          {!carregando && dados && activeTab === "conta" && (
            <ContaTab usuario={dados.usuario} setDados={setDados} feedback={feedback} t={t} />
          )}
          {!carregando && dados && activeTab === "escritorio" && (
            <EscritorioTab dados={dados} setDados={setDados} feedback={feedback} />
          )}
          {!carregando && dados && activeTab === "notificacoes" && (
            <NotificacoesTab preferencias={dados.preferencias || PREF_DEFAULT} setDados={setDados} feedback={feedback} />
          )}
          {!carregando && dados && activeTab === "aparencia" && (
            <AparenciaTab preferencias={dados.preferencias || PREF_DEFAULT} setDados={setDados} feedback={feedback} theme={theme} setTheme={setTheme} atualizarPreferenciasGlobal={atualizarPreferencias} t={t} />
          )}
          {!carregando && dados && activeTab === "dados" && (
            <DadosTab dados={dados} setDados={setDados} feedback={feedback} podeExportar={pode("exportar")} />
          )}
          {!carregando && dados && activeTab === "relatorios" && pode("relatorios") && (
            <RelatoriosTab feedback={feedback} t={t} />
          )}
          {!carregando && dados && activeTab === "auditoria" && dados.usuario.tipo_usuario === "admin" && (
            <AuditoriaTab />
          )}
          {!carregando && activeTab === "faturamento" && <FaturamentoTab />}
        </div>
      </div>
    </div>
  );
}

function ContaTab({ usuario, setDados, feedback, t }) {
  const [form, setForm] = useState({ nome: usuario.nome || "", email: usuario.email || "", telefone: usuario.telefone ? formatarTelefone(usuario.telefone) : "" });
  const [foto, setFoto] = useState(null);
  const [senha, setSenha] = useState({ senha_atual: "", nova_senha: "", confirmar_senha: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function salvarConta() {
    try {
      setSalvando(true);
      const payload = new FormData();
      payload.append("nome", form.nome);
      payload.append("email", form.email);
      payload.append("telefone", form.telefone);
      if (foto) payload.append("foto", foto);

      const res = await updateConta(payload);
      setDados((d) => ({ ...d, usuario: res.usuario }));
      setFoto(null);
      const atual = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
      salvarUsuarioLogado({ ...atual, nome: res.usuario.nome, email: res.usuario.email, foto: res.usuario.foto });
      feedback(res.detail);
    } catch (e) { feedback(e.message, true); }
    finally { setSalvando(false); }
  }

  async function salvarSenha() {
    if (!senhaAtendeRequisitos(senha.nova_senha)) {
      feedback("A nova senha não atende a todos os requisitos obrigatórios.", true);
      return;
    }
    try {
      setSalvando(true);
      const res = await alterarSenha(senha);
      // A troca de senha invalida qualquer token emitido antes dela —
      // inclusive o desta aba. O backend devolve um par novo para não
      // derrubar quem acabou de trocar a própria senha.
      if (res.access) localStorage.setItem("access", res.access);
      if (res.refresh) localStorage.setItem("refresh", res.refresh);
      setSenha({ senha_atual: "", nova_senha: "", confirmar_senha: "" });
      feedback(res.detail);
    } catch (e) { feedback(e.message, true); }
    finally { setSalvando(false); }
  }

  return <div className="settings-stack">
    <Section title={t("perfil_foto")} description={t("perfil_foto_desc")}>
      <div className="avatar-cell">
        <Avatar src={foto ? URL.createObjectURL(foto) : usuario.foto} nome={usuario.nome} size={56} />
        <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
          {t("perfil_escolher_foto")}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => setFoto(e.target.files?.[0] || null)}
          />
        </label>
      </div>
    </Section>

    <Section title="Dados pessoais" description="Atualize seus dados de acesso e contato.">
      <div className="form-grid">
        <Field label="Nome"><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
        <Field label="E-mail"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Telefone"><input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })} placeholder="(00) 00000-0000" /></Field>
        <Field label="Perfil de acesso"><input value={usuario.tipo_usuario_display || usuario.tipo_usuario} disabled /></Field>
      </div>
      <Actions><button className="btn btn-primary btn-sm" onClick={salvarConta} disabled={salvando}>Salvar alterações</button></Actions>
    </Section>

    <Section title="Senha" description="A nova senha deve ter pelo menos 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial.">
      <div className="form-grid">
        <Field label="Senha atual" full><div className="password-field"><input type={showPassword ? "text" : "password"} value={senha.senha_atual} onChange={(e) => setSenha({ ...senha, senha_atual: e.target.value })} /><button type="button" className="password-toggle" aria-label={showPassword ? "Ocultar senhas" : "Mostrar senhas"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></Field>
        <Field label="Nova senha">
          <input type={showPassword ? "text" : "password"} value={senha.nova_senha} onChange={(e) => setSenha({ ...senha, nova_senha: e.target.value })} />
          <RequisitosSenha senha={senha.nova_senha} />
        </Field>
        <Field label="Confirmar nova senha"><input type={showPassword ? "text" : "password"} value={senha.confirmar_senha} onChange={(e) => setSenha({ ...senha, confirmar_senha: e.target.value })} /></Field>
      </div>
      <Actions><button className="btn btn-secondary btn-sm" onClick={salvarSenha} disabled={salvando || !senhaAtendeRequisitos(senha.nova_senha)}>Alterar senha</button></Actions>
    </Section>

    <DoisFatoresSection usuario={usuario} setDados={setDados} feedback={feedback} />
  </div>;
}

/**
 * Verificação em duas etapas (TOTP): o QR code vai para o aplicativo
 * autenticador e, a partir daí, o login pede o código de 6 dígitos além
 * da senha. Para desligar, pede senha e código — quem pegou a sessão
 * aberta não consegue tirar a proteção.
 */
function DoisFatoresSection({ usuario, setDados, feedback }) {
  const [cadastro, setCadastro] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const ativo = Boolean(usuario.totp_ativo);

  async function executar(acao, dados) {
    try {
      setEnviando(true);
      return await configurarDoisFatores(acao, dados);
    } catch (e) {
      feedback(e.message, true);
      return null;
    } finally {
      setEnviando(false);
    }
  }

  async function iniciar() {
    const res = await executar("iniciar");
    if (res) { setCadastro(res); setCodigo(""); }
  }

  async function ativar(evento) {
    evento.preventDefault();
    const res = await executar("ativar", { codigo: codigo.replace(/\D/g, "") });
    if (!res) return;
    setCadastro(null);
    setCodigo("");
    setDados((d) => ({ ...d, usuario: { ...d.usuario, totp_ativo: true } }));
    feedback("Verificação em duas etapas ativada. No próximo login o código será pedido.");
  }

  async function desativar(evento) {
    evento.preventDefault();
    const res = await executar("desativar", { senha, codigo: codigo.replace(/\D/g, "") });
    if (!res) return;
    setSenha("");
    setCodigo("");
    setDados((d) => ({ ...d, usuario: { ...d.usuario, totp_ativo: false } }));
    feedback("Verificação em duas etapas desativada.");
  }

  return (
    <Section
      title="Verificação em duas etapas"
      description="Além da senha, o login pede um código do aplicativo autenticador do celular. Quem descobrir sua senha não entra sem ele."
    >
      {ativo && (
        <form onSubmit={desativar}>
          <p className="status-2fa"><ShieldCheck size={16} /> Ativa nesta conta.</p>
          <div className="form-grid">
            <Field label="Senha atual"><input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></Field>
            <Field label="Código do aplicativo"><input inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={codigo} onChange={(e) => setCodigo(e.target.value)} required /></Field>
          </div>
          <Actions><button className="btn btn-danger btn-sm" disabled={enviando}>Desativar</button></Actions>
        </form>
      )}

      {!ativo && !cadastro && (
        <Actions><button className="btn btn-primary btn-sm" onClick={iniciar} disabled={enviando}><ShieldCheck size={14} />Ativar verificação em duas etapas</button></Actions>
      )}

      {!ativo && cadastro && (
        <form onSubmit={ativar}>
          <div className="qr-2fa">
            <img src={cadastro.qr_code} alt="QR code para cadastrar o LexOffice no aplicativo autenticador" />
            <div>
              <p>1. Abra o Google Authenticator, Authy ou Microsoft Authenticator e leia o QR code.</p>
              <p>Sem câmera? Digite esta chave no aplicativo:</p>
              <code>{cadastro.segredo}</code>
              <p style={{ marginTop: 12 }}>2. Digite abaixo o código de 6 dígitos que apareceu.</p>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Código do aplicativo"><input className="campo-codigo" inputMode="numeric" autoComplete="one-time-code" maxLength={7} placeholder="000000" value={codigo} onChange={(e) => setCodigo(e.target.value)} required autoFocus /></Field>
          </div>
          <Actions>
            <button className="btn btn-primary btn-sm" disabled={enviando}>Confirmar e ativar</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCadastro(null)} disabled={enviando}>Cancelar</button>
          </Actions>
        </form>
      )}
    </Section>
  );
}

function EscritorioTab({ dados, setDados, feedback }) {
  const admin = dados.usuario.tipo_usuario === "admin";
  const cfg = dados.configuracao_escritorio || {};
  const [form, setForm] = useState({
    ...dados.escritorio,
    telefone: dados.escritorio.telefone ? formatarTelefone(dados.escritorio.telefone) : "",
    timezone: cfg.timezone || "America/Sao_Paulo",
    formato_data: cfg.formato_data || "dmy",
  });
  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);

  async function handleBuscarCep(valor) {
    if ((valor || "").replace(/\D/g, "").length !== 8) return;

    try {
      setBuscandoCep(true);
      const endereco = await buscarEnderecoPorCep(valor);
      if (!endereco) return;

      setForm((atual) => ({
        ...atual,
        endereco: [endereco.logradouro, endereco.bairro].filter(Boolean).join(", "),
        cidade: endereco.cidade || atual.cidade,
        estado: endereco.estado || atual.estado,
      }));
    } finally {
      setBuscandoCep(false);
    }
  }

  async function salvar() {
    try {
      const res = await updateEscritorio(form);
      setDados((d) => ({ ...d, escritorio: res.escritorio, configuracao_escritorio: res.configuracao_escritorio }));
      const atual = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
      salvarUsuarioLogado({ ...atual, escritorio_nome: res.escritorio.nome });
      feedback(res.detail);
    } catch (e) { feedback(e.message, true); }
  }

  return <div className="settings-stack">
    <Section title="Dados do escritório" description={admin ? "Somente administradores podem alterar estes dados." : "Visualização dos dados do escritório."}>
      <div className="form-grid">
        <Field label="Nome do escritório"><input value={form.nome || ""} disabled={!admin} onChange={(e) => setForm({ ...form, nome: e.target.value })}/></Field>
        <Field label="CNPJ"><input value={form.cnpj ? formatarCNPJ(form.cnpj) : ""} disabled /></Field>
        <Field label="E-mail"><input value={form.email || ""} disabled={!admin} onChange={(e) => setForm({ ...form, email: e.target.value })}/></Field>
        <Field label="Telefone"><input value={form.telefone || ""} disabled={!admin} onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })}/></Field>
        {admin && (
          <Field label="CEP">
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
          </Field>
        )}
        <Field label="Endereço" full><input value={form.endereco || ""} disabled={!admin} onChange={(e) => setForm({ ...form, endereco: e.target.value })}/></Field>
        <Field label="Cidade"><input value={form.cidade || ""} disabled={!admin} onChange={(e) => setForm({ ...form, cidade: e.target.value })}/></Field>
        <Field label="Estado"><input maxLength={2} value={form.estado || ""} disabled={!admin} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}/></Field>
        <Field label="Fuso horário"><select value={form.timezone} disabled={!admin} onChange={(e) => setForm({ ...form, timezone: e.target.value })}><option value="America/Sao_Paulo">Brasília (GMT-3)</option><option value="America/Manaus">Manaus (GMT-4)</option><option value="America/Noronha">Fernando de Noronha (GMT-2)</option></select></Field>
        <Field label="Formato de data"><select value={form.formato_data} disabled={!admin} onChange={(e) => setForm({ ...form, formato_data: e.target.value })}><option value="dmy">31/08/2026</option><option value="mdy">08/31/2026</option><option value="iso">2026-08-31</option></select></Field>
      </div>
      {admin && <Actions><button className="btn btn-primary btn-sm" onClick={salvar}>Salvar alterações</button></Actions>}
    </Section>

    {admin && <PixSection dados={dados} setDados={setDados} feedback={feedback} />}

    <EquipeSection dados={dados} setDados={setDados} feedback={feedback} admin={admin} />
  </div>;
}

const TIPOS_CHAVE_PIX = [
  { value: "cpf_cnpj", label: "CPF ou CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Celular" },
  { value: "aleatoria", label: "Chave aleatória" },
];

/** Chave PIX do escritório: com ela, cada parcela de contrato ganha QR code. */
function PixSection({ dados, setDados, feedback }) {
  const cfg = dados.configuracao_escritorio || {};
  const [pix, setPix] = useState({
    tipo_chave_pix: cfg.tipo_chave_pix || "",
    chave_pix: cfg.chave_pix || "",
    nome_recebedor_pix: cfg.nome_recebedor_pix || "",
    cidade_pix: cfg.cidade_pix || dados.escritorio.cidade || "",
  });
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    try {
      setSalvando(true);
      const res = await updateEscritorio(pix);
      setDados((d) => ({ ...d, configuracao_escritorio: res.configuracao_escritorio }));
      setPix((atual) => ({ ...atual, chave_pix: res.configuracao_escritorio.chave_pix }));
      feedback("Dados do PIX salvos. As parcelas dos contratos já podem ser cobradas com QR code.");
    } catch (e) { feedback(e.message, true); }
    finally { setSalvando(false); }
  }

  return (
    <Section title="Recebimento por PIX" description="Com a chave cadastrada, cada parcela de contrato ganha QR code e PIX copia e cola com o valor certo, para mandar ao cliente.">
      <div className="form-grid">
        <Field label="Tipo da chave">
          <select value={pix.tipo_chave_pix} onChange={(e) => setPix({ ...pix, tipo_chave_pix: e.target.value })}>
            <option value="">Selecione</option>
            {TIPOS_CHAVE_PIX.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
          </select>
        </Field>
        <Field label="Chave PIX"><input value={pix.chave_pix} maxLength={77} onChange={(e) => setPix({ ...pix, chave_pix: e.target.value })} /></Field>
        <Field label="Nome do recebedor (até 25 letras)"><input value={pix.nome_recebedor_pix} maxLength={25} placeholder={dados.escritorio.nome.slice(0, 25)} onChange={(e) => setPix({ ...pix, nome_recebedor_pix: e.target.value })} /></Field>
        <Field label="Cidade (até 15 letras)"><input value={pix.cidade_pix} maxLength={15} onChange={(e) => setPix({ ...pix, cidade_pix: e.target.value })} /></Field>
      </div>
      <Actions><button className="btn btn-primary btn-sm" onClick={salvar} disabled={salvando}>Salvar PIX</button></Actions>
    </Section>
  );
}

/**
 * Equipe e perfis de acesso. O administrador inclui estagiário, financeiro,
 * secretária ou outro administrador (advogado entra pelo painel de
 * Advogados, com a OAB), troca o perfil de quem já está na equipe e
 * desliga a verificação em duas etapas de quem perdeu o celular.
 */
function EquipeSection({ dados, setDados, feedback, admin }) {
  const confirmar = useConfirmacao();
  const novoMembro = { nome: "", email: "", telefone: "", senha: "", tipo_usuario: "estagiario" };
  const [form, setForm] = useState(novoMembro);
  const [incluindo, setIncluindo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function trocarMembro(atualizado) {
    setDados((d) => ({
      ...d,
      membros: d.membros.map((m) => (m.id === atualizado.id ? { ...m, ...atualizado } : m)),
    }));
  }

  async function mudarPerfil(membro, tipo_usuario) {
    const rotulo = PERFIS.find((p) => p.value === tipo_usuario)?.label;
    const ok = await confirmar({
      titulo: "Mudar perfil de acesso",
      mensagem: `${membro.nome} passa a ser ${rotulo}: ${DESCRICAO_PERFIL[tipo_usuario]}`,
      acao: "Mudar perfil",
      perigo: false,
    });
    if (!ok) return;
    try {
      trocarMembro(await definirPerfilDoUsuario(membro.id, tipo_usuario));
      feedback(`Perfil de ${membro.nome} alterado para ${rotulo}.`);
    } catch (e) { feedback(e.message, true); }
  }

  async function redefinir2fa(membro) {
    const ok = await confirmar({
      titulo: "Redefinir verificação em duas etapas",
      mensagem: `${membro.nome} volta a entrar só com a senha e pode configurar o aplicativo de novo. Use quando a pessoa perdeu ou trocou de celular.`,
      acao: "Redefinir",
    });
    if (!ok) return;
    try {
      trocarMembro(await redefinirDoisFatoresDoUsuario(membro.id));
      feedback(`Verificação em duas etapas de ${membro.nome} redefinida.`);
    } catch (e) { feedback(e.message, true); }
  }

  async function incluir(evento) {
    evento.preventDefault();
    if (!senhaAtendeRequisitos(form.senha)) {
      feedback("A senha inicial não atende a todos os requisitos obrigatórios.", true);
      return;
    }
    try {
      setSalvando(true);
      const membro = await registrarMembro(form);
      setDados((d) => ({
        ...d,
        membros: [...d.membros, membro].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
      }));
      setForm(novoMembro);
      setIncluindo(false);
      feedback(`${membro.nome} incluído na equipe. Envie o e-mail e a senha inicial para essa pessoa entrar.`);
    } catch (e) { feedback(e.message, true); }
    finally { setSalvando(false); }
  }

  return (
    <Section
      title="Equipe e perfis de acesso"
      description={admin ? "Cada perfil enxerga e altera só a sua parte do escritório. A API aplica as mesmas regras." : "Pessoas que trabalham neste escritório."}
    >
      <div className="member-list">
        {dados.membros.map((m) => (
          <div key={m.id} className="member-row">
            <Avatar src={m.foto} nome={m.nome} size={34} />
            <div className="member-info">
              <strong>{m.nome}{!m.ativo && " (inativo)"}</strong>
              <span>{m.email}</span>
            </div>
            {m.totp_ativo && (
              <span className="badge badge-success" title="Verificação em duas etapas ativa"><ShieldCheck size={12} /> 2 etapas</span>
            )}
            {admin && m.id !== dados.usuario.id ? (
              <>
                <select
                  className="member-role-select"
                  aria-label={`Perfil de acesso de ${m.nome}`}
                  value={m.tipo_usuario}
                  onChange={(e) => mudarPerfil(m, e.target.value)}
                >
                  {PERFIS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                {m.totp_ativo && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => redefinir2fa(m)}>
                    Redefinir 2 etapas
                  </button>
                )}
              </>
            ) : (
              <span className="badge badge-muted">{m.tipo_usuario_display || m.tipo_usuario}</span>
            )}
          </div>
        ))}
      </div>

      {admin && !incluindo && (
        <Actions>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIncluindo(true)}>
            <UserPlus size={14} />Incluir membro da equipe
          </button>
        </Actions>
      )}

      {admin && incluindo && (
        <form onSubmit={incluir} style={{ marginTop: 16 }}>
          <div className="form-grid">
            <Field label="Nome"><input required maxLength={255} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
            <Field label="E-mail"><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Telefone (opcional)"><input value={form.telefone} placeholder="(00) 00000-0000" onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })} /></Field>
            <Field label="Perfil de acesso">
              <select value={form.tipo_usuario} onChange={(e) => setForm({ ...form, tipo_usuario: e.target.value })}>
                {PERFIS_SEM_OAB.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <span className="dica-campo">{DESCRICAO_PERFIL[form.tipo_usuario]}</span>
            </Field>
            <Field label="Senha inicial" full>
              <input type="password" autoComplete="new-password" required value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
              <RequisitosSenha senha={form.senha} />
            </Field>
          </div>
          <Actions>
            <button className="btn btn-primary btn-sm" disabled={salvando || !senhaAtendeRequisitos(form.senha)}>{salvando ? "Incluindo..." : "Incluir na equipe"}</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setIncluindo(false); setForm(novoMembro); }} disabled={salvando}>Cancelar</button>
          </Actions>
          <p className="dica-campo">Advogados entram pelo painel Advogados, que pede o número da OAB.</p>
        </form>
      )}
    </Section>
  );
}

function NotificacoesTab({ preferencias, setDados, feedback }) {
  const [p, setP] = useState({ ...PREF_DEFAULT, ...preferencias });
  async function salvar(novos) {
    const next = { ...p, ...novos }; setP(next);
    try { const res = await updatePreferencias(novos); setDados((d) => ({ ...d, preferencias: res.preferencias })); feedback("Preferências de notificação salvas."); }
    catch (e) { feedback(e.message, true); }
  }
  return <div className="settings-stack">
    <Section title="E-mail" description="Escolha os avisos que deseja receber.">
      <ToggleRow label="Novo processo cadastrado" checked={p.notificacao_novo_processo} onChange={(v) => salvar({ notificacao_novo_processo: v })}/>
      <ToggleRow label="Novo documento anexado" checked={p.notificacao_novo_documento} onChange={(v) => salvar({ notificacao_novo_documento: v })}/>
      <ToggleRow label="Alteração de status em processo" checked={p.notificacao_status_processo} onChange={(v) => salvar({ notificacao_status_processo: v })}/>
      <ToggleRow label="Andamento novo encontrado no tribunal" checked={p.notificacao_movimentacao} onChange={(v) => salvar({ notificacao_movimentacao: v })}/>
      <ToggleRow label="Novo cliente cadastrado" checked={p.notificacao_novo_cliente} onChange={(v) => salvar({ notificacao_novo_cliente: v })}/>
      <ToggleRow label="Tarefa atribuída a mim" checked={p.notificacao_tarefa_atribuida} onChange={(v) => salvar({ notificacao_tarefa_atribuida: v })}/>
    </Section>
    <Section title="Prazos e audiências">
      <ToggleRow label="Lembrete de audiência" checked={p.lembrete_audiencia} onChange={(v) => salvar({ lembrete_audiencia: v })}/>
      <Field label="Antecedência"><select value={p.antecedencia_audiencia} onChange={(e) => salvar({ antecedencia_audiencia: Number(e.target.value) })}><option value="1">1 dia antes</option><option value="2">2 dias antes</option><option value="5">5 dias antes</option><option value="7">7 dias antes</option></select></Field>
      <ToggleRow label="Lembrete de prazo processual" checked={p.lembrete_prazo} onChange={(v) => salvar({ lembrete_prazo: v })}/>
      <ToggleRow label="Resumo semanal por e-mail" checked={p.resumo_semanal} onChange={(v) => salvar({ resumo_semanal: v })}/>
    </Section>
  </div>;
}

function AparenciaTab({ preferencias, setDados, feedback, theme, setTheme, atualizarPreferenciasGlobal, t }) {
  const [p, setP] = useState({ ...PREF_DEFAULT, ...preferencias });
  async function salvar(campo, valor) {
    const next = { ...p, [campo]: valor }; setP(next);
    if (campo === "tema") setTheme(valor);
    try {
      const res = await atualizarPreferenciasGlobal({ [campo]: valor });
      setDados((d) => ({ ...d, preferencias: res.preferencias }));
      feedback("Preferência salva — aplicada imediatamente em todo o sistema.");
    } catch (e) { feedback(e.message, true); }
  }
  return <div className="settings-stack">
    <Section title={t("aparencia_tema")}><div className="theme-toggle"><button className={`btn btn-sm ${theme === "light" ? "btn-primary" : "btn-secondary"}`} onClick={() => salvar("tema", "light")}>{t("aparencia_claro")}</button><button className={`btn btn-sm ${theme === "dark" ? "btn-primary" : "btn-secondary"}`} onClick={() => salvar("tema", "dark")}>{t("aparencia_escuro")}</button></div></Section>
    <Section title={t("aparencia_densidade")}><Field><select aria-label={t("aparencia_densidade")} value={p.densidade_tabela} onChange={(e) => salvar("densidade_tabela", e.target.value)}><option value="comfortable">{t("aparencia_confortavel")}</option><option value="compact">{t("aparencia_compacta")}</option></select></Field></Section>
    <Section title={t("aparencia_idioma")}><Field><select aria-label={t("aparencia_idioma")} value={p.idioma} onChange={(e) => salvar("idioma", e.target.value)}><option value="pt-BR">Português (Brasil)</option><option value="en-US">English (US)</option><option value="es-ES">Español</option></select></Field></Section>
    <Section title={t("aparencia_pagina_inicial")}><Field><select aria-label={t("aparencia_pagina_inicial")} value={p.pagina_inicial} onChange={(e) => salvar("pagina_inicial", e.target.value)}><option value="dashboard">{t("nav_dashboard")}</option><option value="agenda">{t("nav_agenda")}</option><option value="clientes">{t("nav_clientes")}</option><option value="processos">{t("nav_processos")}</option></select></Field></Section>
  </div>;
}

function DadosTab({ dados, setDados, feedback, podeExportar }) {
  const confirmar = useConfirmacao();
  const admin = dados.usuario.tipo_usuario === "admin";
  const [retencao, setRetencao] = useState(dados.configuracao_escritorio?.retencao_documentos || "indeterminado");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");

  async function salvarRetencao(v) {
    setRetencao(v);
    try { const res = await updateEscritorio({ retencao_documentos: v }); setDados((d) => ({ ...d, configuracao_escritorio: res.configuracao_escritorio })); feedback("Retenção de documentos atualizada."); }
    catch (e) { feedback(e.message, true); }
  }
  async function excluir() {
    const ok = await confirmar({
      titulo: "Desativar escritório",
      mensagem: "O escritório e todos os usuários serão desativados e ninguém mais conseguirá entrar. Só o suporte reativa.",
      acao: "Desativar",
    });
    if (!ok) return;
    try { const res = await desativarEscritorio({ senha, confirmacao }); feedback(res.detail); logout(); window.location.href = "/"; }
    catch (e) { feedback(e.message, true); }
  }

  return <div className="settings-stack">
    {podeExportar && <Section title="Exportar dados" description="Baixe os dados do escritório em CSV."><div className="export-row"><button className="btn btn-secondary btn-sm" onClick={() => exportarClientesCSV().catch((e) => feedback(e.message, true))}><Download size={14}/>Exportar clientes (CSV)</button><button className="btn btn-secondary btn-sm" onClick={() => exportarProcessosCSV().catch((e) => feedback(e.message, true))}><Download size={14}/>Exportar processos (CSV)</button></div></Section>}
    <Section title="Retenção de documentos" description="Preferência administrativa do escritório."><Field><select aria-label="Tempo de retenção de documentos" value={retencao} disabled={!admin} onChange={(e) => salvarRetencao(e.target.value)}><option value="1y">1 ano</option><option value="5y">5 anos</option><option value="indeterminado">Por tempo indeterminado</option></select></Field></Section>
    {admin && <Section title="Zona de risco" description="Esta ação desativa o escritório e impede novos logins." danger><div className="form-grid"><Field label="Senha do administrador"><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}/></Field><Field label='Digite EXCLUIR para confirmar'><input value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)}/></Field></div><Actions><button className="btn btn-danger btn-sm" onClick={excluir} disabled={!senha || confirmacao !== "EXCLUIR"}><Trash2 size={14}/>Desativar escritório</button></Actions></Section>}
  </div>;
}

function RelatoriosTab({ feedback, t }) {
  const [tipo, setTipo] = useState("cliente");
  const [selecionado, setSelecionado] = useState("");
  const [gerando, setGerando] = useState(false);
  const [emailDestino, setEmailDestino] = useState("");
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [telefoneDestino, setTelefoneDestino] = useState("");

  const listas = useRecurso(() => Promise.all([listarTudo(getClientes), listarTudo(getProcessos)]));
  const [clientes, processos] = listas.dados ?? [[], []];
  const carregandoListas = listas.carregando;

  const opcoes = tipo === "cliente" ? clientes : processos;

  function escolherTipo(novoTipo) {
    setTipo(novoTipo);
    escolher("");
  }

  // Ao escolher o cliente/processo, já sugere o e-mail e o telefone dele
  // como destino do relatório.
  function escolher(id) {
    setSelecionado(id);
    if (!id) { setEmailDestino(""); setTelefoneDestino(""); return; }
    const item = opcoes.find((o) => String(o.id) === String(id));
    if (tipo === "cliente") {
      setEmailDestino(item?.email || "");
      setTelefoneDestino(item?.telefone || "");
    } else {
      setEmailDestino(item?.cliente_email || "");
      const clienteDoProcesso = clientes.find((c) => c.id === item?.cliente);
      setTelefoneDestino(clienteDoProcesso?.telefone || "");
    }
  }

  async function gerar() {
    if (!selecionado) {
      feedback(`Selecione um ${tipo === "cliente" ? "cliente" : "processo"} para gerar o relatório.`, true);
      return;
    }
    try {
      setGerando(true);
      if (tipo === "cliente") {
        const relatorio = await getRelatorioCliente(selecionado);
        abrirRelatorio(gerarHtmlRelatorioCliente(relatorio));
      } else {
        const relatorio = await getRelatorioProcesso(selecionado);
        abrirRelatorio(gerarHtmlRelatorioProcesso(relatorio));
      }
      feedback("Relatório gerado em uma nova aba. Use \"Imprimir / Salvar como PDF\" para exportá-lo.");
    } catch (e) {
      feedback(e.message, true);
    } finally {
      setGerando(false);
    }
  }

  async function enviarEmail() {
    if (!selecionado) {
      feedback(`Selecione um ${tipo === "cliente" ? "cliente" : "processo"} para enviar o relatório.`, true);
      return;
    }
    if (!emailDestino) {
      feedback("Informe o e-mail de destino.", true);
      return;
    }
    try {
      setEnviandoEmail(true);
      const res = tipo === "cliente"
        ? await enviarRelatorioClientePorEmail(selecionado, emailDestino)
        : await enviarRelatorioProcessoPorEmail(selecionado, emailDestino);
      feedback(res.detail);
    } catch (e) {
      feedback(e.message, true);
    } finally {
      setEnviandoEmail(false);
    }
  }

  function enviarWhatsApp() {
    if (!selecionado) {
      feedback(`Selecione um ${tipo === "cliente" ? "cliente" : "processo"} para enviar pelo WhatsApp.`, true);
      return;
    }
    if (!telefoneDestino) {
      feedback("Informe o telefone de destino.", true);
      return;
    }
    const item = opcoes.find((o) => String(o.id) === String(selecionado));
    const mensagem = tipo === "cliente" ? montarMensagemCliente(item) : montarMensagemProcesso(item);
    const aberto = abrirWhatsApp(telefoneDestino, mensagem);
    if (aberto) {
      feedback("WhatsApp aberto em uma nova aba com a mensagem pronta para enviar.");
    } else {
      feedback("Telefone inválido.", true);
    }
  }

  return <div className="settings-stack">
    <Section title={t("relatorios_gerar_titulo")} description={t("relatorios_gerar_desc")}>
      <div className="form-grid">
        <Field label={t("relatorios_tipo")}>
          <select value={tipo} onChange={(e) => escolherTipo(e.target.value)}>
            <option value="cliente">{t("relatorios_cliente")}</option>
            <option value="processo">{t("relatorios_processo")}</option>
          </select>
        </Field>
        <Field label={tipo === "cliente" ? t("relatorios_cliente") : t("relatorios_processo")}>
          <select
            value={selecionado}
            onChange={(e) => escolher(e.target.value)}
            disabled={carregandoListas || opcoes.length === 0}
          >
            <option value="">{carregandoListas ? t("carregando") : t("relatorios_selecione")}</option>
            {opcoes.map((item) => (
              <option key={item.id} value={item.id}>
                {tipo === "cliente" ? item.nome : `${item.numero_processo} — ${item.titulo}`}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {listas.erro && <div className="alert alert-error">{listas.erro}</div>}
      {!carregandoListas && opcoes.length === 0 && (
        <div className="empty-state">{t("nenhum_registro")}</div>
      )}
      <Actions>
        <button className="btn btn-primary btn-sm" onClick={gerar} disabled={gerando || !selecionado}>
          <FileBarChart size={14} />
          {gerando ? t("acao_gerando") : t("acao_gerar_relatorio")}
        </button>
      </Actions>
    </Section>

    <Section title={t("relatorios_email_titulo")} description={t("relatorios_email_desc")}>
      <div className="form-grid">
        <Field label={t("relatorios_email_label")} full>
          <input
            type="email"
            value={emailDestino}
            onChange={(e) => setEmailDestino(e.target.value)}
            placeholder="cliente@exemplo.com"
          />
        </Field>
      </div>
      <Actions>
        <button className="btn btn-secondary btn-sm" onClick={enviarEmail} disabled={enviandoEmail || !selecionado}>
          <Mail size={14} />
          {enviandoEmail ? t("acao_salvando") : t("acao_enviar_email")}
        </button>
      </Actions>
    </Section>

    <Section title={t("relatorios_whatsapp_titulo")} description={t("relatorios_whatsapp_desc")}>
      <div className="form-grid">
        <Field label={t("relatorios_whatsapp_label")} full>
          <input
            value={telefoneDestino}
            onChange={(e) => setTelefoneDestino(e.target.value)}
            placeholder="(00) 00000-0000"
          />
        </Field>
      </div>
      <Actions>
        <button className="btn btn-secondary btn-sm" onClick={enviarWhatsApp} disabled={!selecionado}>
          <MessageCircle size={14} />
          {t("acao_enviar_whatsapp")}
        </button>
      </Actions>
    </Section>
  </div>;
}

const ACOES_LABEL = {
  login_sucesso: "Login realizado",
  login_falha: "Tentativa de login falhou",
  login_bloqueado: "Login bloqueado",
  criacao: "Registro criado",
  edicao: "Registro editado",
  exclusao: "Registro excluído",
  exportacao: "Dados exportados",
};

const ACOES_BADGE = {
  login_sucesso: "badge-success",
  login_falha: "badge-warning",
  login_bloqueado: "badge-danger",
  criacao: "badge-success",
  edicao: "badge-muted",
  exclusao: "badge-danger",
  exportacao: "badge-warning",
};

function AuditoriaTab() {
  const recurso = useRecurso(getAuditoria);
  const registros = normalizarLista(recurso.dados);
  const carregando = recurso.carregando;

  return <div className="settings-stack">
    <Section title="Registro de auditoria" description="Quem entrou no sistema e quem criou, editou ou excluiu registros — os 200 eventos mais recentes deste escritório.">
      {recurso.erro && <div className="alert alert-error">{recurso.erro}</div>}
      {carregando && <div className="empty-state">Carregando registros...</div>}
      {!carregando && registros.length === 0 && <div className="empty-state">Nenhum evento de auditoria registrado ainda.</div>}
      {!carregando && registros.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data/hora</th>
                <th>Ação</th>
                <th>Usuário</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.criado_em).toLocaleString("pt-BR")}</td>
                  <td><span className={`badge ${ACOES_BADGE[r.acao] || "badge-muted"}`}>{ACOES_LABEL[r.acao] || r.acao_label}</span></td>
                  <td>{r.usuario_nome || r.superadmin_nome || "—"}</td>
                  <td>{r.descricao || (r.modelo ? `${r.modelo} #${r.objeto_id ?? ""}` : "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  </div>;
}

function FaturamentoTab() {
  return <div className="settings-stack"><Section title="Faturamento"><div className="empty-state">A área de planos já é visual. A cobrança real ainda não está conectada a um gateway de pagamento.</div></Section></div>;
}

function Section({ title, description, children, danger }) { return <div className={`settings-section ${danger ? "danger" : ""}`}><div className="settings-section-header"><h4>{title}</h4>{description && <p>{description}</p>}</div><div className="settings-section-body">{children}</div></div>; }
function Field({ label, children, full }) { return <div className={`form-field ${full ? "full" : ""}`}>{label && <label>{label}</label>}{children}</div>; }
function Actions({ children }) { return <div className="settings-section-actions">{children}</div>; }
function ToggleRow({ label, checked, onChange }) { return <label className="toggle-row"><span className="toggle-label">{label}</span><span className="switch"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}/><span className="switch-track" /></span></label>; }
