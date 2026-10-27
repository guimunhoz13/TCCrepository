/** @jest-environment jsdom */
import { StrictMode } from "react";
import { renderHook } from "@testing-library/react";
import { useBloqueioRolagem } from "../useBloqueioRolagem";

afterEach(() => {
  document.documentElement.removeAttribute("style");
  document.body.removeAttribute("style");
});

test("inativo não altera a rolagem de outra janela", () => {
  document.body.style.overflow = "auto";
  const janela = renderHook(() => useBloqueioRolagem(true));
  const inativo = renderHook(() => useBloqueioRolagem(false));
  inativo.unmount();
  expect(document.body.style.overflow).toBe("clip");
  janela.unmount();
  expect(document.body.style.overflow).toBe("auto");
});

test("bloqueia html e body e restaura os eixos e prioridades anteriores", () => {
  document.documentElement.style.setProperty("overflow-x", "clip", "important");
  document.body.style.overflowY = "auto";
  document.body.style.color = "red";
  const janela = renderHook(() => useBloqueioRolagem(true));
  expect(document.documentElement.style.overflowY).toBe("hidden");
  expect(document.body.style.overflowY).toBe("clip");
  janela.unmount();
  expect(document.documentElement.style.overflowX).toBe("clip");
  expect(document.documentElement.style.getPropertyPriority("overflow-x")).toBe("important");
  expect(document.body.style.overflowY).toBe("auto");
  expect(document.body.style.color).toBe("red");
});

test("fechar uma de duas janelas não libera o documento", () => {
  const painel = renderHook(() => useBloqueioRolagem(true));
  const ajuda = renderHook(() => useBloqueioRolagem(true));
  painel.unmount();
  expect(document.documentElement.style.overflowY).toBe("hidden");
  ajuda.unmount();
  expect(document.documentElement.style.overflowY).toBe("");
  expect(document.body.style.overflowY).toBe("");
});

test("ativa e desativa conforme o estado da janela", () => {
  const janela = renderHook(({ ativo }) => useBloqueioRolagem(ativo), { initialProps: { ativo: false } });
  expect(document.body.style.overflowY).toBe("");
  janela.rerender({ ativo: true });
  expect(document.body.style.overflowY).toBe("clip");
  janela.rerender({ ativo: false });
  expect(document.body.style.overflowY).toBe("");
});

test("não deixa bloqueios pendurados no StrictMode", () => {
  const janela = renderHook(() => useBloqueioRolagem(true), { wrapper: StrictMode });
  expect(document.documentElement.style.overflowY).toBe("hidden");
  janela.unmount();
  expect(document.documentElement.style.overflowY).toBe("");
});
