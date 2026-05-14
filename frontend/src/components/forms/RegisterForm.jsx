"use client";

import { useState } from "react";
import Link from "next/link";

import Input from "../ui/Input";
import Button from "../ui/Button";

export default function RegisterForm() {

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [oab, setOab] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

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

    if (senha !== confirmarSenha) {

      alert("As senhas não coincidem");

      return;
    }

    fetch("http://127.0.0.1:8000/api/clientes/", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        nome,
        cpf,
        oab,
        email,
        telefone,
        senha,
      }),

    })
      .then((response) => response.json())
      .then(() => {

        alert("Advogado cadastrado com sucesso!");

        window.location.href = "/";
      })

      .catch((error) => {

        console.error(error);

        alert("Erro ao cadastrar advogado");
      });
  }

  return (

    <form onSubmit={handleSubmit}>

      <h2
        className="mb-2 fw-bold"
        style={{
          color: "var(--color-primary)",
        }}
      >
        Cadastro de Advogado
      </h2>

      <p
        className="mb-4"
        style={{
          color: "var(--color-muted)",
        }}
      >
        Crie sua conta para acessar o sistema jurídico
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
        onChange={(e) =>
          setCpf(formatarCPF(e.target.value))
        }
      />

      <Input
        label="Número OAB"
        placeholder="000000/SP"
        value={oab}
        onChange={(e) => setOab(e.target.value)}
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
        onChange={(e) =>
          setTelefone(formatarTelefone(e.target.value))
        }
      />

      <Input
        label="Senha"
        type="password"
        placeholder="Digite sua senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />

      <Input
        label="Confirmar senha"
        type="password"
        placeholder="Digite novamente sua senha"
        value={confirmarSenha}
        onChange={(e) => setConfirmarSenha(e.target.value)}
      />

      <Button type="submit">
        Criar Conta
      </Button>

      <div className="text-center mt-4">

        <span
          style={{
            color: "var(--color-muted)",
          }}
        >
          Já possui conta?{" "}
        </span>

        <Link
          href="/"
          className="fw-semibold text-decoration-none"
          style={{
            color: "var(--color-primary)",
          }}
        >
          Voltar para login
        </Link>

      </div>

    </form>
  );
}