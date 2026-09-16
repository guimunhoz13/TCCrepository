"use client";

import { useEffect } from "react";
import { registrarAtividade } from "@/services/api";

const INTERVALO_MS = 5 * 60 * 1000;

/**
 * Avisa o servidor, de tempos em tempos, que o usuário está com o sistema
 * aberto — é o que alimenta o relatório de tempo de uso.
 *
 * Só envia sinal com a aba visível: uma aba esquecida em segundo plano não
 * deve contar como tempo de uso. Como a contagem termina no último sinal
 * recebido, fechar o navegador subnotifica alguns minutos, o que é
 * preferível a inflar o número.
 */
export default function useRegistroDeAtividade() {
  useEffect(() => {
    let cancelado = false;

    function sinalizar() {
      if (cancelado || document.visibilityState !== "visible") return;
      registrarAtividade().catch(() => {});
    }

    sinalizar();
    const intervalo = setInterval(sinalizar, INTERVALO_MS);
    document.addEventListener("visibilitychange", sinalizar);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", sinalizar);
    };
  }, []);
}
