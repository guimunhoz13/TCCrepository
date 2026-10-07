/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import ResumoParaCliente from "../ResumoParaCliente";
import { AvisosProvider } from "@/contexts/AvisosContext";
import { gerarResumoParaCliente } from "../../../services/api";
import { abrirWhatsApp } from "../../../utils/whatsapp";

jest.mock("../../../services/api", () => ({ gerarResumoParaCliente: jest.fn() }));
jest.mock("../../../utils/whatsapp", () => ({ abrirWhatsApp: jest.fn() }));

async function montar(resumo) {
  gerarResumoParaCliente.mockResolvedValue(resumo);
  await act(async () => {
    render(
      <AvisosProvider>
        <ResumoParaCliente processoId={7} onFechar={() => {}} />
      </AvisosProvider>
    );
  });
}

describe("ResumoParaCliente", () => {
  beforeEach(() => jest.clearAllMocks());

  test("mostra o texto, diz de onde veio e envia a versão editada", async () => {
    await montar({ texto: "Olá, Maria!", fonte: "modelo", andamentos: 2, cliente_telefone: "18999990000", cliente_nome: "Maria" });
    expect(gerarResumoParaCliente).toHaveBeenCalledWith(7);
    expect(screen.getByText(/Modelo automático com 2 andamentos recentes/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Mensagem para o cliente"), { target: { value: "Olá, Maria! Revisado." } });
    fireEvent.click(screen.getByRole("button", { name: /Enviar pelo WhatsApp/ }));
    expect(abrirWhatsApp).toHaveBeenCalledWith("18999990000", "Olá, Maria! Revisado.");
  });

  test("sem telefone, não oferece WhatsApp e explica", async () => {
    await montar({ texto: "Oi", fonte: "ia", andamentos: 1, cliente_telefone: "", cliente_nome: "Roberto" });
    expect(screen.queryByRole("button", { name: /WhatsApp/ })).toBeNull();
    expect(screen.getByText(/Roberto não tem telefone cadastrado/)).toBeTruthy();
    expect(screen.getByText(/Escrito pela IA a partir de 1 andamento recente/)).toBeTruthy();
  });

  test("gerar de novo pede outro texto à API", async () => {
    await montar({ texto: "1", fonte: "modelo", andamentos: 0, cliente_telefone: "", cliente_nome: "X" });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Gerar de novo/ }));
    });
    expect(gerarResumoParaCliente).toHaveBeenCalledTimes(2);
  });
});
