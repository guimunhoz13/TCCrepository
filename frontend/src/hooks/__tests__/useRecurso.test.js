/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { useListaPaginada, useRecurso } from "../useRecurso";

function adiada() {
  let resolver;
  let rejeitar;
  const promessa = new Promise((res, rej) => {
    resolver = res;
    rejeitar = rej;
  });
  return { promessa, resolver, rejeitar };
}

describe("useRecurso", () => {
  test("começa carregando e entrega os dados quando a API responde", async () => {
    const { result } = renderHook(() => useRecurso(() => Promise.resolve([1, 2])));

    expect(result.current.carregando).toBe(true);
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.dados).toEqual([1, 2]);
    expect(result.current.erro).toBe("");
  });

  test("não busca nada enquanto estiver inativo", () => {
    const buscar = jest.fn(() => Promise.resolve([]));
    const { result } = renderHook(() => useRecurso(buscar, [], { ativo: false }));

    expect(buscar).not.toHaveBeenCalled();
    expect(result.current.carregando).toBe(false);
  });

  test("refaz a consulta quando uma das chaves muda", async () => {
    const buscar = jest.fn((termo) => Promise.resolve(`resultado de ${termo}`));
    const { result, rerender } = renderHook(({ termo }) => useRecurso(() => buscar(termo), [termo]), {
      initialProps: { termo: "ana" },
    });
    await waitFor(() => expect(result.current.dados).toBe("resultado de ana"));

    rerender({ termo: "bruno" });

    await waitFor(() => expect(result.current.dados).toBe("resultado de bruno"));
    expect(buscar).toHaveBeenCalledTimes(2);
  });

  test("resposta atrasada de uma consulta antiga não sobrescreve a atual", async () => {
    const antiga = adiada();
    const nova = adiada();
    const respostas = { a: antiga.promessa, ab: nova.promessa };
    const { result, rerender } = renderHook(({ termo }) => useRecurso(() => respostas[termo], [termo]), {
      initialProps: { termo: "a" },
    });

    rerender({ termo: "ab" });
    await act(async () => nova.resolver("resultado de ab"));
    await act(async () => antiga.resolver("resultado de a"));

    expect(result.current.dados).toBe("resultado de ab");
  });

  test("em caso de erro, guarda a mensagem e mantém os dados anteriores", async () => {
    let falhar = false;
    const { result } = renderHook(() =>
      useRecurso(() => (falhar ? Promise.reject(new Error("Sem conexão")) : Promise.resolve("ok")))
    );
    await waitFor(() => expect(result.current.dados).toBe("ok"));

    falhar = true;
    act(() => result.current.recarregar());

    await waitFor(() => expect(result.current.erro).toBe("Sem conexão"));
    expect(result.current.dados).toBe("ok");
  });

  test("recarregar busca de novo mesmo sem mudar as chaves", async () => {
    const buscar = jest.fn(() => Promise.resolve("ok"));
    const { result } = renderHook(() => useRecurso(buscar));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    act(() => result.current.recarregar());

    await waitFor(() => expect(buscar).toHaveBeenCalledTimes(2));
  });
});

describe("useListaPaginada", () => {
  const paginas = {
    1: { count: 5, next: "p2", results: [{ id: 1 }, { id: 2 }] },
    2: { count: 5, next: "p3", results: [{ id: 3 }, { id: 4 }] },
    3: { count: 5, next: null, results: [{ id: 5 }] },
  };

  test("carrega a primeira página e informa o total do servidor", async () => {
    const { result } = renderHook(() => useListaPaginada((page) => Promise.resolve(paginas[page])));

    await waitFor(() => expect(result.current.itens).toHaveLength(2));
    expect(result.current.total).toBe(5);
    expect(result.current.temMais).toBe(true);
  });

  test("carregarMais junta as páginas seguintes até acabar", async () => {
    const { result } = renderHook(() => useListaPaginada((page) => Promise.resolve(paginas[page])));
    await waitFor(() => expect(result.current.itens).toHaveLength(2));

    await act(async () => result.current.carregarMais());
    await act(async () => result.current.carregarMais());

    expect(result.current.itens.map((i) => i.id)).toEqual([1, 2, 3, 4, 5]);
    expect(result.current.temMais).toBe(false);
  });

  test("ao trocar o filtro, descarta as páginas extras do filtro anterior", async () => {
    const buscar = (filtro, page) =>
      Promise.resolve(filtro === "todos" ? paginas[page] : { count: 1, next: null, results: [{ id: 99 }] });
    const { result, rerender } = renderHook(
      ({ filtro }) => useListaPaginada((page) => buscar(filtro, page), [filtro]),
      { initialProps: { filtro: "todos" } }
    );
    await waitFor(() => expect(result.current.itens).toHaveLength(2));
    await act(async () => result.current.carregarMais());

    rerender({ filtro: "ativos" });

    await waitFor(() => expect(result.current.itens.map((i) => i.id)).toEqual([99]));
  });

  test("aceita resposta sem paginação (lista simples)", async () => {
    const { result } = renderHook(() => useListaPaginada(() => Promise.resolve([{ id: 1 }])));

    await waitFor(() => expect(result.current.itens).toEqual([{ id: 1 }]));
    expect(result.current.temMais).toBe(false);
    expect(result.current.total).toBe(1);
  });
});
