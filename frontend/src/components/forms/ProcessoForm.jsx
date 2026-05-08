"use client";

import { useState } from "react";

import Input from "../ui/Input";
import Button from "../ui/Button";

export default function ProcessoForm() {

  const [numero, setNumero] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    console.log({
      numero,
      titulo,
      descricao,
    });
  }

  return (
    <form onSubmit={handleSubmit}>

      <h2 className="mb-4">
        Cadastro de Processo
      </h2>

      <Input
        label="Número do Processo"
        placeholder="Digite o número"
        value={numero}
        onChange={(e) => setNumero(e.target.value)}
      />

      <Input
        label="Título"
        placeholder="Digite o título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
      />

      <Input
        label="Descrição"
        placeholder="Digite a descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />

      <Button type="submit">
        Salvar Processo
      </Button>

    </form>
  );
}