/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import IntimacoesLista from "../IntimacoesLista";
import { AvisosProvider } from "@/contexts/AvisosContext";
import { PanelProvider } from "@/contexts/PanelContext";
import { buscarIntimacoesNoDjen, getIntimacoes, marcarIntimacaoComoLida } from "../../../services/api";

jest.mock("../../../services/api", () => ({
  getIntimacoes: jest.fn(),
  buscarIntimacoesNoDjen: jest.fn(),
  marcarIntimacaoComoLida: jest.fn(),
  normalizarLista: (dados) => (Array.isArray(dados) ? dados : dados?.results || []),
}));

const LONGO = "Vistos. ".repeat(60) + "Manifeste-se no prazo de 15 dias.";
const INTIMACAO = {
  id: 9, tipo_comunicacao: "Intimação", tribunal: "TJSP", orgao: "1ª Vara Cível", processo: 3,
  numero_processo: "0001234-56.2026.8.26.0100", cliente_nome: "Maria", advogado_nome: "Ana",
  data_publicacao: "2026-10-06", prazo_dias: 5, prazo_dias_uteis: true, prazo_estimado: true,
  prazo_final: "2026-10-13", texto: LONGO, link: "https://comunica.pje.jus.br/", lida: false,
};

async function montar(podeEditar = true) {
  getIntimacoes.mockResolvedValue({ count: 1, next: null, results: [INTIMACAO] });
  await act(async () => {
    render(
      <PanelProvider>
        <AvisosProvider>
          <IntimacoesLista ativo podeEditar={podeEditar} />
        </AvisosProvider>
      </PanelProvider>
    );
  });
}

describe("IntimacoesLista", () => {
  beforeEach(() => jest.clearAllMocks());

  test("mostra só as não lidas por padrão, com o prazo estimado sinalizado", async () => {
    await montar();
    expect(getIntimacoes).toHaveBeenCalledWith({ page: 1, lida: "false" });
    expect(screen.getByText(/5 dias úteis · vence 13\/10\/2026 \(estimado — confira\)/)).toBeTruthy();
    expect(screen.getByText("Nova")).toBeTruthy();
  });

  test("texto longo abre com 'Ler tudo'", async () => {
    await montar();
    expect(screen.queryByText(/Manifeste-se no prazo/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ler tudo" }));
    expect(screen.getByText(/Manifeste-se no prazo/)).toBeTruthy();
  });

  test("buscar no DJEN avisa o resultado e marcar como lida grava", async () => {
    buscarIntimacoesNoDjen.mockResolvedValue({ detail: "2 intimações novas." });
    marcarIntimacaoComoLida.mockResolvedValue({});
    await montar();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Buscar no DJEN/ }));
    });
    expect(screen.getByText("2 intimações novas.")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Marcar como lida/ }));
    });
    expect(marcarIntimacaoComoLida).toHaveBeenCalledWith(9);
  });

  test("quem só consulta não busca nem marca como lida", async () => {
    await montar(false);
    expect(screen.queryByRole("button", { name: /Buscar no DJEN/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Marcar como lida/ })).toBeNull();
  });
});
