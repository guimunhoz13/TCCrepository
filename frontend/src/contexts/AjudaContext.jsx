"use client";

import { createContext, useCallback, useContext, useState } from "react";
import AjudaPanel from "@/components/shell/AjudaPanel";

const AjudaContext = createContext(null);

/** Mantém a central de ajuda acima de tudo.
 *
 * O estado vive aqui, e não na barra superior, porque a ajuda precisa ser
 * alcançável também de dentro de um painel aberto — que cobre a barra. Os
 * dois pontos de entrada abrem a mesma janela.
 */
export function AjudaProvider({ children }) {
  const [aberta, setAberta] = useState(false);
  const [painel, setPainel] = useState(null);

  // Quem abre informa o assunto. A janela da ajuda fica acima do provider
  // de painéis e não conseguiria descobrir sozinha qual está aberto.
  const abrirAjuda = useCallback((painelAtual = null) => {
    setPainel(painelAtual);
    setAberta(true);
  }, []);

  const fecharAjuda = useCallback(() => setAberta(false), []);

  return (
    <AjudaContext.Provider value={{ aberta, abrirAjuda, fecharAjuda }}>
      {children}
      <AjudaPanel aberto={aberta} painel={painel} onFechar={fecharAjuda} />
    </AjudaContext.Provider>
  );
}

export function useAjuda() {
  const contexto = useContext(AjudaContext);
  if (!contexto) throw new Error("useAjuda deve ser usado dentro de AjudaProvider");
  return contexto;
}
