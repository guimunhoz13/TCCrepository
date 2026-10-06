/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import ReceitaDespesas from "../ReceitaDespesas";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const serie = [
  { mes: "2026-09", recebido: "1000.00", despesas: "250.50" },
  { mes: "2026-10", recebido: "500.00", despesas: "0.00" },
];

describe("ReceitaDespesas", () => {
  test("sem movimento nos seis meses mostra o estado vazio, não um gráfico zerado", () => {
    render(<ReceitaDespesas serie={[{ mes: "2026-10", recebido: "0", despesas: "0" }]} />);
    expect(screen.getByText(/Nenhuma parcela paga ou despesa/)).toBeTruthy();
  });

  test("resume o período com recebido, despesas e saldo", () => {
    render(<ReceitaDespesas serie={serie} />);
    const resumo = document.querySelector(".grafico-resumo").textContent.replace(/\u00a0/g, " ");
    expect(resumo).toContain("R$ 1.500,00");
    expect(resumo).toContain("R$ 250,50");
    expect(resumo).toContain("R$ 1.249,50");
  });

  test("oferece a mesma informação em tabela, para quem não enxerga o gráfico", () => {
    render(<ReceitaDespesas serie={serie} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabela" }));

    const linhas = screen
      .getAllByRole("row")
      .slice(1)
      .map((linha) => linha.textContent.replace(/\u00a0/g, " "));
    expect(linhas[0]).toContain("Setembro de 2026");
    expect(linhas[0]).toContain("R$ 250,50");
    expect(linhas).toHaveLength(2);
  });
});
