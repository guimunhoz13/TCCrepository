"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Input from "../ui/Input";
import Button from "../ui/Button";

export default function LoginForm() {
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

    if (!email.trim() || !senha) {
      setErro("Preencha o e-mail e a senha.");
      return;
    }

    try {
      setCarregando(true);

      const response = await fetch(
        "http://127.0.0.1:8000/api/login/",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            senha: senha,
          }),
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const texto = await response.text();

        console.error("Resposta do servidor:", texto);

        throw new Error(
          "O servidor retornou uma resposta inválida."
        );
      }

      if (!response.ok) {
        setErro(
          data?.detail || "E-mail ou senha inválidos."
        );

        return;
      }

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      localStorage.setItem(
        "usuarioLogado",
        JSON.stringify(data.usuario)
      );

      window.location.href = "/dashboard";

    } catch (error) {
      console.error("Erro no login:", error);

      setErro(
        error.message || "Erro ao conectar ao servidor."
      );

    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <h2
        className="mb-2 fw-bold"
        style={{ color: "var(--color-primary)" }}
      >
        Entrar
      </h2>

      <p
        className="mb-4"
        style={{ color: "var(--color-muted)" }}
      >
        Informe suas credenciais para acessar o sistema
      </p>

      {mensagem && (
        <div
          className="alert alert-success"
          role="alert"
          style={{
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          {mensagem}
        </div>
      )}

      {erro && (
        <div
          className="alert alert-danger"
          role="alert"
          style={{
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          {erro}
        </div>
      )}

      <Input
        label="E-mail"
        type="email"
        placeholder="Digite seu e-mail"
        value={email}
        onChange={(event) =>
          setEmail(event.target.value)
        }
      />

      <Input
        label="Senha"
        type="password"
        placeholder="Digite sua senha"
        value={senha}
        onChange={(event) =>
          setSenha(event.target.value)
        }
      />

      <Button
        type="submit"
        disabled={carregando}
      >
        {carregando ? "Entrando..." : "Entrar"}
      </Button>

      <div className="text-center mt-4">
        <span style={{ color: "var(--color-muted)" }}>
          Ainda não tem conta?{" "}
        </span>

        <Link
          href="/cadastro"
          className="fw-semibold text-decoration-none"
          style={{ color: "var(--color-primary)" }}
        >
          Criar cadastro
        </Link>
      </div>
    </form>
  );
}