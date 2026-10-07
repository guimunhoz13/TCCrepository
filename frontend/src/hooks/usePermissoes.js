"use client";

import { useCallback } from "react";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";

/**
 * `pode(area, acao)` segundo o perfil de quem está logado — a mesma matriz
 * que a API aplica (backend/advocacia/permissoes.py), entregue no login e
 * atualizada a cada abertura da dashboard. A tela só esconde o que a API
 * recusaria; a proteção de verdade é a do servidor.
 *
 * Sem permissões gravadas (sessão iniciada antes desta versão), mostra tudo
 * e deixa o servidor decidir.
 */
export function usePermissoes() {
  const usuario = useUsuarioLogado();
  const permissoes = usuario?.permissoes;

  return useCallback(
    (area, acao = "ver") => {
      if (!permissoes) return true;
      return (permissoes[area] || []).includes(acao);
    },
    [permissoes]
  );
}
