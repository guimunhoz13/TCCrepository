/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { usePermissoes } from "../usePermissoes";
import { salvarUsuarioLogado } from "@/services/api";

describe("usePermissoes", () => {
  afterEach(() => localStorage.clear());

  test("segue a matriz gravada no login", () => {
    salvarUsuarioLogado({
      nome: "Estagiária",
      tipo_usuario: "estagiario",
      permissoes: { clientes: ["criar", "editar", "ver"], financeiro: [] },
    });
    const { result } = renderHook(() => usePermissoes());

    expect(result.current("clientes")).toBe(true);
    expect(result.current("clientes", "criar")).toBe(true);
    expect(result.current("clientes", "excluir")).toBe(false);
    expect(result.current("financeiro")).toBe(false);
    // Área que nem veio na resposta conta como sem acesso.
    expect(result.current("ia")).toBe(false);
  });

  test("sem permissões gravadas deixa a decisão para a API", () => {
    salvarUsuarioLogado({ nome: "Sessão antiga", tipo_usuario: "advogado" });
    const { result } = renderHook(() => usePermissoes());

    expect(result.current("financeiro", "excluir")).toBe(true);
  });

  test("acompanha a troca de perfil sem recarregar a página", () => {
    salvarUsuarioLogado({ nome: "X", permissoes: { agenda: ["ver"] } });
    const { result } = renderHook(() => usePermissoes());
    expect(result.current("agenda", "criar")).toBe(false);

    act(() => salvarUsuarioLogado({ nome: "X", permissoes: { agenda: ["criar", "ver"] } }));
    expect(result.current("agenda", "criar")).toBe(true);
  });
});
