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
  const [carga, setCarga] = useState(0);
  const carregado = useRef(false);
  const ultimaVersao = useRef("");
  const valorAtual = useRef(valor);
  const geracao = useRef(0);
  const timerAtual = useRef(null);
  const gravacoes = useRef(Promise.resolve());
  const inicialSerializado = serializar(valorInicial);

  useEffect(() => { valorAtual.current = valor; }, [valor]);

  useEffect(() => {
    const versaoDaConsulta = ++geracao.current;
    const valorAoConsultar = serializar(valorAtual.current);
    carregado.current = false;
    ultimaVersao.current = "";
    if (!ativo || !chave) return undefined;

    let cancelado = false;
    getRascunho(chave)
      .then((rascunho) => {
        if (cancelado || geracao.current !== versaoDaConsulta) return;
        if (serializar(valorAtual.current) !== valorAoConsultar) {
          // A consulta pode voltar depois que a pessoa começou a digitar.
          ultimaVersao.current = inicialSerializado;
          setEstado("Edição atual preservada; o rascunho anterior não foi restaurado.");
        } else if (rascunho?.dados && Object.keys(rascunho.dados).length > 0) {
          const restaurado = { ...valorInicial, ...rascunho.dados };
          ultimaVersao.current = serializar(restaurado);
          setValor(restaurado);
          setEstado("Rascunho restaurado. Você pode continuar de onde parou.");
        } else {
          ultimaVersao.current = inicialSerializado;
        }
        carregado.current = true;
        setCarga((anterior) => anterior + 1);
      })
      .catch(() => {
        if (!cancelado && geracao.current === versaoDaConsulta) {
          carregado.current = true;
          setCarga((anterior) => anterior + 1);
          setEstado("Não foi possível carregar o rascunho. O formulário continua disponível.");
        }
      });

    return () => {
      cancelado = true;
      geracao.current += 1;
    };
  }, [ativo, chave, inicialSerializado, setValor, valorInicial]);

  useEffect(() => {
    if (!ativo || !chave || !carregado.current) return undefined;
    const versao = serializar(valor);
    if (versao === ultimaVersao.current) return undefined;

    const versaoDaGravacao = geracao.current;
    const timer = window.setTimeout(() => {
      // Serializa as gravações para uma resposta antiga não vencer a nova.
      gravacoes.current = gravacoes.current.catch(() => {}).then(async () => {
        if (geracao.current !== versaoDaGravacao) return;
        try {
          setEstado("Salvando rascunho com segurança...");
          if (versao === inicialSerializado) {
            await excluirRascunho(chave);
          } else {
            await salvarRascunho(chave, valor);
          }
          if (geracao.current !== versaoDaGravacao) return;
          ultimaVersao.current = versao;
          setEstado(versao === inicialSerializado ? "" : "Rascunho salvo com segurança.");
        } catch {
          if (geracao.current === versaoDaGravacao) setEstado("Não foi possível salvar o rascunho agora.");
        }
      });
    }, atraso);
    timerAtual.current = timer;

    return () => window.clearTimeout(timer);
  }, [ativo, atraso, carga, chave, inicialSerializado, valor]);

  const descartar = useCallback(async () => {
    if (!chave) return;
    const versaoDoDescarte = ++geracao.current;
    carregado.current = false;
    window.clearTimeout(timerAtual.current);
    try {
      // Uma gravação iniciada antes do cadastro não pode recriar o rascunho
      // depois da exclusão. Primeiro espera a gravação; depois descarta.
      await gravacoes.current.catch(() => {});
      await excluirRascunho(chave);
    } catch {
      // O cadastro definitivo já pode ter sido salvo. Uma falha secundária
      // ao apagar o rascunho não deve induzir a pessoa a enviar tudo de novo.
      window.setTimeout(() => {
        if (geracao.current === versaoDoDescarte) excluirRascunho(chave).catch(() => {});
      }, 2000);
    } finally {
      ultimaVersao.current = inicialSerializado;
      setEstado("");
    }
  }, [chave, inicialSerializado]);

  return { estadoRascunho: estado, descartarRascunho: descartar };
}
