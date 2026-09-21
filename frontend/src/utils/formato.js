/** Formatações de valor e de tempo usadas no relatório impresso e na dashboard. */

export function formatarMoeda(valor) {
  // O back-end manda os campos de serializer como texto ("1234.50") e os
  // totais agregados como número; os dois passam por aqui.
  if (valor === null || valor === undefined || valor === "") return "—";
  const numero = Number(valor);
  if (Number.isNaN(numero)) return "—";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarHoras(minutos) {
  const total = Number(minutos) || 0;
  return `${Math.floor(total / 60)}h${String(total % 60).padStart(2, "0")}`;
}
