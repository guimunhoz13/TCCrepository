/** @jest-environment jsdom */
import { prepararPainel, mockAvisar, mockConfirmar } from "../../../../test-support/painel";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AgendaSincronizar from "../AgendaSincronizar";
import * as api from "@/services/api";
beforeEach(() => { prepararPainel(); api.getAssinaturaAgenda.mockResolvedValue({ url: "" }); Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn().mockResolvedValue() } }); });

test("cria link privado, copia e permite cancelar sua substituição", async () => {
  api.gerarAssinaturaAgenda.mockResolvedValue({ url: "https://agenda.example.test/feed/segredo-ficticio" });
  render(<AgendaSincronizar />); fireEvent.click(await screen.findByRole("button", { name: "Criar link de assinatura" }));
  await screen.findByRole("textbox", { name: "Link de assinatura da agenda" }); fireEvent.click(screen.getByRole("button", { name: "Copiar link" }));
  await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://agenda.example.test/feed/segredo-ficticio"));
  mockConfirmar.mockResolvedValue(false); fireEvent.click(screen.getByRole("button", { name: "Gerar novo link" })); await waitFor(() => expect(mockConfirmar).toHaveBeenCalled()); expect(api.gerarAssinaturaAgenda).toHaveBeenCalledTimes(1);
});

test("falhas de cópia e exportação são informadas; assinatura pode ser desligada", async () => {
  api.getAssinaturaAgenda.mockResolvedValue({ url: "https://agenda.example.test/ficticio" }); api.desligarAssinaturaAgenda.mockResolvedValue({ detail: "ok" }); api.exportarAgendaICS.mockRejectedValue(new Error("Falha no download.")); navigator.clipboard.writeText.mockRejectedValue(new Error("Sem permissão."));
  render(<AgendaSincronizar />); fireEvent.click(await screen.findByRole("button", { name: "Copiar link" })); await waitFor(() => expect(mockAvisar).toHaveBeenCalledWith(expect.stringContaining("Não deu para copiar"), "erro"));
  fireEvent.click(screen.getByRole("button", { name: "Baixar agenda (.ics)" })); await waitFor(() => expect(mockAvisar).toHaveBeenCalledWith("Falha no download.", "erro"));
  fireEvent.click(screen.getByRole("button", { name: "Desligar" })); await screen.findByRole("button", { name: "Criar link de assinatura" }); expect(api.desligarAssinaturaAgenda).toHaveBeenCalled();
});
