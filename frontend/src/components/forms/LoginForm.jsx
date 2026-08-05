"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/services/api";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const msg = sessionStorage.getItem("sucessoCadastro");
    if (msg) {
      setMensagem(msg);
      sessionStorage.removeItem("sucessoCadastro");
    }
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
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
        {carregando ? "Entrando..." : "Entrar no sistema"}
      </button>

      <div className="auth-footer">
        Ainda não tem escritório cadastrado?{" "}
        <Link href="/cadastro">Criar conta</Link>
      </div>
    </form>
  );
}
