"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getConfiguracoes, updatePreferencias as apiAtualizarPreferencias } from "@/services/api";
import { traduzir } from "@/lib/i18n";

const PreferencesContext = createContext(null);

const PADRAO = {
  densidade_tabela: "comfortable",
  idioma: "pt-BR",
};

export function PreferencesProvider({ children }) {
  const [preferencias, setPreferencias] = useState(PADRAO);

  useEffect(() => {
    let ativo = true;
    getConfiguracoes()
      .then((res) => {
        if (!ativo || !res?.preferencias) return;
        setPreferencias((atual) => ({ ...atual, ...res.preferencias }));
      })
      .catch(() => {
        /* usuário pode não estar autenticado ainda — mantém padrão */
      });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-density",
      preferencias.densidade_tabela === "compact" ? "compact" : "comfortable"
    );
  }, [preferencias.densidade_tabela]);

  const atualizarPreferencias = useCallback(async (campos) => {
    setPreferencias((atual) => ({ ...atual, ...campos }));
    const res = await apiAtualizarPreferencias(campos);
    if (res?.preferencias) {
      setPreferencias((atual) => ({ ...atual, ...res.preferencias }));
    }
    return res;
  }, []);

  const t = useCallback(
    (chave) => traduzir(preferencias.idioma, chave),
    [preferencias.idioma]
  );

  return (
    <PreferencesContext.Provider
      value={{
        densidade: preferencias.densidade_tabela,
        idioma: preferencias.idioma,
        preferencias,
        atualizarPreferencias,
        t,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences deve ser usado dentro de PreferencesProvider");
  }
  return context;
}
