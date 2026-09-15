"use client";

import { useState } from "react";
import Link from "next/link";
import { solicitarRedefinicaoSenha } from "@/services/api";

export default function EsqueciSenhaForm() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    try {
      setCarregando(true);
      const data = await solicitarRedefinicaoSenha(email.trim());
      setMensagem(data.detail);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Esqueci minha senha</h2>
      <p className="subtitle">
        Enviaremos um link de redefinição para o e-mail informado.
      </p>

      {mensagem && <div className="alert alert-success">{mensagem}</div>}
      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="form-field" style={{ marginBottom: 22 }}>
        <label>E-mail</label>
        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <button
        className="btn btn-primary"
        style={{ width: "100%" }}
        disabled={carregando}
      >
        {carregando ? "Enviando..." : "Enviar link de redefinição"}
      </button>

      <div className="auth-footer">
        Lembrou sua senha? <Link href="/login">Voltar para o login</Link>
      </div>
    </form>
  );
}
