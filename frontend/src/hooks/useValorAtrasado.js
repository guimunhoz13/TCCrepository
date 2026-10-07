"use client";

import { useEffect, useState } from "react";

/** Devolve `valor` só depois que ele para de mudar por `atraso` ms — usado
 *  nas buscas para não disparar uma requisição a cada tecla. */
export function useValorAtrasado(valor, atraso = 300) {
  const [atrasado, setAtrasado] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setAtrasado(valor), atraso);
    return () => clearTimeout(timer);
  }, [valor, atraso]);

  return atrasado;
}
