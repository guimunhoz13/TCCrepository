"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registrarEscritorio } from "@/services/api";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome_escritorio: "",
    cnpj: "",
    email_escritorio: "",
    telefone_escritorio: "",
    endereco_escritorio: "",
    cidade: "",
    estado: "",
    nome_admin: "",
    email_admin: "",
    senha_admin: "",
  });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function alterarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    try {
      setCarregando(true);
      await registrarEscritorio(form);

      sessionStorage.setItem(
        "sucessoCadastro",
        "Escritório cadastrado! Faça login com o e-mail do administrador."
      );

      router.push("/");
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Criar escritório</h2>
      <p className="subtitle">
        Cadastre seu escritório e crie o usuário administrador
      </p>

      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="form-grid">
        <div className="form-field full">
          <label>Nome do escritório</label>
          <input
            value={form.nome_escritorio}
            onChange={(e) => alterarCampo("nome_escritorio", e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label>CNPJ</label>
          <input
            value={form.cnpj}
            onChange={(e) => alterarCampo("cnpj", e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label>Telefone</label>
          <input
            value={form.telefone_escritorio}
            onChange={(e) =>
              alterarCampo("telefone_escritorio", e.target.value)
            }
            required
          />
        </div>
        <div className="form-field">
          <label>E-mail do escritório</label>
          <input
            type="email"
            value={form.email_escritorio}
            onChange={(e) => alterarCampo("email_escritorio", e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label>Cidade</label>
          <input
            value={form.cidade}
            onChange={(e) => alterarCampo("cidade", e.target.value)}
          />
        </div>
        <div className="form-field full">
          <label>Endereço</label>
          <input
            value={form.endereco_escritorio}
            onChange={(e) =>
              alterarCampo("endereco_escritorio", e.target.value)
            }
            required
          />
        </div>
        <div className="form-field">
          <label>Estado (UF)</label>
          <input
            maxLength={2}
            value={form.estado}
            onChange={(e) => alterarCampo("estado", e.target.value.toUpperCase())}
          />
        </div>
        <div className="form-field full">
          <strong style={{ marginTop: 8 }}>Administrador do escritório</strong>
        </div>
        <div className="form-field">
          <label>Nome do admin</label>
          <input
            value={form.nome_admin}
            onChange={(e) => alterarCampo("nome_admin", e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label>E-mail do admin</label>
          <input
            type="email"
            value={form.email_admin}
            onChange={(e) => alterarCampo("email_admin", e.target.value)}
            required
          />
        </div>
        <div className="form-field full">
          <label>Senha do admin</label>
          <input
            type="password"
            value={form.senha_admin}
            onChange={(e) => alterarCampo("senha_admin", e.target.value)}
            required
          />
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: "100%", marginTop: 20 }}
        disabled={carregando}
      >
        {carregando ? "Cadastrando..." : "Criar escritório"}
      </button>

      <div className="auth-footer">
        Já possui conta? <Link href="/">Voltar ao login</Link>
      </div>
    </form>
  );
}
