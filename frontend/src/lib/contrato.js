/** Rótulos de contrato compartilhados entre o relatório impresso e a
 * ficha do processo, pra não terem cada um a sua tradução do mesmo valor. */

export const TIPO_HONORARIO_LABEL = {
  fixo: "Valor fixo",
  exito: "Percentual de êxito",
  hora: "Por hora trabalhada",
};

export function situacaoDespesa(despesa) {
  if (despesa.reembolsada) return "Reembolsada";
  return despesa.reembolsavel ? "A reembolsar" : "Não reembolsável";
}
