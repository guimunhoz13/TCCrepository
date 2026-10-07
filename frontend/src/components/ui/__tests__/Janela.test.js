/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import Janela from "../Janela";

describe("Janela", () => {
  test("é um diálogo com título e recebe o foco ao abrir", () => {
    render(
      <Janela titulo="Cobrar com PIX" onFechar={() => {}}>
        <p>conteúdo</p>
      </Janela>
    );
    const dialogo = screen.getByRole("dialog", { name: "Cobrar com PIX" });
    expect(dialogo.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement).toBe(dialogo);
    expect(screen.getByText("conteúdo")).toBeTruthy();
  });

  test("fecha no Esc, no X e no fundo", () => {
    const onFechar = jest.fn();
    const { container } = render(<Janela titulo="T" onFechar={onFechar}>x</Janela>);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    fireEvent.click(container.querySelector(".confirmacao-fundo"));
    expect(onFechar).toHaveBeenCalledTimes(3);
  });

  test("devolve o foco a quem abriu", () => {
    const botao = document.createElement("button");
    document.body.appendChild(botao);
    botao.focus();
    const { unmount } = render(<Janela titulo="T" onFechar={() => {}}>x</Janela>);
    expect(document.activeElement).not.toBe(botao);
    unmount();
    expect(document.activeElement).toBe(botao);
    botao.remove();
  });
});
