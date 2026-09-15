import {
  normalizarLista,
  getUsuarioLogado,
  buildQuery,
  solicitarRedefinicaoSenha,
  redefinirSenha,
  getAuditoria,
  getMasterAuditoria,
} from "../api";

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

describe("redefinição de senha", () => {
  const respostaOk = { detail: "ok" };

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => respostaOk,
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test("solicitarRedefinicaoSenha faz POST para o endpoint correto", async () => {
    await solicitarRedefinicaoSenha("ana@escritorio.com");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/login\/esqueci-senha\/$/);
    expect(opcoes.method).toBe("POST");
    expect(JSON.parse(opcoes.body)).toEqual({ email: "ana@escritorio.com" });
  });

  test("redefinirSenha faz POST com token e senhas para o endpoint correto", async () => {
    await redefinirSenha({
      token: "abc123",
      nova_senha: "NovaSenha@1",
      confirmar_senha: "NovaSenha@1",
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/login\/redefinir-senha\/$/);
    expect(opcoes.method).toBe("POST");
    expect(JSON.parse(opcoes.body)).toEqual({
      token: "abc123",
      nova_senha: "NovaSenha@1",
      confirmar_senha: "NovaSenha@1",
    });
  });
});

describe("auditoria", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 0, next: null, previous: null, results: [] }),
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test("getAuditoria consulta o endpoint de auditoria do escritório", async () => {
    await getAuditoria();
    const [url] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/auditoria\/$/);
  });

  test("getMasterAuditoria consulta o endpoint de auditoria da plataforma", async () => {
    await getMasterAuditoria();
    const [url] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/master\/auditoria\/$/);
  });
});
