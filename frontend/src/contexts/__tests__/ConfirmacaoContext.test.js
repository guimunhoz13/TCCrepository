/**
 * @jest-environment jsdom
 */
import { useEffect } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ConfirmacaoProvider, useConfirmacao } from "../ConfirmacaoContext";

const capturado = { confirmar: null };
const confirmar = (opcoes) => capturado.confirmar(opcoes);

function Captura() {
  const funcao = useConfirmacao();
  useEffect(() => {
    capturado.confirmar = funcao;
  }, [funcao]);
  return null;
}

function montar() {
  render(
    <ConfirmacaoProvider>
      <Captura />
    </ConfirmacaoProvider>
  );
}

describe("ConfirmacaoContext", () => {
  test("resolve true ao confirmar e fecha a janela", async () => {
    montar();
    let resposta;
    act(() => {
      confirmar({ titulo: "Excluir processo", mensagem: "Não pode ser desfeito." }).then((r) => (resposta = r));
    });

    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText("Não pode ser desfeito.")).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Excluir" })));

    expect(resposta).toBe(true);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  test("Esc e Cancelar resolvem false", async () => {
    montar();
    let resposta;
    act(() => {
      confirmar({ mensagem: "x" }).then((r) => (resposta = r));
    });
    await act(async () => fireEvent.keyDown(window, { key: "Escape" }));
    expect(resposta).toBe(false);

    act(() => {
      confirmar({ mensagem: "y" }).then((r) => (resposta = r));
    });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Cancelar" })));
    expect(resposta).toBe(false);
  });

  test("em ação destrutiva o foco começa no Cancelar", () => {
    montar();
    act(() => {
      confirmar({ mensagem: "z" });
    });
    expect(document.activeElement.textContent).toBe("Cancelar");
  });
});
