"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Moon, Sun } from "lucide-react";
import { masterLogin } from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";

export default function MasterLoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setErro("");

    try {
      setCarregando(true);
      const data = await masterLogin(email.trim(), senha);

      localStorage.setItem("master_access", data.access);
      localStorage.setItem("masterLogado", JSON.stringify(data.superadmin));

      router.push("/master/painel");
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="auth-page auth-page-single">
      <button
        type="button"
        className="icon-btn auth-page-theme-toggle"
        onClick={toggleTheme}
        aria-label="Alternar tema"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <section className="auth-card-wrap">
        <div className="auth-card">
          <form onSubmit={handleLogin}>
            <h2>
              <ShieldCheck size={20} style={{ verticalAlign: "-3px", marginRight: 8 }} />
              Painel mestre
            </h2>
            <p className="subtitle">Acesso restrito ao desenvolvedor do sistema</p>

            {erro && <div className="alert alert-error">{erro}</div>}

            <div className="form-field" style={{ marginBottom: 16 }}>
              <label>E-mail</label>
              <input
                type="email"
                placeholder="dev@lexoffice.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field" style={{ marginBottom: 22 }}>
              <label>Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            <button className="btn btn-primary" style={{ width: "100%" }} disabled={carregando}>
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
