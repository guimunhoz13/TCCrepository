"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { redefinirSenha } from "@/services/api";
import { senhaAtendeRequisitos } from "@/utils/senha";
import RequisitosSenha from "@/components/ui/RequisitosSenha";

export default function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    if (!senhaAtendeRequisitos(novaSenha)) {
      setErro("A nova senha não atende a todos os requisitos obrigatórios.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro("A confirmação da nova senha não confere.");
      return;
    }

    try {
      setCarregando(true);
      const data = await redefinirSenha({
        token,
        nova_senha: novaSenha,
        confirmar_senha: confirmarSenha,
      });
      setMensagem(data.detail);
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  if (!token) {
    return (
      <div>
        <h2>Link inválido</h2>
        <p className="subtitle">
          Este link de redefinição de senha está incompleto. Solicite um novo
          link.
        </p>
        <div className="auth-footer">
          <Link href="/esqueci-senha">Solicitar novo link</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Nova senha</h2>
      <p className="subtitle">Escolha uma nova senha para acessar o sistema.</p>

      {mensagem && <div className="alert alert-success">{mensagem}</div>}
      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="form-field" style={{ marginBottom: 16 }}>
        <label>Nova senha</label>
        <input
          type="password"
          placeholder="••••••••"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          required
        />
        <RequisitosSenha senha={novaSenha} />
      </div>

      <div className="form-field" style={{ marginBottom: 22 }}>
        <label>Confirmar nova senha</label>
        <input
          type="password"
          placeholder="••••••••"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          required
        />
      </div>

      <button
        className="btn btn-primary"
        style={{ width: "100%" }}
        disabled={carregando || !senhaAtendeRequisitos(novaSenha)}
      >
        {carregando ? "Salvando..." : "Redefinir senha"}
      </button>

      <div className="auth-footer">
        <Link href="/login">Voltar para o login</Link>
      </div>
    </form>
  );
}
