"use client";

import { useEffect } from "react";

function rotularTabelas(raiz) {
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

let proximoId = 1;

function vincularRotulosDeCampo(raiz) {
  raiz.querySelectorAll(".form-field > label:not([for])").forEach((rotulo) => {
    // Rótulo que já envolve o próprio campo está associado.
    if (rotulo.querySelector("input, select, textarea")) return;
    const campo = rotulo.parentElement.querySelector(
      "input:not([type=hidden]), select, textarea"
    );
    if (!campo) return;
    if (!campo.id) campo.id = `campo-${proximoId++}`;
    rotulo.htmlFor = campo.id;
  });
}

function aplicar() {
  rotularTabelas(document.body);
  vincularRotulosDeCampo(document.body);
}

/**
 * Duas marcações que o sistema precisaria repetir à mão em dezenas de
 * lugares, feitas num ponto só sempre que um elemento aparece ou muda:
 *
 * - Tabelas: copia o texto do cabeçalho para o data-label de cada célula.
 *   No celular as tabelas viram cartões (ver ".table-wrap" no CSS) e cada
 *   campo do cartão mostra o nome da coluna ao lado.
 * - Formulários: liga cada <label> de um ".form-field" ao campo do mesmo
 *   bloco (for/id). Sem isso, o leitor de tela anunciava só "campo de
 *   texto", sem dizer qual, e clicar no rótulo não focava o campo.
 *
 * Observa só a entrada e saída de elementos (não atributos), então gravar
 * data-label, id ou for não dispara o observador de novo.
 */
export default function RotulosAutomaticos() {
  useEffect(() => {
    aplicar();
    const observador = new MutationObserver(aplicar);
    observador.observe(document.body, { childList: true, subtree: true });
    return () => observador.disconnect();
  }, []);

  return null;
}
