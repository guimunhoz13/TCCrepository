"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { confirmarEmail } from "@/services/api";

export default function ConfirmarEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState(token ? "confirmando" : "sem-token");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (!token) return;

    let ativo = true;
    confirmarEmail(token)
      .then((data) => {
        if (!ativo) return;
        setStatus("sucesso");
        setMensagem(data.detail);
      })
      .catch((error) => {
        if (!ativo) return;
        setStatus("erro");
        setMensagem(error.message);
      });

    return () => {
      ativo = false;
    };
  }, [token]);

  if (status === "sem-token") {
    return (
      <div>
        <h2>Link inválido</h2>
        <p className="subtitle">
          Este link de confirmação está incompleto. Verifique o e-mail que
          enviamos ou solicite um novo cadastro.
        </p>
        <div className="auth-footer">
          <Link href="/login">Voltar para o login</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Confirmação de e-mail</h2>
      <p className="subtitle">Confirmando o e-mail do seu cadastro...</p>

      {status === "confirmando" && (
        <div className="alert">Confirmando, aguarde um instante...</div>
      )}
      {status === "sucesso" && <div className="alert alert-success">{mensagem}</div>}
      {status === "erro" && <div className="alert alert-error">{mensagem}</div>}

      <div className="auth-footer">
        <Link href="/login">Ir para o login</Link>
      </div>
    </div>
  );
}
