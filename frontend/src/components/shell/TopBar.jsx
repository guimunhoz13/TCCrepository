"use client";

import { Moon, Sun, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { getUsuarioLogado, logout } from "@/services/api";

export default function TopBar({ title, subtitle }) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const usuario = getUsuarioLogado();

  function handleLogout() {
    logout();
    router.replace("/");
  }

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar-actions">
        <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          {usuario?.nome}
        </span>

        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="icon-btn" onClick={handleLogout} aria-label="Sair">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
