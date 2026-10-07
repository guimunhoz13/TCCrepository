/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import TarefasQuadro from "../TarefasQuadro";
import { AvisosProvider } from "@/contexts/AvisosContext";
import { listarTudo, updateTarefa } from "../../../services/api";

jest.mock("../../../services/api", () => ({
  getTarefas: jest.fn(),
  listarTudo: jest.fn(),
  updateTarefa: jest.fn(),
}));

const TAREFAS = [
  { id: 1, titulo: "Revisar minuta", status: "aberta", prioridade: "alta", prioridade_display: "Alta", responsavel_nome: "Ana", prazo: "2026-10-10", atrasada: false },
  { id: 2, titulo: "Ligar para a testemunha", status: "em_andamento", prioridade: "media", prioridade_display: "Média", responsavel_nome: "Lucas", prazo: null, atrasada: false },
];

async function montar(podeEditar = true) {
  listarTudo.mockResolvedValue(TAREFAS);
  await act(async () => {
    render(
      <AvisosProvider>
        <TarefasQuadro ativo podeEditar={podeEditar} />
      </AvisosProvider>
    );
  });
}

const coluna = (nome) => screen.getByRole("region", { name: nome });

describe("TarefasQuadro", () => {
  beforeEach(() => jest.clearAllMocks());

  test("distribui os cartões nas colunas com a contagem", async () => {
    await montar();
    expect(within(coluna("A fazer")).getByText("Revisar minuta")).toBeTruthy();
    expect(within(coluna("Fazendo")).getByText("Ligar para a testemunha")).toBeTruthy();
    expect(within(coluna("Concluídas")).getByText("Nada por aqui.")).toBeTruthy();
    expect(listarTudo).toHaveBeenCalledWith(expect.any(Function), { status: "quadro" });
  });

  test("a seta move o cartão na hora e grava na API", async () => {
    updateTarefa.mockResolvedValue({});
    await montar();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: 'Mover "Revisar minuta" para Fazendo' }));
    });
    expect(updateTarefa).toHaveBeenCalledWith(1, { status: "em_andamento" });
    expect(screen.getByText('"Revisar minuta" foi para Fazendo.')).toBeTruthy();
  });

  test("se a API recusa, o cartão volta e o erro aparece", async () => {
    updateTarefa.mockRejectedValue(new Error("Seu perfil de acesso não permite esta ação."));
    await montar();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: 'Mover "Revisar minuta" para Fazendo' }));
    });
    expect(within(coluna("A fazer")).getByText("Revisar minuta")).toBeTruthy();
    expect(screen.getByText("Seu perfil de acesso não permite esta ação.")).toBeTruthy();
  });

  test("sem permissão de editar, não há setas nem arrastar", async () => {
    await montar(false);
    expect(screen.queryByRole("button", { name: /Mover/ })).toBeNull();
    expect(screen.getByText("Revisar minuta").closest("li").getAttribute("draggable")).toBe("false");
  });

  test("filtro 'Só as minhas' consulta só as do usuário", async () => {
    await montar();
    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox"));
    });
    expect(listarTudo).toHaveBeenLastCalledWith(expect.any(Function), { status: "quadro", responsavel: "eu" });
  });
});
