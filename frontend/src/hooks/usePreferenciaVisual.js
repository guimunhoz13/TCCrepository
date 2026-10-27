"use client";

import { useCallback, useSyncExternalStore } from "react";

function assinar(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("lexnexo:preferencia-visual", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("lexnexo:preferencia-visual", callback);
  };
}

/** Apenas preferências de aparência; nenhum dado de clientes fica no aparelho. */
export function usePreferenciaVisual(chave, padrao = "false") {
  const ler = useCallback(() => {
    try { return localStorage.getItem(`lexnexo:visual:${chave}`) || padrao; }
    catch { return padrao; }
  }, [chave, padrao]);
  const valor = useSyncExternalStore(assinar, ler, () => padrao);
  function salvar(novo) {
    try {
      localStorage.setItem(`lexnexo:visual:${chave}`, String(novo));
      window.dispatchEvent(new Event("lexnexo:preferencia-visual"));
    } catch { /* A interface segue utilizável quando o armazenamento está bloqueado. */ }
  }
  return [valor, salvar];
}
