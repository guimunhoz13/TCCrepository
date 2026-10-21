"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { excluirRascunho, getRascunho, salvarRascunho } from "@/services/api";

function serializar(valor) {
  return JSON.stringify(valor ?? {});
}

/**
 * Salva formulários novos no servidor, com isolamento por usuário. Não usa
 * localStorage: dados de clientes e processos não devem permanecer no
 * computador depois do logout.
 */
export function useRascunhoFormulario({
  chave,
  ativo,
  valor,
  setValor,
  valorInicial,
  atraso = 900,
}) {
  const [estado, setEstado] = useState("");
  const carregado = useRef(false);
  const ultimaVersao = useRef("");
  const inicialSerializado = serializar(valorInicial);

  useEffect(() => {
    carregado.current = false;
    ultimaVersao.current = "";
    if (!ativo || !chave) return undefined;

    let cancelado = false;
    getRascunho(chave)
      .then((rascunho) => {
        if (cancelado) return;
        if (rascunho?.dados && Object.keys(rascunho.dados).length > 0) {
          const restaurado = { ...valorInicial, ...rascunho.dados };
          ultimaVersao.current = serializar(restaurado);
          setValor(restaurado);
          setEstado("Rascunho restaurado. Você pode continuar de onde parou.");
        } else {
          ultimaVersao.current = inicialSerializado;
        }
        carregado.current = true;
      })
      .catch(() => {
        if (!cancelado) {
          carregado.current = true;
          setEstado("Não foi possível carregar o rascunho. O formulário continua disponível.");
        }
      });

    return () => {
      cancelado = true;
    };
  }, [ativo, chave, inicialSerializado, setValor, valorInicial]);

  useEffect(() => {
    if (!ativo || !chave || !carregado.current) return undefined;
    const versao = serializar(valor);
    if (versao === ultimaVersao.current) return undefined;

    const timer = window.setTimeout(async () => {
      try {
        setEstado("Salvando rascunho com segurança...");
        if (versao === inicialSerializado) {
          await excluirRascunho(chave);
          setEstado("");
        } else {
          await salvarRascunho(chave, valor);
          setEstado("Rascunho salvo com segurança.");
        }
        ultimaVersao.current = versao;
      } catch {
        setEstado("Não foi possível salvar o rascunho agora.");
      }
    }, atraso);

    return () => window.clearTimeout(timer);
  }, [ativo, atraso, chave, inicialSerializado, valor]);

  const descartar = useCallback(async () => {
    if (!chave) return;
    try {
      await excluirRascunho(chave);
    } catch {
      // O cadastro definitivo já pode ter sido salvo. Uma falha secundária
      // ao apagar o rascunho não deve induzir a pessoa a enviar tudo de novo.
      window.setTimeout(() => excluirRascunho(chave).catch(() => {}), 2000);
    } finally {
      ultimaVersao.current = inicialSerializado;
      setEstado("");
    }
  }, [chave, inicialSerializado]);

  return { estadoRascunho: estado, descartarRascunho: descartar };
}
