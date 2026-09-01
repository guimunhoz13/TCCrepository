"use client";

import { useState } from "react";
import {
  X,
  User,
  Building2,
  Bell,
  Palette,
  Database,
  CreditCard,
  Eye,
  EyeOff,
  Trash2,
  Download,
  LogOut,
  ShieldCheck,
} from "lucide-react"; // npm install lucide-react, se ainda não tiver
import { usePanel, PANELS } from "@/contexts/PanelContext";

// -----------------------------------------------------------------------
// MOCK DE DADOS — troque pelos seus hooks reais.
// Ex: const { user } = useAuth();  /  const { office } = useOffice();
// Mantive o formato igual ao que já aparece no seu Dashboard/print.
// -----------------------------------------------------------------------
const MOCK_USER = {
  name: "guilhermao",
  email: "gui@gmail.com",
  role: "admin",
  twoFactorEnabled: false,
};

const MOCK_OFFICE = {
  name: "DevsAdvogados",
  cnpj: "00.000.000/0001-00",
  address: "",
  timezone: "America/Sao_Paulo",
};

const MOCK_MEMBERS = [
  { id: 1, name: "guilhermao", email: "gui@gmail.com", role: "Administrador" },
  { id: 2, name: "Ana Ribeiro", email: "ana@devsadvogados.com", role: "Advogada" },
  { id: 3, name: "Marcos Lima", email: "marcos@devsadvogados.com", role: "Assistente" },
];

const MOCK_PLAN = {
  name: "Profissional",
  price: "R$ 199/mês",
  seatsUsed: 3,
  seatsLimit: 5,
  renewsAt: "15 de setembro de 2026",
};

const TABS = [
  { id: "conta", label: "Conta", icon: User },
  { id: "escritorio", label: "Escritório", icon: Building2 },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "aparencia", label: "Aparência", icon: Palette },
  { id: "dados", label: "Dados", icon: Database },
  { id: "faturamento", label: "Faturamento", icon: CreditCard },
];

export default function ConfigPanel({
  user = MOCK_USER,
  office = MOCK_OFFICE,
  members = MOCK_MEMBERS,
  plan = MOCK_PLAN,
  theme = "light", // TODO: vem do seu ThemeContext / Providers.jsx
  onThemeChange = () => {}, // TODO: setTheme do seu contexto
}) {
  const { activePanel, closePanel } = usePanel();
  const [activeTab, setActiveTab] = useState("conta");

  // Só renderiza quando este é o painel ativo — mesmo padrão dos outros
  // panels (ClientesPanel, AgendaPanel etc.) que já leem o PanelContext.
  if (activePanel !== PANELS.CONFIG) {
    return null;
  }

  const onClose = closePanel;

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="overlay-header">
          <h3>Configurações</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="overlay-tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-label">
                  <Icon size={15} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overlay-body">
          {activeTab === "conta" && <ContaTab user={user} />}
          {activeTab === "escritorio" && (
            <EscritorioTab office={office} members={members} />
          )}
          {activeTab === "notificacoes" && <NotificacoesTab />}
          {activeTab === "aparencia" && (
            <AparenciaTab theme={theme} onThemeChange={onThemeChange} />
          )}
          {activeTab === "dados" && <DadosTab />}
          {activeTab === "faturamento" && <FaturamentoTab plan={plan} />}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// CONTA
// =========================================================================
function ContaTab({ user }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="settings-stack">
      <Section
        title="Dados pessoais"
        description="Essas informações aparecem para os outros membros do escritório."
      >
        <div className="form-grid">
          <div className="form-field">
            <label>Nome</label>
            <input type="text" defaultValue={user.name} />
          </div>
          <div className="form-field">
            <label>E-mail</label>
            <input type="email" defaultValue={user.email} />
          </div>
          <div className="form-field">
            <label>Telefone</label>
            <input type="tel" placeholder="(00) 00000-0000" />
          </div>
          <div className="form-field">
            <label>Cargo</label>
            <input type="text" defaultValue={user.role} disabled />
          </div>
        </div>
        <div className="settings-section-actions">
          <button className="btn btn-primary btn-sm">Salvar alterações</button>
        </div>
      </Section>

      <Section
        title="Senha"
        description="Recomendamos usar uma senha com pelo menos 8 caracteres."
      >
        <div className="form-grid">
          <div className="form-field full">
            <label>Senha atual</label>
            <div className="password-field">
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-field">
            <label>Nova senha</label>
            <input type={showPassword ? "text" : "password"} placeholder="••••••••" />
          </div>
          <div className="form-field">
            <label>Confirmar nova senha</label>
            <input type={showPassword ? "text" : "password"} placeholder="••••••••" />
          </div>
        </div>
        <div className="settings-section-actions">
          <button className="btn btn-secondary btn-sm">Alterar senha</button>
        </div>
      </Section>

      <Section
        title="Autenticação de dois fatores"
        description="Adiciona uma etapa extra de segurança ao fazer login."
      >
        <ToggleRow
          icon={<ShieldCheck size={17} />}
          label="Exigir código do app autenticador ao entrar"
          defaultChecked={user.twoFactorEnabled}
        />
      </Section>

      <Section
        title="Sessões ativas"
        description="Encerre o acesso em dispositivos que você não reconhece."
      >
        <div className="session-row">
          <div>
            <strong>Este dispositivo</strong>
            <span>Chrome · São Paulo, BR · agora</span>
          </div>
          <span className="badge badge-success">Ativo</span>
        </div>
        <div className="settings-section-actions">
          <button className="btn btn-secondary btn-sm">
            <LogOut size={14} />
            Sair de todos os outros dispositivos
          </button>
        </div>
      </Section>
    </div>
  );
}

