/**
 * @jest-environment jsdom
 */
import { act, render, screen, within } from "@testing-library/react";
import CartoesDePlanos, { precoDoPlano } from "../CartoesDePlanos";
import PlanosPanel from "../../panels/PlanosPanel";
import { getPlanoAtual, getPlanos } from "../../../services/api";

jest.mock("../../../services/api", () => ({
  getPlanos: jest.fn(),
  getPlanoAtual: jest.fn(),
  normalizarLista: (dados) => dados,
}));

jest.mock("../../../contexts/PanelContext", () => ({
  PANELS: { PLANOS: "planos" },
  usePanel: () => ({ activePanel: "planos" }),
}));

jest.mock("../../shell/OverlayPanel", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

const PLANOS = [
  { id: "gratuito", nome: "Gratuito", preco_mensal: 0, descricao: "Para começar.", vantagens: ["Até 3 usuários"] },
  { id: "basico", nome: "Básico", preco_mensal: 79, descricao: "Para crescer.", vantagens: ["Intimações do DJEN"] },
  { id: "profissional", nome: "Profissional", preco_mensal: 199, descricao: "Sem limites.", vantagens: ["Assistente de IA"] },
];

const SITUACAO = {
  plano: "gratuito", nome: "Gratuito", plano_contratado: "gratuito", validade: null, vencido: false,
  limites: { usuarios: 3, processos_ativos: 30 }, uso: { usuarios: 3, processos_ativos: 12 }, recursos: [],
};

describe("precoDoPlano", () => {
  test("o plano sem preço aparece como grátis", () => {
    expect(precoDoPlano(PLANOS[0])).toEqual({ valor: "Grátis", periodo: "para sempre" });
    expect(precoDoPlano(PLANOS[1])).toEqual({ valor: "R$ 79", periodo: "/mês" });
  });
});

describe("CartoesDePlanos", () => {
  test("na página inicial destaca o primeiro plano pago e mostra todos", () => {
    render(<CartoesDePlanos planos={PLANOS} acao={() => null} />);
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("article", { name: "Plano Gratuito" }).textContent).toMatch(/Grátis/);
    expect(screen.getByRole("article", { name: "Plano Básico" }).className).toMatch(/featured/);
  });
});

describe("PlanosPanel", () => {
  async function montar(situacao = SITUACAO, contato = "vendas@lexoffice.app") {
    getPlanos.mockResolvedValue({ planos: PLANOS, contato_comercial: contato });
    getPlanoAtual.mockResolvedValue(situacao);
    await act(async () => {
      render(<PlanosPanel />);
    });
  }

  beforeEach(() => jest.clearAllMocks());

  test("mostra o plano atual e o uso dos limites", async () => {
    await montar();
    expect(screen.getByText(/está no plano Gratuito/)).toBeTruthy();
    expect(screen.getByText("3 de 3")).toBeTruthy();
    expect(screen.getByText("12 de 30")).toBeTruthy();
    const atual = screen.getByRole("article", { name: "Plano Gratuito" });
    expect(within(atual).getByText("Plano atual")).toBeTruthy();
  });

  test("os planos acima do atual levam ao contato comercial", async () => {
    await montar();
    const link = screen.getByRole("link", { name: "Quero o plano Profissional" });
    expect(link.getAttribute("href")).toMatch(/^mailto:vendas@lexoffice\.app\?subject=/);
    expect(within(screen.getByRole("article", { name: "Plano Gratuito" })).queryByRole("link")).toBeNull();
  });

  test("sem contato comercial orienta a falar com o administrador", async () => {
    await montar(SITUACAO, "");
    expect(screen.queryByRole("link", { name: /Quero o plano/ })).toBeNull();
    expect(screen.getAllByText(/fale com o administrador da plataforma/)).toHaveLength(2);
  });

  test("avisa quando o plano pago venceu", async () => {
    await montar({ ...SITUACAO, plano_contratado: "profissional", validade: "2026-09-30", vencido: true });
    expect(screen.getByRole("status").textContent).toMatch(/Profissional venceu em 30\/09\/2026/);
  });

  test("plano ilimitado não mostra barra", async () => {
    await montar({
      ...SITUACAO, plano: "profissional", nome: "Profissional",
      limites: { usuarios: null, processos_ativos: null },
    });
    expect(screen.queryAllByRole("meter")).toHaveLength(0);
    expect(screen.getByText("3 (ilimitado)")).toBeTruthy();
  });
});
