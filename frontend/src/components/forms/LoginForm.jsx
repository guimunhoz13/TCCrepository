"use client";

import { useState } from "react";
import Link from "next/link";

import Input from "../ui/Input";
import Button from "../ui/Button";

export default function LoginForm() {

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function handleLogin(event) {

    event.preventDefault();

    if (!email || !senha) {
      alert("Preencha todos os campos");
      return;
    }

    try {

      const response = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: senha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert("E-mail ou senha inválidos.");
        return;
      }

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      window.location.href = "/dashboard";

    } catch (error) {

      console.error(error);
      alert("Erro ao conectar ao servidor.");

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

      <Input
        label="E-mail"
        type="email"
        placeholder="Digite seu e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        label="Senha"
        type="password"
        placeholder="Digite sua senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />

      <Button type="submit">
        Entrar
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