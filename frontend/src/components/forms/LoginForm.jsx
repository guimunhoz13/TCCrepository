"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, loginSegundoFator, salvarUsuarioLogado } from "@/services/api";

const assinarNada = () => () => {};

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  // Contas com verificação em duas etapas recebem um desafio assinado depois
  // da senha; o formulário passa a pedir o código do aplicativo.
  const [desafio, setDesafio] = useState("");
  const [codigo, setCodigo] = useState("");

  // Recado deixado pelo cadastro ("escritório criado, confirme o e-mail").
  // Lido do sessionStorage só no navegador; some depois da primeira
  // tentativa de login.
  const recadoDoCadastro = useSyncExternalStore(
    assinarNada,
    () => sessionStorage.getItem("sucessoCadastro"),
    () => null
  );
  const [recadoDispensado, setRecadoDispensado] = useState(false);
  const mensagem = recadoDispensado ? "" : recadoDoCadastro || "";

  async function handleLogin(event) {
    event.preventDefault();
    setErro("");
    setRecadoDispensado(true);
    sessionStorage.removeItem("sucessoCadastro");

    try {
      setCarregando(true);
      const data = await login(email.trim(), senha);
      if (data.requer_2fa) {
        setDesafio(data.desafio);
        setSenha("");
        return;
      }
      abrirSessao(data);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleSegundoFator(event) {
    event.preventDefault();
    setErro("");
    try {
      setCarregando(true);
      abrirSessao(await loginSegundoFator(desafio, codigo.replace(/\D/g, "")));
    } catch (error) {
      setErro(error.message);
      setCodigo("");
    } finally {
      setCarregando(false);
    }
  }

  function abrirSessao(data) {
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    salvarUsuarioLogado(data.usuario);
    router.push("/dashboard");
  }

  function voltarParaSenha() {
    setDesafio("");
    setCodigo("");
    setErro("");
  }

  if (desafio) {
    return (
      <form onSubmit={handleSegundoFator}>
        <h2>Verificação em duas etapas</h2>
        <p className="subtitle">
          Abra o aplicativo autenticador (Google Authenticator, Authy, Microsoft
          Authenticator…) e digite o código de 6 dígitos do LexOffice.
        </p>

        {erro && <div className="alert alert-error">{erro}</div>}

        <div className="form-field" style={{ marginBottom: 22 }}>
          <label htmlFor="codigo-2fa">Código</label>
          <input
            id="codigo-2fa"
            className="campo-codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            placeholder="000000"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            autoFocus
            required
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          disabled={carregando}
        >
          {carregando ? "Conferindo..." : "Confirmar e entrar"}
        </button>

        <div className="auth-footer">
          <button type="button" className="link-botao" onClick={voltarParaSenha}>
            Voltar e entrar com outra conta
          </button>
        </div>
      </form>
    );
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
        <div style={{ textAlign: "right", marginTop: 6 }}>
          <Link href="/esqueci-senha" style={{ fontSize: "0.82rem" }}>
            Esqueceu sua senha?
          </Link>
        </div>
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
