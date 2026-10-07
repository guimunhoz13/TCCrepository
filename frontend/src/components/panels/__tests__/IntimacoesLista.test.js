import { descreverPrazo } from "../IntimacoesLista";

describe("descreverPrazo", () => {
  test("mostra dias, tipo e vencimento", () => {
    expect(
      descreverPrazo({ prazo_final: "2026-10-27", prazo_dias: 15, prazo_dias_uteis: true, prazo_estimado: false })
    ).toBe("15 dias úteis · vence 27/10/2026");
  });

  test("avisa quando o prazo foi estimado", () => {
    expect(
      descreverPrazo({ prazo_final: "2026-10-13", prazo_dias: 5, prazo_dias_uteis: true, prazo_estimado: true })
    ).toMatch(/estimado — confira/);
  });

  test("sem prazo, nada", () => {
    expect(descreverPrazo({ prazo_final: null })).toBeNull();
  });
});
