import {
  normalizarLista,
  getUsuarioLogado,
  buildQuery,
  solicitarRedefinicaoSenha,
  redefinirSenha,
  getAuditoria,
  getMasterAuditoria,
  getClientes,
  logout,
  masterLogout,
  calcularPrazo,
  getApontamentos,
  createApontamento,
  getDespesas,
  registrarAtividade,
  getTempoDeUso,
  getVariaveisDocumento,
  gerarDocumento,
  createModeloDocumento,
  consultarDataJud,
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

describe("renovação automática do access token expirado", () => {
  beforeEach(() => {
    global.window = {};
    global.localStorage = {
      _dados: {},
      getItem(chave) {
        return Object.prototype.hasOwnProperty.call(this._dados, chave)
          ? this._dados[chave]
          : null;
      },
      setItem(chave, valor) {
        this._dados[chave] = valor;
      },
      removeItem(chave) {
        delete this._dados[chave];
      },
    };
    localStorage.setItem("access", "token-expirado");
    localStorage.setItem("refresh", "refresh-valido");
  });

  afterEach(() => {
    delete global.window;
    delete global.localStorage;
    delete global.fetch;
  });

  test("ao receber 401, renova o access token e repete a requisição original", async () => {
    let numeroDaChamada = 0;

    global.fetch = jest.fn((url) => {
      numeroDaChamada += 1;

      if (url.endsWith("/token/refresh/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ access: "token-novo" }),
        });
      }

      if (numeroDaChamada === 1) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ detail: "Given token not valid for any token type" }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ count: 0, next: null, previous: null, results: [] }),
      });
    });

    const resultado = await getClientes();

    expect(resultado.results).toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(localStorage.getItem("access")).toBe("token-novo");

    const [, opcoesRetentativa] = global.fetch.mock.calls[2];
    expect(opcoesRetentativa.headers.Authorization).toBe("Bearer token-novo");
  });

  test("se a renovação falhar, propaga o erro original em vez de travar", async () => {
    global.fetch = jest.fn((url) => {
      if (url.endsWith("/token/refresh/")) {
        return Promise.resolve({ ok: false, status: 401, json: async () => ({}) });
      }
      return Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Given token not valid for any token type" }),
      });
    });

    await expect(getClientes()).rejects.toThrow(
      "Given token not valid for any token type"
    );
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe("revogação do refresh token no logout", () => {
  beforeEach(() => {
    global.window = {};
    global.localStorage = {
      _dados: {},
      getItem(chave) {
        return Object.prototype.hasOwnProperty.call(this._dados, chave)
          ? this._dados[chave]
          : null;
      },
      setItem(chave, valor) {
        this._dados[chave] = valor;
      },
      removeItem(chave) {
        delete this._dados[chave];
      },
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ detail: "Sessão encerrada." }),
    });
  });

  afterEach(() => {
    delete global.window;
    delete global.localStorage;
    delete global.fetch;
  });

  test("logout envia o refresh token pra revogação e limpa o localStorage", () => {
    localStorage.setItem("access", "token-acesso");
    localStorage.setItem("refresh", "token-refresh");
    localStorage.setItem("usuarioLogado", "{}");

    logout();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/logout\/$/);
    expect(JSON.parse(opcoes.body)).toEqual({ refresh: "token-refresh" });

    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
    expect(localStorage.getItem("usuarioLogado")).toBeNull();
  });

  test("logout sem refresh token guardado não chama a API", () => {
    logout();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("masterLogout envia o master_refresh pra revogação e limpa o localStorage", () => {
    localStorage.setItem("master_access", "token-acesso-master");
    localStorage.setItem("master_refresh", "token-refresh-master");
    localStorage.setItem("masterLogado", "{}");

    masterLogout();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/logout\/$/);
    expect(JSON.parse(opcoes.body)).toEqual({ refresh: "token-refresh-master" });

    expect(localStorage.getItem("master_access")).toBeNull();
    expect(localStorage.getItem("master_refresh")).toBeNull();
    expect(localStorage.getItem("masterLogado")).toBeNull();
  });
});

