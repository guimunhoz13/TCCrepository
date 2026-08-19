"use client";

import { Moon, Sun, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { getUsuarioLogado, logout } from "@/services/api";
import { getSaudacaoCompleta } from "@/utils/greeting";
import { useEffect, useState } from "react";

export default function TopBar({
  title,
  subtitle,
  showGreeting = false,
}) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // O usuário não deve ser carregado durante a renderização inicial,
  // pois getUsuarioLogado() utiliza dados do navegador/localStorage.
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioLogado = getUsuarioLogado();

    if (usuarioLogado) {
      setUsuario(usuarioLogado);
    }
  }, []);

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
      <div className="topbar-title">
        {showGreeting && (
          <div className="greeting-badge">
            {usuario?.tipo_usuario === "admin"
              ? "Administrador"
              : "Advogado"}
          </div>
        )}

        <h2>{displayTitle}</h2>

        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar-actions">
        <span
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
          }}
        >
          {usuario?.nome || ""}
        </span>

        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Alternar tema"
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
          aria-label="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}