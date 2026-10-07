/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import MiniCalendar, { descreverSituacao, situacaoDoDia } from "../MiniCalendar";
import { getFeriadosDoAno } from "../../../services/api";

jest.mock("../../../services/api", () => ({
  getFeriadosDoAno: jest.fn(),
  createAgenda: jest.fn(),
  getProcessos: jest.fn(),
  normalizarLista: (dados) => dados || [],
}));

const CALENDARIO = {
  feriados: [
    { data: "2026-12-25", nome: "Natal", tipo: "nacional" },
    { data: "2026-12-02", nome: "Aniversário de Araçatuba", tipo: "local" },
  ],
  recesso: [
    { inicio: "2026-01-01", fim: "2026-01-20" },
    { inicio: "2026-12-20", fim: "2026-12-31" },
  ],
};

describe("situacaoDoDia", () => {
  test("feriado nacional dentro do recesso", () => {
    const situacao = situacaoDoDia("2026-12-25", CALENDARIO);
    expect(situacao.feriado.nome).toBe("Natal");
    expect(situacao.recesso).toBe(true);
    expect(descreverSituacao(situacao)).toEqual([
      "Feriado nacional: Natal",
      "Recesso forense: prazos processuais suspensos (CPC, art. 220)",
    ]);
  });

  test("feriado local e dia comum", () => {
    expect(descreverSituacao(situacaoDoDia("2026-12-02", CALENDARIO))).toEqual([
      "Feriado local: Aniversário de Araçatuba",
    ]);
    expect(descreverSituacao(situacaoDoDia("2026-12-03", CALENDARIO))).toEqual([]);
  });

  test("sem dados da API não marca nada", () => {
    expect(situacaoDoDia("2026-12-25", undefined)).toEqual({ feriado: null, recesso: false });
  });
});

describe("MiniCalendar", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 11, 10, 12) });
    getFeriadosDoAno.mockResolvedValue(CALENDARIO);
  });
  afterEach(() => jest.useRealTimers());

  test("marca o feriado e mostra o nome ao clicar no dia", async () => {
    await act(async () => {
      render(<MiniCalendar eventos={[]} />);
    });
    expect(getFeriadosDoAno).toHaveBeenCalledWith(2026);
    const natal = screen.getByRole("button", { name: /^25\. Feriado nacional: Natal/ });
    expect(natal.className).toMatch(/holiday/);
    expect(natal.className).toMatch(/recesso/);
    expect(screen.getByRole("button", { name: "3" }).className).not.toMatch(/holiday/);
    fireEvent.click(screen.getByRole("button", { name: /^2\. Feriado local/ }));
    expect(screen.getByText("Feriado local: Aniversário de Araçatuba")).toBeTruthy();
  });
});
