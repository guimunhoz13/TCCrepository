/** @jest-environment jsdom */
import { montarPainel, prepararPainel, preencher, submeter, mockConfirmar } from "../../../../test-support/painel";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import ModelosPanel from "../ModelosPanel";
import * as api from "@/services/api";
const modelo = { id: 2, nome: "Declaração de teste", tipo: "declaracao", tipo_display: "Declaração", conteudo: "Olá {{cliente.nome}}", atualizado_em: "2026-11-11T12:00:00Z" };
beforeEach(() => { prepararPainel(); api.getModelosDocumento.mockResolvedValue([modelo]); api.getClientes.mockResolvedValue([{ id: 7, nome: "Pessoa fictícia" }]); api.getProcessos.mockResolvedValue([{ id: 3, numero_processo: "PROC-038", titulo: "Caso fictício" }]); api.getVariaveisDocumento.mockResolvedValue([{ chave: "cliente.nome", descricao: "Nome do cliente" }]); });

test("cria modelo com exemplo e edita um modelo existente", async () => {
  await montarPainel(ModelosPanel, "modelos", "novo"); fireEvent.click(screen.getByRole("button", { name: "Usar exemplo de procuração" }));
  submeter(); await waitFor(() => expect(api.createModeloDocumento).toHaveBeenCalledWith(expect.objectContaining({ tipo: "procuracao", conteudo: expect.stringContaining("{{cliente.nome}}") })));
  await screen.findByText(modelo.nome); fireEvent.click(screen.getByRole("button", { name: "acao_editar" }));
  preencher("nome", "Modelo revisado"); submeter();
  await waitFor(() => expect(api.updateModeloDocumento).toHaveBeenCalledWith(2, expect.objectContaining({ nome: "Modelo revisado" })));
});

test("geração exige uma origem e imprime texto literal, sem executar HTML do modelo", async () => {
  const conteudo = '<script>alert("teste")</script> Texto fictício';
  api.gerarDocumento.mockResolvedValue({ nome: "Documento de teste", conteudo, variaveis_vazias: ["cliente.rg"], variaveis_desconhecidas: ["campo.inexistente"] });
  const janela = { document: document.implementation.createHTMLDocument(""), focus: jest.fn(), print: jest.fn() };
  janela.document.close = jest.fn(); jest.spyOn(window, "open").mockReturnValue(janela);
  await montarPainel(ModelosPanel, "modelos", "gerar"); preencher("modelo", "2"); preencher("processo", "3"); submeter();
  await screen.findByText(conteudo); expect(api.gerarDocumento).toHaveBeenCalledWith("2", { processo: "3", cliente: null });
  expect(screen.getByText(/cliente.rg/)).toBeTruthy(); expect(screen.getByText(/campo.inexistente/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Imprimir / Salvar em PDF" }));
  expect(janela.document.querySelector("pre").textContent).toBe(conteudo); expect(janela.document.querySelector("script")).toBeNull(); expect(janela.print).toHaveBeenCalled();
  preencher("origem", "cliente"); expect(document.querySelector('[name="cliente"]').value).toBe(""); preencher("cliente", "7"); submeter();
  await waitFor(() => expect(api.gerarDocumento).toHaveBeenLastCalledWith("2", { processo: null, cliente: "7" }));
  window.open.mockRestore();
});

test("erro na geração aparece e exclusão só acontece após confirmação", async () => {
  api.gerarDocumento.mockRejectedValue(new Error("Origem incompatível."));
  await montarPainel(ModelosPanel, "modelos", "gerar"); submeter(); await screen.findByText("Origem incompatível.");
  fireEvent.click(screen.getByRole("button", { name: "Modelos" })); await screen.findByText(modelo.nome);
  mockConfirmar.mockResolvedValueOnce(false); fireEvent.click(screen.getByRole("button", { name: "acao_excluir" }));
  await waitFor(() => expect(mockConfirmar).toHaveBeenCalled()); expect(api.deleteModeloDocumento).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "acao_excluir" })); await waitFor(() => expect(api.deleteModeloDocumento).toHaveBeenCalledWith(2));
});
