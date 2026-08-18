"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";
import { login, verificarEmail } from "@/services/api";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [advogadoInfo, setAdvogadoInfo] = useState(null);
  const [verificandoEmail, setVerificandoEmail] = useState(false);

  useEffect(() => {
    const msg = sessionStorage.getItem("sucessoCadastro");
    if (msg) {
      setMensagem(msg);
      sessionStorage.removeItem("sucessoCadastro");
    }
  }, []);

  const checarEmail = useCallback(async (valorEmail) => {
    const emailLimpo = valorEmail.trim();
    if (!emailLimpo || !emailLimpo.includes("@")) {
      setAdvogadoInfo(null);
      return;
    }

    try {
      setVerificandoEmail(true);
      const data = await verificarEmail(emailLimpo);
      if (data.existe && data.tipo_usuario === "advogado") {
        setAdvogadoInfo(data);
      } else {
        setAdvogadoInfo(null);
      }
    } catch {
      setAdvogadoInfo(null);
    } finally {
      setVerificandoEmail(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checarEmail(email);
    }, 500);
    return () => clearTimeout(timer);
  }, [email, checarEmail]);

  async function executarLogin() {
    setErro("");
    setMensagem("");

    try {
      setCarregando(true);
      const data = await login(email.trim(), senha);

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));

      router.push("/dashboard");
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    await executarLogin();
  }

  async function handleLoginAdvogado() {
    await executarLogin();
  }

  return (
    <form onSubmit={handleLogin}>
      <h2>Entrar</h2>
      <p className="subtitle">Acesse o ERP do seu escritório de advocacia</p>

      {mensagem && <div className="alert alert-success">{mensagem}</div>}
      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="form-field" style={{ marginBottom: 16 }}>
        <label>E-mail</label>
        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {advogadoInfo && (
        <div className="lawyer-login-card">
          <p>
            <strong>{advogadoInfo.nome}</strong> — advogado em{" "}
            <strong>{advogadoInfo.escritorio_nome}</strong>
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={handleLoginAdvogado}
            disabled={carregando || !senha}
          >
            <Scale size={16} />
            {carregando
              ? "Entrando..."
              : `Entrar como advogado — ${advogadoInfo.nome.split(" ")[0]}`}
          </button>
          {!senha && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 8 }}>
              Informe sua senha abaixo para acessar.
            </p>
          )}
        </div>
      )}

      {verificandoEmail && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12 }}>
          Verificando e-mail...
        </p>
      )}

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

      <button
        className="btn btn-primary"
        style={{ width: "100%" }}
        disabled={carregando}
      >
        {carregando ? "Entrando..." : "Entrar no sistema"}
      </button>

      <div className="auth-footer">
        Ainda não tem escritório cadastrado?{" "}
        <Link href="/cadastro">Criar conta</Link>
      </div>
    </form>
  );
}
