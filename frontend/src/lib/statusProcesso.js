/** Fonte única de verdade para o status de um processo.
 *
 * O status aparece em três lugares — o selo das tabelas, o donut da
 * dashboard e a legenda dele. Antes cada um decidia a própria cor, e o
 * resultado era "Concluído" verde no selo e azul no gráfico, na mesma
 * tela. Aqui o rótulo, a classe do selo e a cor do gráfico saem do mesmo
 * lugar.
 *
 * As cores do gráfico foram validadas contra o fundo de cada tema para
 * faixa de luminosidade, separação sob daltonismo (protanopia,
 * deuteranopia e tritanopia) e contraste. A ordem abaixo também é a ordem
 * das fatias: ela mantém verde e ameixa longe do âmbar e fecha o círculo
 * com o cinza, que é o par mais distante do começo.
 */

export const STATUS_PROCESSO = [
  {
    valor: "Em andamento",
    rotulo: "Em andamento",
    badge: "badge-warning",
    cor: { light: "#b5791f", dark: "#ad7d2b" },
  },
  {
    valor: "Concluido",
    rotulo: "Concluído",
    badge: "badge-success",
    cor: { light: "#1f7a52", dark: "#38996f" },
  },
  {
    valor: "Suspenso",
    rotulo: "Suspenso",
    badge: "badge-info",
    cor: { light: "#7a4b9e", dark: "#8f66c2" },
  },
  {
    // Sem croma de propósito: arquivado é um estado inativo, e o sistema
    // já usa cinza para inativo em toda tabela.
    valor: "Arquivado",
    rotulo: "Arquivado",
    badge: "badge-muted",
    cor: { light: "#8a91a6", dark: "#5a6170" },
  },
];

const POR_VALOR = new Map(STATUS_PROCESSO.map((s) => [s.valor, s]));

/** Ordem de exibição de um status, para ordenar fatias e listas. */
export function ordemStatus(valor) {
  const indice = STATUS_PROCESSO.findIndex((s) => s.valor === valor);
  // Status desconhecido (vindo de dado antigo) vai para o fim.
  return indice === -1 ? STATUS_PROCESSO.length : indice;
}

export function rotuloStatus(valor) {
  return POR_VALOR.get(valor)?.rotulo ?? valor;
}

export function badgeStatus(valor) {
  return POR_VALOR.get(valor)?.badge ?? "badge-muted";
}

/** Cor da fatia no gráfico, sempre pela identidade do status.
 *
 * Nunca pelo índice: um escritório sem processos suspensos não pode fazer
 * "Arquivado" herdar a cor de outro status.
 */
export function corStatus(valor, tema = "dark") {
  const status = POR_VALOR.get(valor);
  if (!status) return tema === "light" ? "#8a91a6" : "#5a6170";
  return status.cor[tema === "light" ? "light" : "dark"];
}
