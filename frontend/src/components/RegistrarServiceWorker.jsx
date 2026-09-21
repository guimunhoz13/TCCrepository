"use client";

import { useEffect } from "react";

/** Registra o service worker que torna o sistema instalável.
 *
 * Só em produção: em desenvolvimento o service worker serviria arquivos
 * antigos do cache e esconderia mudanças recém-feitas no código.
 */
export default function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register(new URL("../lib/service-worker.js", import.meta.url), {
        scope: "/",
        updateViaCache: "none",
      })
      .catch(() => {
        // Sem service worker o sistema continua funcionando normalmente:
        // perde-se a instalação e a tela de offline, nada mais.
      });
  }, []);

  return null;
}
