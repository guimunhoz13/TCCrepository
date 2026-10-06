"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { normalizarLista } from "@/services/api";

/**
 * Carrega dados da API para um componente.
 *
 * `chaves` são os valores que definem a consulta (filtros, busca, id): quando
 * um deles muda, a consulta é refeita. Com `ativo: false` nada é buscado
 * (painel fechado, por exemplo).
 *
 * O "carregando" é derivado — a consulta atual ainda não respondeu — em vez
 * de um setState no início do efeito. Assim:
 *  - não há renderização em cascata (regra react-hooks/set-state-in-effect);
 *  - a resposta de uma consulta antiga que chega atrasada (ex.: o usuário
 *    digitou mais letras na busca) é descartada e não sobrescreve a atual.
 */
export function useRecurso(buscar, chaves = [], { ativo = true } = {}) {
  const [versao, setVersao] = useState(0);
  const [estado, setEstado] = useState({ chave: null, dados: undefined, erro: "" });
  const chave = ativo ? JSON.stringify([...chaves, versao]) : null;
  const executar = useEffectEvent(() => buscar());

  useEffect(() => {
    if (chave === null) return undefined;
    let vigente = true;

    Promise.resolve()
      .then(() => executar())
      .then(
        (dados) => {
          if (vigente) setEstado({ chave, dados, erro: "" });
        },
        (erro) => {
          if (vigente) {
            setEstado((anterior) => ({
              chave,
              dados: anterior.dados,
              erro: erro?.message || "Não foi possível carregar os dados.",
            }));
          }
        }
      );

    return () => {
      vigente = false;
    };
  }, [chave]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  return {
    dados: estado.dados,
    erro: estado.erro,
    carregando: chave !== null && estado.chave !== chave,
    recarregar,
  };
}

/**
 * Lista paginada pela API (DRF): carrega a primeira página e oferece
 * `carregarMais` para as seguintes. Antes as telas liam só `results` da
 * primeira página e descartavam o `next`, então tudo depois do 200º
 * registro sumia sem aviso.
 *
 * `buscarPagina(numero)` deve devolver a resposta paginada da API.
 */
export function useListaPaginada(buscarPagina, chaves = [], opcoes = {}) {
  const primeira = useRecurso(() => buscarPagina(1), chaves, opcoes);
  const [extras, setExtras] = useState({ base: null, paginas: [] });
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroMais, setErroMais] = useState("");

  const base = primeira.dados;
  // As páginas extras só valem para a primeira página que as originou:
  // mudou o filtro (nova primeira página), elas são descartadas.
  const paginasExtras = extras.base === base ? extras.paginas : [];
  const itens = [base, ...paginasExtras].flatMap((pagina) => normalizarLista(pagina));
  const ultima = paginasExtras.length ? paginasExtras[paginasExtras.length - 1] : base;
  const temMais = Boolean(ultima?.next);
  const total = typeof base?.count === "number" ? base.count : itens.length;

  async function carregarMais() {
    if (!temMais || carregandoMais) return;
    setCarregandoMais(true);
    setErroMais("");
    try {
      const pagina = await buscarPagina(2 + paginasExtras.length);
      setExtras({ base, paginas: [...paginasExtras, pagina] });
    } catch (erro) {
      setErroMais(erro?.message || "Não foi possível carregar mais itens.");
    } finally {
      setCarregandoMais(false);
    }
  }

  return {
    itens,
    total,
    temMais,
    carregarMais,
    carregandoMais,
    carregando: primeira.carregando,
    erro: primeira.erro || erroMais,
    recarregar: primeira.recarregar,
  };
}
