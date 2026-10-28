/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import FichaProcesso from "../FichaProcesso";
import { useRecurso } from "@/hooks/useRecurso";
import { usePermissoes } from "@/hooks/usePermissoes";

jest.mock("@/hooks/useRecurso", () => ({ useRecurso: jest.fn() }));
jest.mock("@/hooks/usePermissoes", () => ({ usePermissoes: jest.fn() }));
jest.mock("@/contexts/ConfirmacaoContext", () => ({ useConfirmacao: () => jest.fn() }));

function montar(areas, resumo = {}) {
  usePermissoes.mockReturnValue((area) => areas.includes(area));
  useRecurso.mockReturnValue({ dados: {
    processo: { id: 1, numero_processo: "AUDIT-1", titulo: "Processo fictício" },
    movimentacoes: [], documentos: [], agenda: [], tarefas: [], apontamentos: [],
    despesas: [], contrato: null, resumo,
  }, carregando: false, erro: "", recarregar: jest.fn() });
  render(<FichaProcesso processoId={1} onVoltar={jest.fn()} />);
}

test("secretaria abre a ficha com resumo nulo e sem blocos não autorizados", () => {
  montar(["processos", "agenda", "documentos", "tarefas"], null);
  expect(screen.getByText("Processo fictício")).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Resumo financeiro" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Contrato" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Apontamentos de horas" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Despesas" })).toBeNull();
});

test("estagiario vê horas e despesas permitidas sem contrato nem resumo financeiro", () => {
  montar(["processos", "horas", "despesas"], null);
  expect(screen.getByRole("heading", { name: "Apontamentos de horas" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Despesas" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Contrato" })).toBeNull();
});

test("administrador continua vendo o resumo e o contrato", () => {
  montar(["processos", "financeiro", "horas", "despesas"]);
  expect(screen.getByRole("heading", { name: "Resumo financeiro" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Contrato" })).toBeTruthy();
});
