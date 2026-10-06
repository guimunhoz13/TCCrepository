"use client";

import { Moon, Sun, LogOut, HelpCircle, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import Avatar from "@/components/ui/Avatar";
import GlobalSearch from "@/components/shell/GlobalSearch";
import NotificationBell from "@/components/shell/NotificationBell";
import { logout } from "@/services/api";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import { getSaudacaoCompleta } from "@/utils/greeting";
import { useAjuda } from "@/contexts/AjudaContext";
import { useMenuMovel } from "@/contexts/MenuMovelContext";

export default function TopBar({
  title,
  subtitle,
  showGreeting = false,
  comBusca = false,
  onSelectSearchResult,
  notificacoes,
  onSelectNotificacao,
}) {
  const { theme, toggleTheme } = useTheme();
  const { abrirAjuda } = useAjuda();
  const menuMovel = useMenuMovel();
  const { t } = usePreferences();
  const router = useRouter();

  const usuario = useUsuarioLogado();

  const displayTitle =
    showGreeting && usuario?.nome
      ? getSaudacaoCompleta(usuario.nome)
      : title;

  function handleLogout() {
    logout();
    router.replace("/");
  }

  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn menu-movel-btn"
        onClick={menuMovel.abrir}
        aria-label="Abrir o menu"
        aria-expanded={menuMovel.aberto}
        aria-controls="menu-principal"
      >
        <Menu size={20} />
      </button>

      <div className="topbar-title">
        {showGreeting && (
          <div className="greeting-badge">
            {usuario?.tipo_usuario === "admin"
              ? t("perfil_admin")
              : t("perfil_advogado")}
          </div>
        )}

        <h2>{displayTitle}</h2>

        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar-actions">
        {comBusca && <GlobalSearch onSelect={onSelectSearchResult} />}

        {notificacoes && (
          <NotificationBell eventos={notificacoes} onSelect={onSelectNotificacao} />
        )}

        <span className="topbar-user">
          <span className="topbar-user-nome">{usuario?.nome || ""}</span>
          {usuario && <Avatar src={usuario.foto} nome={usuario.nome} size={30} />}
        </span>

        <button
          type="button"
          className="icon-btn"
          onClick={() => abrirAjuda()}
          aria-label="Abrir a central de ajuda"
          title="Como o sistema funciona"
        >
          <HelpCircle size={18} />
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={t("acao_alternar_tema")}
        >
          {theme === "dark" ? (
            <Sun size={18} />
          ) : (
            <Moon size={18} />
          )}
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={handleLogout}
          aria-label={t("acao_sair")}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}