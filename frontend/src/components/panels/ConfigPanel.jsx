"use client";

import { useEffect, useState } from "react";
import {
  X, User, Building2, Bell, Palette, Database, CreditCard,
  Eye, EyeOff, Trash2, Download, FileBarChart, Mail, MessageCircle,
} from "lucide-react";
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
  normalizarLista,
  logout,
} from "@/services/api";
import { gerarHtmlRelatorioCliente, gerarHtmlRelatorioProcesso, abrirRelatorio } from "@/utils/relatorio";
import { abrirWhatsApp, montarMensagemCliente, montarMensagemProcesso } from "@/utils/whatsapp";
import Avatar from "@/components/ui/Avatar";

const TABS = [
  { id: "conta", tKey: "config_conta", icon: User },
  { id: "escritorio", tKey: "config_escritorio", icon: Building2 },
  { id: "notificacoes", tKey: "config_notificacoes", icon: Bell },
  { id: "aparencia", tKey: "config_aparencia", icon: Palette },
  { id: "dados", tKey: "config_dados", icon: Database },
  { id: "relatorios", tKey: "config_relatorios", icon: FileBarChart },
  { id: "faturamento", tKey: "config_faturamento", icon: CreditCard },
];

const PREF_DEFAULT = {
  tema: "dark",
  densidade_tabela: "comfortable",
  idioma: "pt-BR",
  pagina_inicial: "dashboard",
  notificacao_novo_processo: true,
  notificacao_novo_documento: true,
  notificacao_status_processo: false,
  notificacao_novo_cliente: false,
  lembrete_audiencia: true,
  antecedencia_audiencia: 2,
  lembrete_prazo: true,
  resumo_semanal: false,
};

