/** Áreas do direito atendidas, compartilhado entre o formulário de
 * processo e a ficha (que precisa do mesmo rótulo pro mesmo valor). */

export const AREAS_DIREITO = [
  { value: "civel", label: "Cível" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "tributario", label: "Tributário" },
  { value: "criminal", label: "Criminal" },
  { value: "familia", label: "Família e Sucessões" },
  { value: "previdenciario", label: "Previdenciário" },
  { value: "empresarial", label: "Empresarial" },
  { value: "administrativo", label: "Administrativo" },
  { value: "consumidor", label: "Consumidor" },
  { value: "ambiental", label: "Ambiental" },
];

export function areaDireitoLabel(valor) {
  return AREAS_DIREITO.find((a) => a.value === valor)?.label || "—";
}
