"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";

const ThemeContext = createContext(null);

const EVENTO_TEMA = "lexoffice:tema-alterado";
const TEMA_PADRAO = "dark";

function lerTema() {
  const salvo = localStorage.getItem("theme");
  return salvo === "light" || salvo === "dark" ? salvo : TEMA_PADRAO;
}

function assinar(aoMudar) {
  window.addEventListener("storage", aoMudar);
  window.addEventListener(EVENTO_TEMA, aoMudar);
  return () => {
    window.removeEventListener("storage", aoMudar);
    window.removeEventListener(EVENTO_TEMA, aoMudar);
  };
}

export function ThemeProvider({ children }) {
  // O tema mora no localStorage (o script do layout já o aplica antes da
  // hidratação, sem piscar). No servidor vale o padrão.
  const theme = useSyncExternalStore(assinar, lerTema, () => TEMA_PADRAO);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const setTheme = useCallback((novo) => {
    const valor = typeof novo === "function" ? novo(lerTema()) : novo;
    if (valor !== "light" && valor !== "dark") return;
    localStorage.setItem("theme", valor);
    window.dispatchEvent(new Event(EVENTO_TEMA));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((atual) => (atual === "dark" ? "light" : "dark"));
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return context;
}
