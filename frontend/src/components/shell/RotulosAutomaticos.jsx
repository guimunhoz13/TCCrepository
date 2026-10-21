"use client";

import { useEffect } from "react";
import { DICAS_CAMPOS, normalizarRotulo } from "@/lib/ajudaCampos";

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

function orientarCampos(raiz) {
  raiz.querySelectorAll(".form-field").forEach((grupo) => {
    const rotulo = grupo.querySelector(":scope > label");
    const campo = grupo.querySelector(
      ":scope > input:not([type=hidden]), :scope > select, :scope > textarea"
    );
    if (!rotulo || !campo) return;

    const chave = normalizarRotulo(rotulo.childNodes[0]?.textContent || rotulo.textContent);
    const dica = DICAS_CAMPOS[chave];

    if (campo.required && !rotulo.querySelector(".campo-obrigatorio")) {
      const marcador = document.createElement("span");
      marcador.className = "campo-obrigatorio";
      marcador.textContent = " (obrigatório)";
      rotulo.appendChild(marcador);
    }

    if (!dica || grupo.querySelector(":scope > .field-hint")) return;
    if (!campo.id) campo.id = `campo-${proximoId++}`;

    const ajuda = document.createElement("p");
    ajuda.className = "field-hint";
    ajuda.id = `${campo.id}-ajuda`;
    ajuda.textContent = dica;
    rotulo.insertAdjacentElement("afterend", ajuda);

    const descricoes = new Set(
      (campo.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean)
    );
    descricoes.add(ajuda.id);
    campo.setAttribute("aria-describedby", [...descricoes].join(" "));
  });
}

function aplicar() {
  rotularTabelas(document.body);
  vincularRotulosDeCampo(document.body);
  orientarCampos(document.body);
}

/**
 * Duas marcações que o sistema precisaria repetir à mão em dezenas de
 * lugares, feitas num ponto só sempre que um elemento aparece ou muda:
 *
 * - Tabelas: copia o texto do cabeçalho para o data-label de cada célula.
 *   No celular as tabelas viram cartões (ver ".table-wrap" no CSS) e cada
 *   campo do cartão mostra o nome da coluna ao lado.
 * - Formulários: liga o rótulo ao campo, identifica os obrigatórios e inclui
 *   ajuda visível/programática nos campos que têm formato ou efeito menos
 *   óbvio.
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
