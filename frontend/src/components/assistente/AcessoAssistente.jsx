"use client";

import { getPlanoAtual } from "@/services/api";
import { useRecurso } from "@/hooks/useRecurso";
import AssistenteChat from "./AssistenteChat";

export default function AcessoAssistente() {
  const plano = useRecurso(getPlanoAtual);

  if (plano.carregando) {
    return <p role="status">Verificando acesso ao assistente…</p>;
  }

  if (plano.erro) {
    return (
      <div className="alert alert-error" role="alert">
        <p>Não foi possível verificar o acesso ao assistente.</p>
        <button type="button" className="btn btn-secondary" onClick={plano.recarregar}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!plano.dados?.recursos?.includes("ia")) {
    return (
      <div className="chat-container">
        <p>O Assistente IA está disponível no plano Profissional.</p>
        <p>Consulte os planos pelo menu do escritório para conhecer os recursos disponíveis.</p>
      </div>
    );
  }

  return <AssistenteChat />;
}
