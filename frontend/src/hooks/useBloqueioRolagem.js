"use client";

import { useEffect } from "react";

const bloqueios = new Set();
let estilosAnteriores = [];
const propriedadesRolagem = ["overflow", "overflow-x", "overflow-y"];

/** Trava o documento, não o conteúdo da janela. Janelas sobrepostas
 * compartilham a trava: fechar a ajuda não libera o fundo de um painel. */
export function useBloqueioRolagem(ativo) {
  useEffect(() => {
    if (!ativo) return;
    const chave = Symbol("janela-aberta");
    if (bloqueios.size === 0) {
      estilosAnteriores = [document.documentElement, document.body].map((elemento) => ({
        elemento,
        propriedades: propriedadesRolagem.map((nome) => ({ nome,
          valor: elemento.style.getPropertyValue(nome),
          prioridade: elemento.style.getPropertyPriority(nome),
        })),
      }));
      for (const { elemento } of estilosAnteriores) {
        // hidden no body criaria outro contêiner de rolagem e faria o menu
        // sticky saltar para fora quando a página já estivesse rolada.
        const valor = elemento === document.body ? "clip" : "hidden";
        for (const nome of propriedadesRolagem) elemento.style.setProperty(nome, valor);
      }
    }
    bloqueios.add(chave);
    return () => {
      bloqueios.delete(chave);
      if (bloqueios.size > 0) return;
      for (const { elemento, propriedades } of estilosAnteriores) {
        for (const nome of propriedadesRolagem) elemento.style.removeProperty(nome);
        for (const { nome, valor, prioridade } of propriedades) {
          if (valor) elemento.style.setProperty(nome, valor, prioridade);
          else elemento.style.removeProperty(nome);
        }
      }
      estilosAnteriores = [];
    };
  }, [ativo]);
}
