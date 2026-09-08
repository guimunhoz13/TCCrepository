import { getSaudacao, getSaudacaoCompleta } from "../greeting";

describe("getSaudacao", () => {
  const casos = [
    [6, "Bom dia"],
    [11, "Bom dia"],
    [12, "Boa tarde"],
    [17, "Boa tarde"],
    [18, "Boa noite"],
    [23, "Boa noite"],
    [3, "Boa noite"],
  ];

  test.each(casos)("às %i horas retorna '%s'", (hora, esperado) => {
    jest.spyOn(Date.prototype, "getHours").mockReturnValue(hora);
    expect(getSaudacao()).toBe(esperado);
    Date.prototype.getHours.mockRestore();
  });
});

describe("getSaudacaoCompleta", () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, "getHours").mockReturnValue(9);
  });

  afterEach(() => {
    Date.prototype.getHours.mockRestore();
  });

  test("usa apenas o primeiro nome", () => {
    expect(getSaudacaoCompleta("Guilherme Rossato Munhoz")).toBe(
      "Bom dia, Guilherme"
    );
  });

  test("retorna só a saudação quando não há nome", () => {
    expect(getSaudacaoCompleta("")).toBe("Bom dia");
    expect(getSaudacaoCompleta(null)).toBe("Bom dia");
  });
});
