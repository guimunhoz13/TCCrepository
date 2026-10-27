"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useBloqueioRolagem } from "@/hooks/useBloqueioRolagem";

const MenuMovelContext = createContext(null);

/** Estado da gaveta de navegação no celular/tablet.
 *
 * Abaixo de 1100px o menu lateral sai da tela e vira uma gaveta: o botão de
 * menu do topo e o atalho "Menu" da barra inferior abrem, e escolher um
 * item, tocar fora ou apertar Esc fecha.
 */
export function MenuMovelProvider({ children }) {
  const [aberto, setAberto] = useState(false);
  useBloqueioRolagem(aberto);

  const abrir = useCallback(() => setAberto(true), []);
  const fechar = useCallback(() => setAberto(false), []);

  useEffect(() => {
    if (!aberto) return undefined;
    function aoTeclar(evento) {
      if (evento.key === "Escape") setAberto(false);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => {
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  return (
    <MenuMovelContext.Provider value={{ aberto, abrir, fechar }}>
      {children}
    </MenuMovelContext.Provider>
  );
}

export function useMenuMovel() {
  const contexto = useContext(MenuMovelContext);
  if (!contexto) throw new Error("useMenuMovel deve ser usado dentro de MenuMovelProvider");
  return contexto;
}
