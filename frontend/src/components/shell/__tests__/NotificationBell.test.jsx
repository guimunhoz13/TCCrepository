/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import NotificationBell from "../NotificationBell";
import { selecionarAlertasAgenda } from "@/lib/alertasAgenda";

const alertas = selecionarAlertasAgenda(
  [
    {
      id: 1,
      tipo: "prazo",
      prioridade: "fatal",
      titulo: "Apresentar recurso",
      numero_processo: "0001234-56.2026.8.26.0100",
      data_evento: "2026-10-20T17:00:00-03:00",
      cumprido: false,
    },
    {
      id: 2,
      tipo: "compromisso",
      prioridade: "normal",
      titulo: "Reunião com cliente",
      data_evento: "2026-10-22T14:00:00-03:00",
      cumprido: false,
    },
  ],
  new Date("2026-10-21T10:00:00-03:00")
);

describe("NotificationBell", () => {
  test("expõe quantidade, gravidade e detalhes dos alertas", () => {
    render(<NotificationBell eventos={alertas} />);
    const botao = screen.getByRole("button", { name: /2 alertas, 1 fatal/i });
    expect(botao.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(botao);
    expect(botao.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("region", { name: /central de alertas/i })).toBeTruthy();
    expect(screen.getByText("Apresentar recurso")).toBeTruthy();
    expect(screen.getByText("Fatal")).toBeTruthy();
    expect(screen.getByText("Vencido")).toBeTruthy();
    expect(screen.getByText(/0001234-56/)).toBeTruthy();
  });

  test("fecha com Escape e devolve o foco ao sino", () => {
    render(<NotificationBell eventos={alertas} />);
    const botao = screen.getByRole("button", { name: /notificações/i });
    fireEvent.click(botao);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("region", { name: /central de alertas/i })).toBeNull();
    expect(document.activeElement).toBe(botao);
  });

  test("abre a agenda completa pelo rodapé", () => {
    const onSelect = jest.fn();
    render(<NotificationBell eventos={alertas} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /notificações/i }));
    fireEvent.click(screen.getByRole("button", { name: /abrir agenda completa/i }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