// =========================================================================
// ESCRITÓRIO
// =========================================================================
function EscritorioTab({ office, members }) {
  return (
    <div className="settings-stack">
      <Section title="Dados do escritório" description="Usados em documentos e no cabeçalho do sistema.">
        <div className="form-grid">
          <div className="form-field">
            <label>Nome do escritório</label>
            <input type="text" defaultValue={office.name} />
          </div>
          <div className="form-field">
            <label>CNPJ</label>
            <input type="text" defaultValue={office.cnpj} />
          </div>
          <div className="form-field full">
            <label>Endereço</label>
            <input type="text" placeholder="Rua, número, cidade — UF" defaultValue={office.address} />
          </div>
          <div className="form-field">
            <label>Fuso horário</label>
            <select defaultValue={office.timezone}>
              <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
              <option value="America/Manaus">Manaus (GMT-4)</option>
              <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
            </select>
          </div>
          <div className="form-field">
            <label>Formato de data</label>
            <select defaultValue="dmy">
              <option value="dmy">31/08/2026</option>
              <option value="mdy">08/31/2026</option>
              <option value="iso">2026-08-31</option>
            </select>
          </div>
        </div>
        <div className="settings-section-actions">
          <button className="btn btn-primary btn-sm">Salvar alterações</button>
        </div>
      </Section>

      <Section
        title="Equipe"
        description="Convide advogados e assistentes para o escritório."
      >
        <div className="member-list">
          {members.map((member) => (
            <div key={member.id} className="member-row">
              <div className="member-avatar">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="member-info">
                <strong>{member.name}</strong>
                <span>{member.email}</span>
              </div>
              <select className="member-role-select" defaultValue={member.role}>
                <option>Administrador</option>
                <option>Advogado</option>
                <option>Advogada</option>
                <option>Assistente</option>
              </select>
              <button className="icon-btn" aria-label={`Remover ${member.name}`}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <div className="settings-section-actions">
          <input
            type="email"
            placeholder="email@escritorio.com"
            className="invite-input"
          />
          <button className="btn btn-primary btn-sm">Convidar</button>
        </div>
      </Section>
    </div>
  );
}

// =========================================================================
// NOTIFICAÇÕES
// =========================================================================
function NotificacoesTab() {
  return (
    <div className="settings-stack">
      <Section title="E-mail" description="Escolha o que você quer receber por e-mail.">
        <ToggleRow label="Novo processo cadastrado" defaultChecked />
        <ToggleRow label="Novo documento anexado a um processo" defaultChecked />
        <ToggleRow label="Alteração de status em um processo" />
        <ToggleRow label="Novo cliente cadastrado" />
      </Section>

      <Section title="Prazos e audiências" description="Lembretes para não perder compromissos.">
        <ToggleRow label="Lembrete de audiência" defaultChecked />
        <div className="form-field" style={{ maxWidth: 220, marginTop: 4 }}>
          <label>Avisar com quantos dias de antecedência</label>
          <select defaultValue="2">
            <option value="1">1 dia antes</option>
            <option value="2">2 dias antes</option>
            <option value="5">5 dias antes</option>
            <option value="7">7 dias antes</option>
          </select>
        </div>
        <ToggleRow label="Lembrete de prazo processual" defaultChecked />
      </Section>

      <Section title="Resumo" description="Um panorama periódico da atividade do escritório.">
        <ToggleRow label="Resumo semanal por e-mail" />
      </Section>
    </div>
  );
}

// =========================================================================
// APARÊNCIA
// =========================================================================
function AparenciaTab({ theme, onThemeChange }) {
  return (
    <div className="settings-stack">
      <Section title="Tema da interface" description="Escolha entre modo claro ou escuro para a interface.">
        <div className="theme-toggle">
          <button
            className={`btn btn-sm ${theme === "light" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => onThemeChange("light")}
          >
            Claro
          </button>
          <button
            className={`btn btn-sm ${theme === "dark" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => onThemeChange("dark")}
          >
            Escuro
          </button>
        </div>
      </Section>

      <Section title="Densidade das tabelas" description="Controla o espaçamento das linhas em listas e tabelas.">
        <div className="form-field" style={{ maxWidth: 220 }}>
          <select defaultValue="comfortable">
            <option value="comfortable">Confortável</option>
            <option value="compact">Compacta</option>
          </select>
        </div>
      </Section>

      <Section title="Idioma" description="Idioma usado em toda a interface.">
        <div className="form-field" style={{ maxWidth: 220 }}>
          <select defaultValue="pt-BR">
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>
      </Section>

      <Section title="Página inicial" description="Tela exibida logo após o login.">
        <div className="form-field" style={{ maxWidth: 220 }}>
          <select defaultValue="dashboard">
            <option value="dashboard">Dashboard</option>
            <option value="agenda">Agenda</option>
            <option value="clientes">Clientes</option>
            <option value="processos">Processos</option>
          </select>
        </div>
      </Section>
    </div>
  );
}

// =========================================================================
// DADOS
// =========================================================================
function DadosTab() {
  return (
    <div className="settings-stack">
      <Section title="Exportar dados" description="Baixe uma cópia dos dados do seu escritório.">
        <div className="export-row">
          <button className="btn btn-secondary btn-sm">
            <Download size={14} />
            Exportar clientes (CSV)
          </button>
          <button className="btn btn-secondary btn-sm">
            <Download size={14} />
            Exportar processos (CSV)
          </button>
          <button className="btn btn-secondary btn-sm">
            <Download size={14} />
            Exportar tudo (PDF)
          </button>
        </div>
      </Section>

      <Section title="Retenção de documentos" description="Por quanto tempo os documentos ficam armazenados após o arquivamento de um processo.">
        <div className="form-field" style={{ maxWidth: 260 }}>
          <select defaultValue="indeterminado">
            <option value="1y">1 ano</option>
            <option value="5y">5 anos</option>
            <option value="indeterminado">Por tempo indeterminado</option>
          </select>
        </div>
      </Section>

      <Section title="Log de atividades" description="Histórico de alterações feitas por membros da equipe.">
        <div className="activity-log">
          <div className="activity-item">
            <span className="activity-dot" />
            <div className="activity-item-body">
              <span><strong>Ana Ribeiro</strong> atualizou o status do processo nº 0043/2026</span>
              <span>Hoje, 14:32</span>
            </div>
          </div>
          <div className="activity-item">
            <span className="activity-dot" />
            <div className="activity-item-body">
              <span><strong>guilhermao</strong> adicionou um novo cliente</span>
              <span>Ontem, 09:10</span>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Zona de risco" description="Ações permanentes — não podem ser desfeitas." danger>
        <button className="btn btn-danger btn-sm">Excluir conta do escritório</button>
      </Section>
    </div>
  );
}

// =========================================================================
// FATURAMENTO
// =========================================================================
function FaturamentoTab({ plan }) {
  const usagePercent = Math.round((plan.seatsUsed / plan.seatsLimit) * 100);

  return (
    <div className="settings-stack">
      <Section title="Plano atual">
        <div className="plan-summary">
          <div>
            <strong>{plan.name}</strong>
            <span>{plan.price} · renova em {plan.renewsAt}</span>
          </div>
          <button className="btn btn-secondary btn-sm">Ver todos os planos</button>
        </div>

        <div className="usage-block">
          <div className="usage-label">
            <span>Advogados usados</span>
            <span>{plan.seatsUsed} de {plan.seatsLimit}</span>
          </div>
          <div className="usage-bar">
            <div className="usage-bar-fill" style={{ width: `${usagePercent}%` }} />
          </div>
        </div>
      </Section>

      <Section title="Forma de pagamento">
        <div className="payment-row">
          <span>Cartão terminado em 4242</span>
          <button className="btn btn-secondary btn-sm">Trocar cartão</button>
        </div>
      </Section>

      <Section title="Histórico de pagamento">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>01 ago 2026</td>
              <td>R$ 199,00</td>
              <td><span className="badge badge-success">Pago</span></td>
            </tr>
            <tr>
              <td>01 jul 2026</td>
              <td>R$ 199,00</td>
              <td><span className="badge badge-success">Pago</span></td>
            </tr>
          </tbody>
        </table>
      </Section>
    </div>
  );
}

// =========================================================================
// PRIMITIVOS REUTILIZÁVEIS
// =========================================================================
function Section({ title, description, children, danger }) {
  return (
    <div className={`settings-section ${danger ? "danger" : ""}`}>
      <div className="settings-section-header">
        <h4>{title}</h4>
        {description && <p>{description}</p>}
      </div>
      <div className="settings-section-body">{children}</div>
    </div>
  );
}

function ToggleRow({ label, icon, defaultChecked = false }) {
  return (
    <label className="toggle-row">
      <span className="toggle-label">
        {icon}
        {label}
      </span>
      <span className="switch">
        <input type="checkbox" defaultChecked={defaultChecked} />
        <span className="switch-track" />
      </span>
    </label>
  );
}