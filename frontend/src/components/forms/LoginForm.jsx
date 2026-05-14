"use client";

import { useState } from "react";
import Link from "next/link";

import Input from "../ui/Input";
import Button from "../ui/Button";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function handleLogin(event) {
    event.preventDefault();

    console.log({
      email,
      senha,
    });

    window.location.href = "/dashboard";
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