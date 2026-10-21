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

function nomeDoCampo(campo) {
  const grupo = campo.closest(".form-field");
  const rotulo = grupo?.querySelector(":scope > label");
  return (rotulo?.childNodes[0]?.textContent || rotulo?.textContent || "este campo").trim();
}

export function mensagemDeErroDoCampo(campo) {
  const nome = nomeDoCampo(campo);
  const validade = campo.validity;
  if (validade.valueMissing) return `Preencha o campo “${nome}”.`;
  if (validade.typeMismatch && campo.type === "email") {
    return "Digite um e-mail válido, como nome@exemplo.com.";
  }
  if (validade.tooShort) {
    return `Digite pelo menos ${campo.minLength} caracteres.`;
  }
  if (validade.tooLong) {
    return `Digite no máximo ${campo.maxLength} caracteres.`;
  }
  if (validade.rangeUnderflow) return `Informe um valor igual ou maior que ${campo.min}.`;
  if (validade.rangeOverflow) return `Informe um valor igual ou menor que ${campo.max}.`;
  if (validade.stepMismatch) return "Informe um valor permitido para este campo.";
  if (validade.patternMismatch) return campo.title || "Confira o formato informado.";
  return "Confira o valor informado.";
}

function limparErroDoCampo(campo) {
  const grupo = campo.closest(".form-field");
  const erro = grupo?.querySelector(":scope > .field-error-native");
  if (erro) erro.remove();
  const temErroDaApi = Boolean(grupo?.querySelector(":scope > .field-error-api"));
  if (!temErroDaApi) {
    grupo?.classList.remove("form-field-invalid");
    campo.removeAttribute("aria-invalid");
  }
  if (erro?.id) {
    const descricoes = (campo.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter((id) => id && id !== erro.id);
    if (descricoes.length) campo.setAttribute("aria-describedby", descricoes.join(" "));
    else campo.removeAttribute("aria-describedby");
  }
}

function mostrarErroDoCampo(campo) {
  const grupo = campo.closest(".form-field");
  if (!grupo) return;
  if (!campo.id) campo.id = `campo-${proximoId++}`;

  let erro = grupo.querySelector(":scope > .field-error-native");
  if (!erro) {
    erro = document.createElement("p");
    erro.className = "field-error field-error-native";
    erro.id = `${campo.id}-erro`;
    erro.setAttribute("role", "alert");
    grupo.appendChild(erro);
  }
  erro.textContent = mensagemDeErroDoCampo(campo);
  grupo.classList.add("form-field-invalid");
  campo.setAttribute("aria-invalid", "true");

  const descricoes = new Set(
    (campo.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean)
  );
  descricoes.add(erro.id);
  campo.setAttribute("aria-describedby", [...descricoes].join(" "));
}

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

    function aoCampoInvalido(evento) {
      const campo = evento.target;
      if (!(campo instanceof HTMLInputElement || campo instanceof HTMLSelectElement || campo instanceof HTMLTextAreaElement)) return;
      evento.preventDefault();
      mostrarErroDoCampo(campo);

      const formulario = campo.form;
      if (formulario && !formulario.dataset.focoInvalidoAgendado) {
        formulario.dataset.focoInvalidoAgendado = "true";
        setTimeout(() => {
          const primeiro = formulario.querySelector('[aria-invalid="true"]');
          primeiro?.focus();
          primeiro?.scrollIntoView?.({ behavior: "smooth", block: "center" });
          delete formulario.dataset.focoInvalidoAgendado;
        }, 0);
      }
    }

    function aoCorrigirCampo(evento) {
      const campo = evento.target;
      if (!campo?.matches?.("input, select, textarea") || campo.getAttribute("aria-invalid") !== "true") return;
      if (campo.validity.valid) limparErroDoCampo(campo);
      else mostrarErroDoCampo(campo);
    }

    document.addEventListener("invalid", aoCampoInvalido, true);
    document.addEventListener("input", aoCorrigirCampo, true);
    document.addEventListener("change", aoCorrigirCampo, true);
    return () => {
      observador.disconnect();
      document.removeEventListener("invalid", aoCampoInvalido, true);
      document.removeEventListener("input", aoCorrigirCampo, true);
      document.removeEventListener("change", aoCorrigirCampo, true);
    };
  }, []);

  return null;
}
