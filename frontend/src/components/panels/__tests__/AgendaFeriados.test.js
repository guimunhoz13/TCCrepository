/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import AgendaFeriados, { descreverData } from "../AgendaFeriados";
import { AvisosProvider } from "@/contexts/AvisosContext";
import { ConfirmacaoProvider } from "@/contexts/ConfirmacaoContext";
import { criarFeriadoLocal, getFeriadosLocais } from "../../../services/api";

jest.mock("../../../services/api", () => ({
  getFeriadosLocais: jest.fn(),
  criarFeriadoLocal: jest.fn(),
  excluirFeriadoLocal: jest.fn(),
  normalizarLista: (dados) => (Array.isArray(dados) ? dados : dados?.results || []),
}));

let permissoes = { criar: true, excluir: true };
jest.mock("../../../hooks/usePermissoes", () => ({
  usePermissoes: () => (_area, acao) => Boolean(permissoes[acao]),
}));

const NOVE_DE_JULHO = { id: 1, data: "2026-07-09", descricao: "Revolução Constitucionalista", abrangencia: "TJSP", anual: true };

async function montar(feriados = [NOVE_DE_JULHO]) {
  getFeriadosLocais.mockResolvedValue(feriados);
  await act(async () => {
    render(
      <AvisosProvider>
        <ConfirmacaoProvider>
          <AgendaFeriados />
        </ConfirmacaoProvider>
      </AvisosProvider>
    );
  });
}

describe("descreverData", () => {
  test("feriado anual mostra só dia e mês", () => {
    expect(descreverData(NOVE_DE_JULHO)).toBe("09/07 (todo ano)");
    expect(descreverData({ ...NOVE_DE_JULHO, anual: false })).toBe("09/07/2026");
  });
});

describe("AgendaFeriados", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    permissoes = { criar: true, excluir: true };
  });

  test("lista os feriados cadastrados", async () => {
    await montar();
    expect(screen.getByText("Revolução Constitucionalista")).toBeTruthy();
    expect(screen.getByText("09/07 (todo ano)")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Excluir o feriado/ })).toBeTruthy();
  });

  test("sem feriados, avisa", async () => {
    await montar([]);
    expect(screen.getByText("Nenhum feriado local cadastrado.")).toBeTruthy();
  });

  test("cadastra um feriado novo e recarrega", async () => {
    criarFeriadoLocal.mockResolvedValue({ id: 2 });
    await montar([]);
    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2026-12-02" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Aniversário da cidade" } });
    fireEvent.click(screen.getByLabelText("Repete todo ano"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cadastrar feriado" }));
    });
    expect(criarFeriadoLocal).toHaveBeenCalledWith({
      data: "2026-12-02", descricao: "Aniversário da cidade", abrangencia: "", anual: true,
    });
    expect(getFeriadosLocais).toHaveBeenCalledTimes(2);
  });

  test("perfil que só consulta não vê o formulário nem o excluir", async () => {
    permissoes = {};
    await montar();
    expect(screen.queryByRole("form", { name: "Novo feriado local" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Excluir o feriado/ })).toBeNull();
  });
});
