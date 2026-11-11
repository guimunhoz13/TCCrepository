/** @jest-environment jsdom */
import { montarPainel, prepararPainel, preencher, submeter, mockConfirmar } from "../../../../test-support/painel";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import TarefasPanel from "../TarefasPanel";
import * as api from "@/services/api";
const tarefa = { id: 8, titulo: "Revisar contestação", status: "aberta", status_display: "Aberta", prioridade: "alta", prioridade_display: "Alta", prazo: "2026-11-20", responsavel_nome: "Pessoa de teste", atrasada: true };
beforeEach(() => { prepararPainel(); api.getTarefas.mockResolvedValue([tarefa]); api.getUsuarios.mockResolvedValue([{ id: 1, nome: "Pessoa de teste", ativo: true }, { id: 2, nome: "Pessoa inativa", ativo: false }]); });

test("filtros distinguem minhas tarefas, escritório e histórico", async () => {
  await montarPainel(TarefasPanel, "tarefas"); await screen.findByText(tarefa.titulo);
  expect(api.getTarefas).toHaveBeenCalledWith({ responsavel: "eu", status: "abertas", page: 1 });
  fireEvent.click(screen.getByRole("button", { name: "Do escritório" }));
  await waitFor(() => expect(api.getTarefas).toHaveBeenCalledWith({ status: "abertas", page: 1 }));
  fireEvent.click(screen.getByRole("button", { name: "Histórico" }));
  await waitFor(() => expect(api.getTarefas).toHaveBeenCalledWith({ page: 1 }));
});

test("cria tarefa sem processo ou prazo e oferece só responsáveis ativos", async () => {
  await montarPainel(TarefasPanel, "tarefas", "nova");
  expect(screen.queryByRole("option", { name: "Pessoa inativa" })).toBeNull();
  preencher("titulo", "Próximo passo de teste"); preencher("responsavel", "1"); preencher("prioridade", "alta"); preencher("descricao", "Revisar as evidências"); submeter();
  await screen.findByText(tarefa.titulo);
  expect(api.createTarefa).toHaveBeenCalledWith(expect.objectContaining({ titulo: "Próximo passo de teste", processo: null, prazo: null, responsavel: "1", prioridade: "alta" }));
  expect(api.excluirRascunho).toHaveBeenCalledWith("nova-tarefa");
});

test("erro no cadastro preserva o título e erro na conclusão fica visível", async () => {
  api.createTarefa.mockRejectedValue(new Error("Responsável inválido."));
  await montarPainel(TarefasPanel, "tarefas", "nova"); preencher("titulo", "Preservar tarefa"); submeter();
  await screen.findByText("Responsável inválido."); expect(document.querySelector('[name="titulo"]').value).toBe("Preservar tarefa");
  fireEvent.click(screen.getByRole("button", { name: "Minhas tarefas" })); await screen.findByText(tarefa.titulo);
  api.updateTarefa.mockRejectedValueOnce(new Error("Conclusão recusada.")); fireEvent.click(screen.getByRole("button", { name: "Concluir tarefa" }));
  await screen.findByText("Conclusão recusada.");
  fireEvent.click(screen.getByRole("button", { name: "Marcar como em andamento" }));
  await waitFor(() => expect(api.updateTarefa).toHaveBeenCalledWith(8, { status: "em_andamento" }));
});

test("cancelar exclusão mantém a tarefa e uma tarefa concluída pode ser reaberta", async () => {
  api.getTarefas.mockResolvedValue([{ ...tarefa, status: "concluida", status_display: "Concluída", prazo: null }]);
  await montarPainel(TarefasPanel, "tarefas", "historico"); await screen.findByText(tarefa.titulo);
  mockConfirmar.mockResolvedValue(false); fireEvent.click(screen.getByRole("button", { name: "acao_excluir" }));
  await waitFor(() => expect(mockConfirmar).toHaveBeenCalled()); expect(api.deleteTarefa).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Reabrir tarefa" }));
  await waitFor(() => expect(api.updateTarefa).toHaveBeenCalledWith(8, { status: "aberta" }));
});
