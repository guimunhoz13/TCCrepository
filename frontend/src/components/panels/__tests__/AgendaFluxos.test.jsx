/** @jest-environment jsdom */
import { montarPainel, prepararPainel, preencher, submeter, mockConfirmar, mockRefresh } from "../../../../test-support/painel";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import AgendaPanel from "../AgendaPanel";
import * as api from "@/services/api";
const evento = { id: 5, titulo: "Audiência de teste", tipo: "compromisso", descricao: "Preparação", processo: 3, data_evento: "2026-11-26T17:30:00Z", local_evento: "Sala de teste", cumprido: false };
beforeEach(() => { prepararPainel(); api.getAgenda.mockResolvedValue([evento]); api.getProcessos.mockResolvedValue([{ id: 3, numero_processo: "PROC-038", titulo: "Caso fictício" }]); });

test("calcula prazo com feriado, mostra a regra aplicada e salva a data e vínculo", async () => {
  api.calcularPrazo.mockResolvedValue({ data_final: "2026-11-17", feriados_locais: [{ data: "2026-11-12", descricao: "Feriado de teste" }] });
  await montarPainel(AgendaPanel, "agenda", "novo");
  preencher("tipo", "prazo");
  fireEvent.click(screen.getByRole("button", { name: "Calcular data final" }));
  expect(screen.getByText(/Informe a data de início/)).toBeTruthy();
  preencher("processo", "3"); preencher("data_inicio", "2026-11-10"); preencher("dias", "4");
  fireEvent.click(screen.getByRole("button", { name: "Calcular data final" }));
  await screen.findByText(/Feriado de teste/);
  expect(api.calcularPrazo).toHaveBeenCalledWith({ data_inicio: "2026-11-10", dias: 4, dias_uteis: true, processo: "3" });
  expect(document.querySelector('[name="data_evento"]').value).toBe("2026-11-17T00:00");
  preencher("titulo", "Prazo calculado"); preencher("descricao", "Revisão profissional necessária"); preencher("prioridade", "fatal");
  submeter();
  await screen.findByText("Evento agendado com sucesso.");
  expect(api.createAgenda).toHaveBeenCalledWith(expect.objectContaining({ processo: 3, prioridade: "fatal", data_evento: "2026-11-17T00:00" }));
  expect(mockRefresh).toHaveBeenCalled();
});

test("editar evento mantém o horário de Brasília e permite corrigir título", async () => {
  await montarPainel(AgendaPanel, "agenda"); await screen.findByText(evento.titulo);
  fireEvent.click(screen.getByRole("button", { name: "Editar evento" }));
  expect(document.querySelector('[name="data_evento"]').value).toBe("2026-11-26T14:30");
  preencher("titulo", "Audiência revisada"); submeter();
  await screen.findByText("Evento atualizado com sucesso.");
  expect(api.updateAgenda).toHaveBeenCalledWith(5, expect.objectContaining({ titulo: "Audiência revisada", processo: 3, data_evento: "2026-11-26T14:30" }));
});

test("falha ao calcular não apaga o formulário e falha ao salvar é apresentada", async () => {
  api.calcularPrazo.mockRejectedValue(new Error("Tribunal indisponível."));
  api.createAgenda.mockRejectedValue(new Error("Data inválida."));
  await montarPainel(AgendaPanel, "agenda", "novo");
  preencher("titulo", "Não perder este título"); preencher("tipo", "prazo"); preencher("data_inicio", "2026-11-11"); preencher("dias", "1");
  fireEvent.click(screen.getByRole("button", { name: "Calcular data final" }));
  await screen.findByText("Tribunal indisponível.");
  expect(document.querySelector('[name="titulo"]').value).toBe("Não perder este título");
  submeter(); await screen.findByText("Data inválida.");
});

test("cumprimento e exclusão cancelada mantêm controle sobre o evento", async () => {
  await montarPainel(AgendaPanel, "agenda"); await screen.findByText(evento.titulo);
  fireEvent.click(screen.getByRole("button", { name: /Marcar.*cumprido/i }));
  await waitFor(() => expect(api.updateAgenda).toHaveBeenCalledWith(5, { cumprido: true }));
  mockConfirmar.mockResolvedValue(false);
  fireEvent.click(screen.getByRole("button", { name: "acao_excluir" }));
  await waitFor(() => expect(mockConfirmar).toHaveBeenCalled());
  expect(api.deleteAgenda).not.toHaveBeenCalled();
});