export default function ConfigPanel() {
  const { activePanel, closePanel } = usePanel();
  const { theme, setTheme } = useTheme();
  const { t, atualizarPreferencias } = usePreferences();
  const [activeTab, setActiveTab] = useState("conta");
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    if (activePanel !== PANELS.CONFIG) return;
    let ativo = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCarregando(true);
    setErro("");
    getConfiguracoes()
      .then((res) => {
        if (!ativo) return;
        setDados(res);
        if (res?.preferencias?.tema && res.preferencias.tema !== theme) {
          setTheme(res.preferencias.tema);
        }
      })
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, [activePanel]); // eslint-disable-line react-hooks/exhaustive-deps

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
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? "active" : ""}`} onClick={() => { setActiveTab(tab.id); setErro(""); setSucesso(""); }}>
                <span className="tab-label"><Icon size={15} />{t(tab.tKey)}</span>
              </button>
            );
          })}
        </div>

        <div className="overlay-body">
          {erro && <div className="alert alert-error">{erro}</div>}
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
            <DadosTab dados={dados} setDados={setDados} feedback={feedback} />
          )}
          {!carregando && dados && activeTab === "relatorios" && (
            <RelatoriosTab feedback={feedback} t={t} />
          )}
          {!carregando && activeTab === "faturamento" && <FaturamentoTab />}
        </div>
      </div>
    </div>
  );
}

function ContaTab({ usuario, setDados, feedback, t }) {
  const [form, setForm] = useState({ nome: usuario.nome || "", email: usuario.email || "", telefone: usuario.telefone || "" });
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
      localStorage.setItem("usuarioLogado", JSON.stringify({ ...atual, nome: res.usuario.nome, email: res.usuario.email, foto: res.usuario.foto }));
      feedback(res.detail);
    } catch (e) { feedback(e.message, true); }
    finally { setSalvando(false); }
  }

  async function salvarSenha() {
    try {
      setSalvando(true);
      const res = await alterarSenha(senha);
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
        <Field label="Telefone"><input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" /></Field>
        <Field label="Cargo"><input value={usuario.tipo_usuario === "admin" ? "Administrador" : "Advogado"} disabled /></Field>
      </div>
      <Actions><button className="btn btn-primary btn-sm" onClick={salvarConta} disabled={salvando}>Salvar alterações</button></Actions>
    </Section>

    <Section title="Senha" description="A nova senha deve ter pelo menos 8 caracteres.">
      <div className="form-grid">
        <Field label="Senha atual" full><div className="password-field"><input type={showPassword ? "text" : "password"} value={senha.senha_atual} onChange={(e) => setSenha({ ...senha, senha_atual: e.target.value })} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></Field>
        <Field label="Nova senha"><input type={showPassword ? "text" : "password"} value={senha.nova_senha} onChange={(e) => setSenha({ ...senha, nova_senha: e.target.value })} /></Field>
        <Field label="Confirmar nova senha"><input type={showPassword ? "text" : "password"} value={senha.confirmar_senha} onChange={(e) => setSenha({ ...senha, confirmar_senha: e.target.value })} /></Field>
      </div>
      <Actions><button className="btn btn-secondary btn-sm" onClick={salvarSenha} disabled={salvando}>Alterar senha</button></Actions>
    </Section>
  </div>;
}

function EscritorioTab({ dados, setDados, feedback }) {
  const admin = dados.usuario.tipo_usuario === "admin";
  const cfg = dados.configuracao_escritorio || {};
  const [form, setForm] = useState({ ...dados.escritorio, timezone: cfg.timezone || "America/Sao_Paulo", formato_data: cfg.formato_data || "dmy" });

  async function salvar() {
    try {
      const res = await updateEscritorio(form);
      setDados((d) => ({ ...d, escritorio: res.escritorio, configuracao_escritorio: res.configuracao_escritorio }));
      const atual = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
      localStorage.setItem("usuarioLogado", JSON.stringify({ ...atual, escritorio_nome: res.escritorio.nome }));
      feedback(res.detail);
    } catch (e) { feedback(e.message, true); }
  }

  return <div className="settings-stack">
    <Section title="Dados do escritório" description={admin ? "Somente administradores podem alterar estes dados." : "Visualização dos dados do escritório."}>
      <div className="form-grid">
        <Field label="Nome do escritório"><input value={form.nome || ""} disabled={!admin} onChange={(e) => setForm({ ...form, nome: e.target.value })}/></Field>
        <Field label="CNPJ"><input value={form.cnpj || ""} disabled /></Field>
        <Field label="E-mail"><input value={form.email || ""} disabled={!admin} onChange={(e) => setForm({ ...form, email: e.target.value })}/></Field>
        <Field label="Telefone"><input value={form.telefone || ""} disabled={!admin} onChange={(e) => setForm({ ...form, telefone: e.target.value })}/></Field>
        <Field label="Endereço" full><input value={form.endereco || ""} disabled={!admin} onChange={(e) => setForm({ ...form, endereco: e.target.value })}/></Field>
        <Field label="Cidade"><input value={form.cidade || ""} disabled={!admin} onChange={(e) => setForm({ ...form, cidade: e.target.value })}/></Field>
        <Field label="Estado"><input maxLength={2} value={form.estado || ""} disabled={!admin} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}/></Field>
        <Field label="Fuso horário"><select value={form.timezone} disabled={!admin} onChange={(e) => setForm({ ...form, timezone: e.target.value })}><option value="America/Sao_Paulo">Brasília (GMT-3)</option><option value="America/Manaus">Manaus (GMT-4)</option><option value="America/Noronha">Fernando de Noronha (GMT-2)</option></select></Field>
        <Field label="Formato de data"><select value={form.formato_data} disabled={!admin} onChange={(e) => setForm({ ...form, formato_data: e.target.value })}><option value="dmy">31/08/2026</option><option value="mdy">08/31/2026</option><option value="iso">2026-08-31</option></select></Field>
      </div>
      {admin && <Actions><button className="btn btn-primary btn-sm" onClick={salvar}>Salvar alterações</button></Actions>}
    </Section>

    <Section title="Equipe" description="Usuários atualmente cadastrados neste escritório.">
      <div className="member-list">{dados.membros.map((m) => <div key={m.id} className="member-row"><Avatar src={m.foto} nome={m.nome} size={34} /><div className="member-info"><strong>{m.nome}</strong><span>{m.email}</span></div><span className="badge badge-muted">{m.tipo_usuario === "admin" ? "Administrador" : "Advogado"}</span></div>)}</div>
    </Section>
  </div>;
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
      <ToggleRow label="Novo cliente cadastrado" checked={p.notificacao_novo_cliente} onChange={(v) => salvar({ notificacao_novo_cliente: v })}/>
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
    <Section title={t("aparencia_densidade")}><Field><select value={p.densidade_tabela} onChange={(e) => salvar("densidade_tabela", e.target.value)}><option value="comfortable">{t("aparencia_confortavel")}</option><option value="compact">{t("aparencia_compacta")}</option></select></Field></Section>
    <Section title={t("aparencia_idioma")}><Field><select value={p.idioma} onChange={(e) => salvar("idioma", e.target.value)}><option value="pt-BR">Português (Brasil)</option><option value="en-US">English (US)</option><option value="es-ES">Español</option></select></Field></Section>
    <Section title={t("aparencia_pagina_inicial")}><Field><select value={p.pagina_inicial} onChange={(e) => salvar("pagina_inicial", e.target.value)}><option value="dashboard">{t("nav_dashboard")}</option><option value="agenda">{t("nav_agenda")}</option><option value="clientes">{t("nav_clientes")}</option><option value="processos">{t("nav_processos")}</option></select></Field></Section>
  </div>;
}

function DadosTab({ dados, setDados, feedback }) {
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
    if (!window.confirm("Isto desativará o escritório e todos os usuários. Deseja continuar?")) return;
    try { const res = await desativarEscritorio({ senha, confirmacao }); feedback(res.detail); logout(); window.location.href = "/"; }
    catch (e) { feedback(e.message, true); }
  }

  return <div className="settings-stack">
    <Section title="Exportar dados" description="Baixe os dados do escritório em CSV."><div className="export-row"><button className="btn btn-secondary btn-sm" onClick={() => exportarClientesCSV().catch((e) => feedback(e.message, true))}><Download size={14}/>Exportar clientes (CSV)</button><button className="btn btn-secondary btn-sm" onClick={() => exportarProcessosCSV().catch((e) => feedback(e.message, true))}><Download size={14}/>Exportar processos (CSV)</button></div></Section>
    <Section title="Retenção de documentos" description="Preferência administrativa do escritório."><Field><select value={retencao} disabled={!admin} onChange={(e) => salvarRetencao(e.target.value)}><option value="1y">1 ano</option><option value="5y">5 anos</option><option value="indeterminado">Por tempo indeterminado</option></select></Field></Section>
    {admin && <Section title="Zona de risco" description="Esta ação desativa o escritório e impede novos logins." danger><div className="form-grid"><Field label="Senha do administrador"><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}/></Field><Field label='Digite EXCLUIR para confirmar'><input value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)}/></Field></div><Actions><button className="btn btn-danger btn-sm" onClick={excluir} disabled={!senha || confirmacao !== "EXCLUIR"}><Trash2 size={14}/>Desativar escritório</button></Actions></Section>}
  </div>;
}

function RelatoriosTab({ feedback, t }) {
  const [tipo, setTipo] = useState("cliente");
  const [clientes, setClientes] = useState([]);
  const [processos, setProcessos] = useState([]);
  const [selecionado, setSelecionado] = useState("");
  const [carregandoListas, setCarregandoListas] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [emailDestino, setEmailDestino] = useState("");
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [telefoneDestino, setTelefoneDestino] = useState("");

  useEffect(() => {
    let ativo = true;
    Promise.all([getClientes(), getProcessos()])
      .then(([dadosClientes, dadosProcessos]) => {
        if (!ativo) return;
        setClientes(normalizarLista(dadosClientes));
        setProcessos(normalizarLista(dadosProcessos));
      })
      .catch((e) => ativo && feedback(e.message, true))
      .finally(() => ativo && setCarregandoListas(false));
    return () => { ativo = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setSelecionado(""); }, [tipo]);

  const opcoes = tipo === "cliente" ? clientes : processos;

  useEffect(() => {
    if (!selecionado) { setEmailDestino(""); setTelefoneDestino(""); return; }
    const item = opcoes.find((o) => String(o.id) === String(selecionado));
    if (tipo === "cliente") {
      setEmailDestino(item?.email || "");
      setTelefoneDestino(item?.telefone || "");
    } else {
      setEmailDestino(item?.cliente_email || "");
      const clienteDoProcesso = clientes.find((c) => c.id === item?.cliente);
      setTelefoneDestino(clienteDoProcesso?.telefone || "");
    }
  }, [selecionado, tipo]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="cliente">{t("relatorios_cliente")}</option>
            <option value="processo">{t("relatorios_processo")}</option>
          </select>
        </Field>
        <Field label={tipo === "cliente" ? t("relatorios_cliente") : t("relatorios_processo")}>
          <select
            value={selecionado}
            onChange={(e) => setSelecionado(e.target.value)}
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

function FaturamentoTab() {
  return <div className="settings-stack"><Section title="Faturamento"><div className="empty-state">A área de planos já é visual. A cobrança real ainda não está conectada a um gateway de pagamento.</div></Section></div>;
}

function Section({ title, description, children, danger }) { return <div className={`settings-section ${danger ? "danger" : ""}`}><div className="settings-section-header"><h4>{title}</h4>{description && <p>{description}</p>}</div><div className="settings-section-body">{children}</div></div>; }
function Field({ label, children, full }) { return <div className={`form-field ${full ? "full" : ""}`}>{label && <label>{label}</label>}{children}</div>; }
function Actions({ children }) { return <div className="settings-section-actions">{children}</div>; }
function ToggleRow({ label, checked, onChange }) { return <label className="toggle-row"><span className="toggle-label">{label}</span><span className="switch"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}/><span className="switch-track" /></span></label>; }
