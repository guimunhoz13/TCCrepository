"use client";

import { useEffect } from "react";

function rotular(raiz) {
  raiz.querySelectorAll(".table-wrap table").forEach((tabela) => {
    const cabecalhos = [...tabela.querySelectorAll(":scope > thead th")].map((th) =>
      th.textContent.trim()
    );
    if (cabecalhos.length === 0) return;
    tabela.querySelectorAll(":scope > tbody > tr").forEach((linha) => {
      [...linha.children].forEach((celula, indice) => {
        const rotulo = celula.colSpan > 1 ? "" : cabecalhos[indice] || "";
        if (celula.getAttribute("data-label") !== rotulo) {
          celula.setAttribute("data-label", rotulo);
        }
      });
    });
  });
}

/**
 * No celular as tabelas viram cartões (ver ".table-wrap" no CSS), e cada
 * campo do cartão precisa do nome da coluna ao lado. Em vez de repetir o
 * rótulo à mão em cada <td> das quinze tabelas do sistema, este componente
 * copia o texto do cabeçalho para um atributo data-label sempre que uma
 * tabela aparece ou muda. Observa só a entrada e saída de elementos (não
 * atributos), então gravar o data-label não dispara o observador de novo.
 */
export default function RotulosDeTabela() {
  useEffect(() => {
    rotular(document.body);
    const observador = new MutationObserver(() => rotular(document.body));
    observador.observe(document.body, { childList: true, subtree: true });
    return () => observador.disconnect();
  }, []);

  return null;
}
