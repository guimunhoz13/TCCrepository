const DIA_MS = 24 * 60 * 60 * 1000;

function inicioDoDia(data) {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function formatarHora(data) {
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function classificarAlertaAgenda(evento, referencia = new Date()) {
  if (!evento || evento.cumprido) return null;

  const data = new Date(evento.data_evento);
  const agora = new Date(referencia);
  if (Number.isNaN(data.getTime()) || Number.isNaN(agora.getTime())) return null;

  const dias = Math.round((inicioDoDia(data) - inicioDoDia(agora)) / DIA_MS);
  const fatal = evento.tipo === "prazo" && evento.prioridade === "fatal";
  const vencido = Boolean(evento.atrasado) || data.getTime() < agora.getTime();
  const hora = formatarHora(data);

  let quando;
  if (vencido && dias === 0) quando = `Vencido hoje às ${hora}`;
  else if (dias === -1) quando = `Vencido ontem às ${hora}`;
  else if (dias < -1) quando = `Vencido há ${Math.abs(dias)} dias`;
  else if (dias === 0) quando = `Hoje às ${hora}`;
  else if (dias === 1) quando = `Amanhã às ${hora}`;
  else quando = `Em ${dias} dias, às ${hora}`;

  let gravidade = "proximo";
  if (fatal && vencido) gravidade = "fatal-vencido";
  else if (fatal) gravidade = "fatal";
  else if (vencido) gravidade = "vencido";
  else if (dias <= 1) gravidade = "urgente";

  return {
    ...evento,
    data,
    dias,
    fatal,
    vencido,
    quando,
    gravidade,
    tipoLabel: evento.tipo === "prazo" ? "Prazo" : "Compromisso",
  };
}

function pesoDoAlerta(alerta) {
  if (alerta.gravidade === "fatal-vencido") return 0;
  if (alerta.gravidade === "fatal" && alerta.dias <= 1) return 1;
  if (alerta.gravidade === "vencido") return 2;
  if (alerta.gravidade === "fatal") return 3;
  if (alerta.gravidade === "urgente") return 4;
  return 5;
}

export function selecionarAlertasAgenda(
  eventos,
  referencia = new Date(),
  { diasFuturos = 7, limite = 8, somentePrazos = false } = {}
) {
  const agora = new Date(referencia);
  return (eventos || [])
    .map((evento) => classificarAlertaAgenda(evento, agora))
    .filter(Boolean)
    .filter((alerta) => !somentePrazos || alerta.tipo === "prazo")
    .filter((alerta) => alerta.vencido || alerta.dias <= diasFuturos)
    .sort((a, b) => pesoDoAlerta(a) - pesoDoAlerta(b) || a.data - b.data)
    .slice(0, limite);
}

export function resumirAlertasAgenda(alertas) {
  return (alertas || []).reduce(
    (resumo, alerta) => ({
      total: resumo.total + 1,
      fatais: resumo.fatais + (alerta.fatal ? 1 : 0),
      vencidos: resumo.vencidos + (alerta.vencido ? 1 : 0),
    }),
    { total: 0, fatais: 0, vencidos: 0 }
  );
}
