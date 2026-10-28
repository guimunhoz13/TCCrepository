"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, loginSegundoFator, salvarUsuarioLogado } from "@/services/api";

const assinarNada = () => () => {};

function mensagemErroLogin(error) {
  if (error?.name === "AbortError") {
    return "O servidor demorou para responder. Tente novamente.";
  }
  if (error instanceof TypeError) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }
  return error?.message || "Não foi possível entrar. Tente novamente.";
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [esperaServidor, setEsperaServidor] = useState(false);
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
    setEsperaServidor(false);
    setRecadoDispensado(true);
    sessionStorage.removeItem("sucessoCadastro");
    const controlador = new AbortController();
    const aviso = setTimeout(() => setEsperaServidor(true), 5000);
    const limite = setTimeout(() => controlador.abort(), 90000);

    try {
      setCarregando(true);
      const data = await login(email.trim(), senha, controlador.signal);
      if (data.requer_2fa) {
        setDesafio(data.desafio);
        setSenha("");
        return;
      }
      abrirSessao(data);
    } catch (error) {
      setErro(mensagemErroLogin(error));
    } finally {
      clearTimeout(aviso);
      clearTimeout(limite);
      setEsperaServidor(false);
      setCarregando(false);
    }
  }

  async function handleSegundoFator(event) {
    event.preventDefault();
    setErro("");
    setEsperaServidor(false);
    const controlador = new AbortController();
    const aviso = setTimeout(() => setEsperaServidor(true), 5000);
    const limite = setTimeout(() => controlador.abort(), 90000);
    try {
      setCarregando(true);
      abrirSessao(await loginSegundoFator(desafio, codigo.replace(/\D/g, ""), controlador.signal));
    } catch (error) {
      setErro(mensagemErroLogin(error));
      setCodigo("");
    } finally {
      clearTimeout(aviso);
      clearTimeout(limite);
      setEsperaServidor(false);
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
      <form method="post" onSubmit={handleSegundoFator}>
        <h2>Verificação em duas etapas</h2>
        <p className="subtitle">
          Abra o aplicativo autenticador (Google Authenticator, Authy, Microsoft
          Authenticator…) e digite o código de 6 dígitos do LexNexo.
        </p>

        {erro && <div className="alert alert-error">{erro}</div>}
        {carregando && esperaServidor && (
          <div className="alert alert-warning" role="status">
            O servidor está iniciando. No primeiro acesso, isso pode levar cerca de um minuto.
          </div>
        )}

        <div className="form-field" style={{ marginBottom: 22 }}>
          <label htmlFor="codigo-2fa">Código</label>
          <input
            id="codigo-2fa"
            name="codigo"
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
    <form method="post" onSubmit={handleLogin}>
      <h2>Entrar</h2>
      <p className="subtitle">Acesse o ERP do seu escritório de advocacia</p>

      {mensagem && <div className="alert alert-success">{mensagem}</div>}
      {erro && <div className="alert alert-error">{erro}</div>}
      {carregando && esperaServidor && (
        <div className="alert alert-warning" role="status">
          O servidor está iniciando. No primeiro acesso, isso pode levar cerca de um minuto.
        </div>
      )}

      <div className="form-field" style={{ marginBottom: 16 }}>
        <label>E-mail</label>
        <input
          name="email"
          type="email"
          autoComplete="username"
          aria-describedby="login-email-ajuda"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <small id="login-email-ajuda" className="dica-campo">Use o e-mail cadastrado no LexNexo.</small>
      </div>

      <div className="form-field" style={{ marginBottom: 22 }}>
        <label>Senha</label>
        <input
          name="senha"
          type="password"
          autoComplete="current-password"
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
