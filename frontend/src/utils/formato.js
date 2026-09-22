/** Formatações de valor e de tempo usadas no relatório impresso e na dashboard. */

export function formatarData(valor, comHora = false) {
  if (!valor) return "—";
  // Campos de data pura ("2026-09-21") seriam lidos pelo Date como meia-noite
  // em UTC e, no fuso de Brasília, voltariam um dia. Para esses, basta
  // reordenar os pedaços do texto.
  const soData = /^\d{4}-\d{2}-\d{2}$/.exec(String(valor));
  if (soData) {
    const [ano, mes, dia] = valor.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return comHora ? data.toLocaleString("pt-BR") : data.toLocaleDateString("pt-BR");
}

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
