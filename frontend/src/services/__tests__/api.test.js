import { normalizarLista, getUsuarioLogado, buildQuery } from "../api";

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

describe("buildQuery", () => {
  test("retorna string vazia sem parâmetros", () => {
    expect(buildQuery()).toBe("");
    expect(buildQuery({})).toBe("");
  });

  test("monta a query string a partir dos parâmetros informados", () => {
    const resultado = buildQuery({ busca: "joão", status: "Em andamento" });
    const params = new URLSearchParams(resultado.replace(/^\?/, ""));
    expect(resultado.startsWith("?")).toBe(true);
    expect(params.get("busca")).toBe("joão");
    expect(params.get("status")).toBe("Em andamento");
  });

  test("ignora valores undefined, null ou vazios", () => {
    const resultado = buildQuery({
      busca: "",
      status: null,
      advogado: undefined,
      cliente: "5",
    });
    expect(resultado).toBe("?cliente=5");
  });
});
