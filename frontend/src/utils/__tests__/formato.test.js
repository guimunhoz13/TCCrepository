import { formatarMoeda, formatarHoras } from "../formato";

describe("formatarMoeda", () => {
  test("formata número e texto no padrão brasileiro", () => {
    expect(formatarMoeda(1234.5).replace(/ /g, " ")).toBe("R$ 1.234,50");
    expect(formatarMoeda("1234.50").replace(/ /g, " ")).toBe("R$ 1.234,50");
  });

  test("zero é um valor, não uma ausência", () => {
    expect(formatarMoeda(0).replace(/ /g, " ")).toBe("R$ 0,00");
  });

  test("devolve travessão quando não há valor", () => {
    expect(formatarMoeda(null)).toBe("—");
    expect(formatarMoeda(undefined)).toBe("—");
    expect(formatarMoeda("")).toBe("—");
    expect(formatarMoeda("abc")).toBe("—");
  });
});

describe("formatarHoras", () => {
  test("converte minutos em horas e minutos", () => {
    expect(formatarHoras(150)).toBe("2h30");
    expect(formatarHoras(60)).toBe("1h00");
    expect(formatarHoras(5)).toBe("0h05");
  });

  test("trata ausência de valor como zero", () => {
    expect(formatarHoras(null)).toBe("0h00");
    expect(formatarHoras(undefined)).toBe("0h00");
  });
});
import { dataLocalISO } from "../formato";

test("data de formulário usa o dia local na virada UTC", () => {
  expect(dataLocalISO(new Date("2026-10-28T00:30:00Z"))).toBe("2026-10-27");
  expect(dataLocalISO(new Date("2027-01-01T01:00:00Z"))).toBe("2026-12-31");
});
