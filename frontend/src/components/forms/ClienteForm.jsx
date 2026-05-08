"use client";

import { useState } from "react";
import Link from "next/link";

import Input from "../ui/Input";
import Button from "../ui/Button";

export default function ClienteForm() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");

  function formatarCPF(valor) {
    valor = valor.replace(/\D/g, "");
    valor = valor.slice(0, 11);
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return valor;
  }

  function formatarTelefone(valor) {
    let numeros = valor.replace(/\D/g, "");

    if (numeros.startsWith("55")) {
      numeros = numeros.slice(2);
    }

    numeros = numeros.slice(0, 11);

    if (numeros.length === 0) {
      return "";
    }

    if (numeros.length <= 2) {
      return `+55 (${numeros}`;
    }

    if (numeros.length <= 7) {
      return `+55 (${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    return `+55 (${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  function handleSubmit(event) {
    event.preventDefault();

    console.log({
      nome,
      cpf,
      email,
      telefone,
      endereco,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-2 fw-bold" style={{ color: "var(--color-primary)" }}>
        Cadastro de Cliente
      </h2>

      <p className="mb-4" style={{ color: "var(--color-muted)" }}>
        Preencha seus dados para criar sua conta
      </p>

      <Input
        label="Nome completo"
        placeholder="Digite seu nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <Input
        label="CPF"
        placeholder="000.000.000-00"
        value={cpf}
        onChange={(e) => setCpf(formatarCPF(e.target.value))}
      />

      <Input
        label="E-mail"
        type="email"
        placeholder="Digite seu e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        label="Telefone"
        type="tel"
        placeholder="+55 (18) 99999-9999"
        value={telefone}
        onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
      />

      <Input
        label="Endereço"
        placeholder="Digite seu endereço"
        value={endereco}
        onChange={(e) => setEndereco(e.target.value)}
      />

      <Button type="submit">Criar Conta</Button>

      <div className="text-center mt-4">
        <span style={{ color: "var(--color-muted)" }}>Já possui conta? </span>

        <Link
          href="/"
          className="fw-semibold text-decoration-none"
          style={{ color: "var(--color-primary)" }}
        >
          Voltar para login
        </Link>
      </div>
    </form>
  );
}