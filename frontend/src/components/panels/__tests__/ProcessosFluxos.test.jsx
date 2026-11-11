/** @jest-environment jsdom */
import { montarPainel, prepararPainel, preencher, submeter, mockConfirmar } from "../../../../test-support/painel";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import ProcessosPanel from "../ProcessosPanel";
import * as api from "@/services/api";
const processo = { id: 3, numero_processo: "PROC-038", titulo: "Processo de teste", cliente: 7, cliente_nome: "Cliente de teste", advogado: 2, advogado_nome: "Advogado de teste", status: "Em andamento", sigiloso: true, proximo_prazo: { atrasado: true, data_evento: "2026-11-01T12:00:00Z" } };
beforeEach(() => { prepararPainel(); api.getProcessos.mockResolvedValue([processo]); api.getClientes.mockResolvedValue([{ id: 7, nome: "Cliente de teste" }]); api.getAdvogados.mockResolvedValue([{ id: 2, nome: "Advogado de teste" }]); });

test("cadastra processo com vínculos numéricos e mostra validações sem perder o título", async () => {
  api.createProcesso.mockRejectedValueOnce(Object.assign(new Error("Confira o número."), { campos: { numero_processo: "Número duplicado." } }));
  await montarPainel(ProcessosPanel, "processos", "novo");
  preencher("numero_processo", "PROC-038"); preencher("titulo", "Caso novo de teste"); preencher("cliente", "7"); preencher("advogado", "2");
  submeter(); await screen.findByText("Confira o número."); expect(screen.getByText("Número duplicado.")).toBeTruthy();
  expect(document.querySelector('[name="titulo"]').value).toBe("Caso novo de teste");
  preencher("numero_processo", "PROC-039"); submeter(); await screen.findByText("Processo cadastrado com sucesso.");
  expect(api.createProcesso).toHaveBeenLastCalledWith(expect.objectContaining({ cliente: 7, advogado: 2, data_inicio: null, valor_causa: null, numero_processo: "PROC-039" }));
});

test("consulta DataJud mostra importações e trata indisponibilidade sem fabricar retorno", async () => {
  api.consultarDataJud.mockResolvedValueOnce({ movimentacoes_importadas: 2, movimentacoes_ignoradas: 1, capa: { orgao_julgador: "Vara de teste" } }).mockRejectedValueOnce(new Error("DataJud indisponível."));
  await montarPainel(ProcessosPanel, "processos"); await screen.findByText(processo.titulo);
  expect(screen.getByText("Sigiloso")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Consultar andamentos no DataJud" }));
  await screen.findByText(/2 andamento\(s\) importado/);
  fireEvent.click(screen.getByRole("button", { name: "Consultar andamentos no DataJud" }));
  await screen.findByText("DataJud indisponível.");
});

test("salva filtros, limpa a consulta e cancela exclusão", async () => {
  await montarPainel(ProcessosPanel, "processos"); await screen.findByText(processo.titulo);
  fireEvent.change(screen.getByRole("combobox", { name: "Filtrar por status" }), { target: { value: "Suspenso" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar filtro" }));
  expect(JSON.parse(localStorage.getItem("lexnexo:filtro-processos")).status).toBe("Suspenso");
  fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
  await waitFor(() => expect(api.getProcessos).toHaveBeenLastCalledWith(expect.objectContaining({ status: "" })));
  mockConfirmar.mockResolvedValue(false); fireEvent.click(screen.getByRole("button", { name: "acao_excluir" }));
  await waitFor(() => expect(mockConfirmar).toHaveBeenCalled()); expect(api.deleteProcesso).not.toHaveBeenCalled();
});

test("falha ao alternar status aparece na tela e permite nova tentativa", async () => {
  api.updateProcesso.mockRejectedValueOnce(new Error("Não foi possível alterar o status."));
  await montarPainel(ProcessosPanel, "processos"); await screen.findByText(processo.titulo);
  fireEvent.click(screen.getByRole("button", { name: "acao_alternar_status" }));
  await screen.findByText("Não foi possível alterar o status.");
  fireEvent.click(screen.getByRole("button", { name: "acao_alternar_status" }));
  await waitFor(() => expect(api.updateProcesso).toHaveBeenCalledTimes(2));
});
