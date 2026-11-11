/** @jest-environment jsdom */
import { montarPainel, prepararPainel, preencher, submeter, mockConfirmar, mockAvisar } from "../../../../test-support/painel";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import HorasPanel from "../HorasPanel";
import * as api from "@/services/api";
const hora = { id: 4, data: "2026-11-11", minutos: 90, valor: "180.00", faturavel: true, descricao: "Revisão de minuta", numero_processo: "PROC-038", usuario_nome: "Pessoa de teste" };
const despesa = { id: 6, data: "2026-11-11", tipo_display: "Custas", descricao: "Cópias de teste", valor: "23.47", reembolsavel: true, reembolsada: false };
beforeEach(() => { prepararPainel(); api.getApontamentos.mockResolvedValue([hora]); api.getDespesas.mockResolvedValue([despesa]); api.getProcessos.mockResolvedValue([{ id: 3, numero_processo: "PROC-038" }]); api.getTempoDeUso.mockResolvedValue({ usuarios: [{ id: 1, nome: "Pessoa de teste", minutos: 20 }] }); });

test("apontamento converte horas e minutos e rejeita tempo zero", async () => {
  await montarPainel(HorasPanel, "horas", "nova-hora"); submeter();
  expect(screen.getByText("Informe quanto tempo foi trabalhado.")).toBeTruthy(); expect(api.createApontamento).not.toHaveBeenCalled();
  preencher("processo", "3"); preencher("horas", "1"); preencher("minutos", "30"); preencher("valor_hora", "120"); preencher("descricao", "Revisão de teste");
  submeter();
  await waitFor(() => expect(api.createApontamento).toHaveBeenCalledWith(expect.objectContaining({ processo: "3", minutos: 90, valor_hora: "120", faturavel: true })));
  expect(await screen.findByText("Revisão de minuta")).toBeTruthy();
  expect(screen.getAllByText("1h30")).toHaveLength(2);
});

test("erro no apontamento preserva os dados digitados", async () => {
  api.createApontamento.mockRejectedValue(new Error("Lançamento recusado."));
  await montarPainel(HorasPanel, "horas", "nova-hora"); preencher("minutos", "25"); preencher("descricao", "Trabalho não perdido"); preencher("faturavel", "nao"); submeter();
  await screen.findByText("Lançamento recusado.");
  expect(document.querySelector('[name="descricao"]').value).toBe("Trabalho não perdido");
  expect(api.createApontamento.mock.calls[0][0].faturavel).toBe(false);
});

test("lança despesa e mostra total e reembolso pendente", async () => {
  await montarPainel(HorasPanel, "horas", "nova-despesa"); preencher("processo", "3"); preencher("valor", "23.47"); preencher("descricao", "Cópias de teste"); preencher("tipo", "copias"); submeter();
  await waitFor(() => expect(api.createDespesa).toHaveBeenCalledWith(expect.objectContaining({ processo: "3", valor: "23.47", tipo: "copias" })));
  await screen.findByText("Cópias de teste"); expect(screen.getByText("A reembolsar")).toBeTruthy();
});

test("falha no reembolso aparece na tela e permite nova tentativa", async () => {
  api.updateDespesa.mockRejectedValueOnce(new Error("Não foi possível marcar o reembolso."));
  await montarPainel(HorasPanel, "horas", "despesas"); await screen.findByText("Cópias de teste");
  fireEvent.click(screen.getByRole("button", { name: "Marcar como reembolsada" }));
  await screen.findByText("Não foi possível marcar o reembolso.");
  fireEvent.click(screen.getByRole("button", { name: "Marcar como reembolsada" }));
  await waitFor(() => expect(api.updateDespesa).toHaveBeenCalledTimes(2));
});

test("exclusão de horas exige confirmação e relata recusa do servidor", async () => {
  await montarPainel(HorasPanel, "horas"); await screen.findByText("Revisão de minuta");
  mockConfirmar.mockResolvedValueOnce(false); fireEvent.click(screen.getByRole("button", { name: "acao_excluir" }));
  await waitFor(() => expect(mockConfirmar).toHaveBeenCalled()); expect(api.deleteApontamento).not.toHaveBeenCalled();
  api.deleteApontamento.mockRejectedValueOnce(new Error("Sem permissão.")); fireEvent.click(screen.getByRole("button", { name: "acao_excluir" }));
  await waitFor(() => expect(mockAvisar).toHaveBeenCalledWith("Sem permissão.", "erro"));
});