describe("calcularPrazo", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data_final: "2026-12-30" }),
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test("consulta o endpoint de cálculo de prazo com os parâmetros corretos", async () => {
    const resultado = await calcularPrazo({
      data_inicio: "2026-12-22",
      dias: 5,
      dias_uteis: true,
    });

    expect(resultado.data_final).toBe("2026-12-30");
    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/agenda\/calcular-prazo\/$/);
    expect(JSON.parse(opcoes.body)).toEqual({
      data_inicio: "2026-12-22",
      dias: 5,
      dias_uteis: true,
    });
  });

  test("assume dias_uteis=true quando não informado", async () => {
    await calcularPrazo({ data_inicio: "2026-12-22", dias: 5 });
    const [, opcoes] = global.fetch.mock.calls[0];
    expect(JSON.parse(opcoes.body).dias_uteis).toBe(true);
  });
});


describe("apontamento de horas e despesas", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test("getApontamentos monta a query só com os filtros preenchidos", async () => {
    await getApontamentos({ processo: 7, usuario: "", inicio: "2026-09-01", fim: null });

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("/apontamentos/?");
    expect(url).toContain("processo=7");
    expect(url).toContain("inicio=2026-09-01");
    expect(url).not.toContain("usuario=");
    expect(url).not.toContain("fim=");
  });

  test("getApontamentos sem filtros não acrescenta '?'", async () => {
    await getApontamentos();

    const [url] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/apontamentos\/$/);
  });

  test("createApontamento envia o corpo em JSON", async () => {
    await createApontamento({ processo: 1, minutos: 90, descricao: "Petição" });

    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/apontamentos\/$/);
    expect(opcoes.method).toBe("POST");
    expect(JSON.parse(opcoes.body).minutos).toBe(90);
  });

  test("getDespesas repassa os filtros booleanos", async () => {
    await getDespesas({ reembolsavel: "true" });

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("reembolsavel=true");
  });
});

describe("tempo de uso do sistema", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ mes: "2026-09", usuarios: [] }),
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test("registrarAtividade faz POST no endpoint de atividade", async () => {
    await registrarAtividade();

    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/atividade\/$/);
    expect(opcoes.method).toBe("POST");
  });

  test("getTempoDeUso repassa o mês quando informado", async () => {
    await getTempoDeUso("2026-09");

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("/relatorios/tempo-uso/?mes=2026-09");
  });

  test("getTempoDeUso sem mês consulta o padrão do servidor", async () => {
    await getTempoDeUso();

    const [url] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/relatorios\/tempo-uso\/$/);
  });
});


describe("modelos de documento", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ conteudo: "texto", variaveis_vazias: [] }),
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test("getVariaveisDocumento consulta o catálogo de variáveis", async () => {
    await getVariaveisDocumento();

    const [url] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/modelos-documento\/variaveis\/$/);
  });

  test("gerarDocumento envia o processo e deixa o cliente nulo", async () => {
    await gerarDocumento(3, { processo: 7 });

    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/modelos-documento\/3\/gerar\/$/);
    expect(opcoes.method).toBe("POST");
    expect(JSON.parse(opcoes.body)).toEqual({ processo: 7, cliente: null });
  });

  test("gerarDocumento envia o cliente e deixa o processo nulo", async () => {
    await gerarDocumento(3, { cliente: 9 });

    const [, opcoes] = global.fetch.mock.calls[0];
    expect(JSON.parse(opcoes.body)).toEqual({ processo: null, cliente: 9 });
  });

  test("createModeloDocumento envia o conteúdo em JSON", async () => {
    await createModeloDocumento({ nome: "Procuração", tipo: "procuracao", conteudo: "{{cliente.nome}}" });

    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/modelos-documento\/$/);
    expect(JSON.parse(opcoes.body).conteudo).toBe("{{cliente.nome}}");
  });
});


describe("consulta ao DataJud", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ movimentacoes_importadas: 2, movimentacoes_ignoradas: 0 }),
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test("consultarDataJud faz POST no endpoint do processo", async () => {
    const dados = await consultarDataJud(12);

    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/processos\/12\/consultar-datajud\/$/);
    expect(opcoes.method).toBe("POST");
    expect(dados.movimentacoes_importadas).toBe(2);
  });
});
