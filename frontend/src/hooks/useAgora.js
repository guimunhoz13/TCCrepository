"use client";

import { useEffect, useState } from "react";

/** Instante atual, renovado a cada `intervalo` ms. Ler Date.now() direto
 *  na renderização a tornaria impura (o resultado mudaria a cada render) e
 *  as listas de "próximos" e "vencendo" nunca se atualizariam sozinhas com
 *  a tela parada. */
export function useAgora(intervalo = 60_000) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(timer);
  }, [intervalo]);

  return agora;
}
