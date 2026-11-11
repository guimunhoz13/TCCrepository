/** @jest-environment jsdom */
import { prepararPainel } from "../../../../test-support/painel";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AssistenteChat from "../AssistenteChat";
import * as api from "@/services/api";
beforeEach(() => prepararPainel());

test("mensagem vazia não envia; resposta mantém histórico sem incluir a saudação", async () => {
  api.enviarMensagemIA.mockResolvedValueOnce({ resposta: "Resposta contextual fictícia." }).mockResolvedValueOnce({ resposta: "Segunda resposta de teste." });
  render(<AssistenteChat />); fireEvent.submit(document.querySelector("form")); expect(api.enviarMensagemIA).not.toHaveBeenCalled();
  const campo = screen.getByRole("textbox", { name: "Pergunta para o assistente" });
  fireEvent.change(campo, { target: { value: "  Resuma o caso fictício  " } }); fireEvent.keyDown(campo, { key: "Enter" }); await screen.findByText("Resposta contextual fictícia.");
  expect(api.enviarMensagemIA).toHaveBeenCalledWith({ mensagem: "Resuma o caso fictício", historico: [], contexto: {} });
  fireEvent.change(campo, { target: { value: "Quais são os próximos passos?" } }); fireEvent.click(screen.getByRole("button", { name: "Enviar" })); await screen.findByText("Segunda resposta de teste.");
  expect(api.enviarMensagemIA.mock.calls[1][0].historico).toEqual([{ role: "user", content: "Resuma o caso fictício" }, { role: "assistant", content: "Resposta contextual fictícia." }]);
});

test("envio pendente bloqueia repetição e falha devolve foco sem fabricar resposta", async () => {
  let recusar; api.enviarMensagemIA.mockReturnValue(new Promise((_, reject) => { recusar = reject; }));
  render(<AssistenteChat />); const campo = screen.getByRole("textbox", { name: "Pergunta para o assistente" }); fireEvent.change(campo, { target: { value: "Pergunta fictícia" } }); fireEvent.submit(document.querySelector("form"));
  expect(campo.disabled).toBe(true); expect(screen.getByRole("button", { name: "Enviar" }).disabled).toBe(true);
  await act(async () => recusar(new Error("IA temporariamente indisponível."))); await screen.findByText("IA temporariamente indisponível.");
  expect(campo.disabled).toBe(false); expect(document.activeElement).toBe(campo); expect(api.enviarMensagemIA).toHaveBeenCalledTimes(1);
});
