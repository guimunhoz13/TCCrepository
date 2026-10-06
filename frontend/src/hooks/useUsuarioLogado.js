"use client";

import { useMemo, useSyncExternalStore } from "react";
import { EVENTO_USUARIO_ALTERADO } from "@/services/api";

function assinar(aoMudar) {
  window.addEventListener("storage", aoMudar);
  window.addEventListener(EVENTO_USUARIO_ALTERADO, aoMudar);
  return () => {
    window.removeEventListener("storage", aoMudar);
    window.removeEventListener(EVENTO_USUARIO_ALTERADO, aoMudar);
  };
}

// No servidor não há localStorage: renderiza sem valor e o React troca pelo
// valor real na hidratação, sem aviso de divergência.
const lerNoServidor = () => null;

/** Objeto JSON gravado no localStorage sob `chave`, sempre atualizado. */
export function useItemSalvo(chave) {
  const bruto = useSyncExternalStore(
    assinar,
    () => localStorage.getItem(chave),
    lerNoServidor
  );
  return useMemo(() => {
    if (!bruto) return null;
    try {
      return JSON.parse(bruto);
    } catch {
      return null;
    }
  }, [bruto]);
}

/**
 * Usuário logado (gravado no localStorage pelo login), sempre atualizado:
 * quando o perfil é editado em Configurações, o nome e a foto do topo e da
 * barra lateral mudam na hora, e também nas outras abas abertas.
 */
export function useUsuarioLogado() {
  return useItemSalvo("usuarioLogado");
}
