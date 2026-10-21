import {
  classificarAlertaAgenda,
  resumirAlertasAgenda,
  selecionarAlertasAgenda,
} from "../alertasAgenda";

const AGORA = new Date("2026-10-21T10:00:00-03:00");

function evento(id, data, extras = {}) {
  return {
    id,
    tipo: "prazo",
    prioridade: "normal",
    titulo: `Evento ${id}`,
    data_evento: data,
    cumprido: false,
    ...extras,
  };
}

describe("alertas da agenda", () => {
  test("explica hoje, amanhã e vencimento sem depender de cor", () => {
    expect(classificarAlertaAgenda(evento(1, "2026-10-21T14:00:00-03:00"), AGORA).quando).toBe(
      "Hoje às 14:00"
    );
    expect(classificarAlertaAgenda(evento(2, "2026-10-22T09:00:00-03:00"), AGORA).quando).toBe(
      "Amanhã às 09:00"
    );
    expect(classificarAlertaAgenda(evento(3, "2026-10-20T09:00:00-03:00"), AGORA).quando).toBe(
      "Vencido ontem às 09:00"
    );
  });

  test("prioriza prazo fatal vencido e remove o que foi cumprido", () => {
    const alertas = selecionarAlertasAgenda(
      [
        evento(1, "2026-10-23T09:00:00-03:00"),
        evento(2, "2026-10-20T09:00:00-03:00"),
        evento(3, "2026-10-20T08:00:00-03:00", { prioridade: "fatal" }),
        evento(4, "2026-10-21T12:00:00-03:00", { cumprido: true }),
      ],
      AGORA
    );

    expect(alertas.map((alerta) => alerta.id)).toEqual([3, 2, 1]);
    expect(alertas[0].gravidade).toBe("fatal-vencido");
    expect(resumirAlertasAgenda(alertas)).toEqual({ total: 3, fatais: 1, vencidos: 2 });
  });

  test("pode limitar a lista a prazos dentro da janela escolhida", () => {
    const alertas = selecionarAlertasAgenda(
      [
        evento(1, "2026-10-24T09:00:00-03:00"),
        evento(2, "2026-10-25T09:00:00-03:00"),
        evento(3, "2026-10-22T09:00:00-03:00", { tipo: "compromisso" }),
      ],
      AGORA,
      { diasFuturos: 3, somentePrazos: true }
    );

    expect(alertas.map((alerta) => alerta.id)).toEqual([1]);
  });
});
