import { normalizarLista, getUsuarioLogado } from "../api";

describe("normalizarLista", () => {
  test("retorna a própria lista quando os dados já são um array", () => {
    const lista = [{ id: 1 }, { id: 2 }];
    expect(normalizarLista(lista)).toBe(lista);
  });

  test("extrai 'results' de uma resposta paginada", () => {
    const resultado = normalizarLista({ count: 2, results: [{ id: 1 }] });
    expect(resultado).toEqual([{ id: 1 }]);
  });

  test("retorna lista vazia para dados inválidos", () => {
    expect(normalizarLista(null)).toEqual([]);
    expect(normalizarLista(undefined)).toEqual([]);
    expect(normalizarLista({})).toEqual([]);
  });
});

describe("getUsuarioLogado", () => {
  test("retorna null em ambiente sem 'window' (SSR)", () => {
    expect(typeof window).toBe("undefined");
    expect(getUsuarioLogado()).toBeNull();
  });
});
