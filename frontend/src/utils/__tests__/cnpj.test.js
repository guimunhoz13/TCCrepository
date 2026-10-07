import { avisoDaEmpresa, buscarEmpresaPorCnpj, capitalizarNome, enderecoDaEmpresa, interpretarEmpresa } from "../cnpj";

// Formato da resposta de https://brasilapi.com.br/api/cnpj/v1/{cnpj}
const RESPOSTA = {
  cnpj: "11222333000181",
  razao_social: "COMERCIAL NOROESTE LTDA",
  nome_fantasia: "NOROESTE DISTRIBUIDORA",
  descricao_situacao_cadastral: "ATIVA",
  descricao_tipo_de_logradouro: "RUA",
  logradouro: "XV DE NOVEMBRO",
  numero: "800",
  complemento: "SALA 2",
  bairro: "CENTRO",
  municipio: "ARACATUBA",
  uf: "SP",
  cep: "16010040",
  ddd_telefone_1: "1836224455",
  email: "JURIDICO@NOROESTE.COM.BR",
};

describe("capitalizarNome", () => {
  test("deixa os nomes legíveis e mantém as siglas societárias", () => {
    expect(capitalizarNome("COMERCIAL NOROESTE LTDA")).toBe("Comercial Noroeste LTDA");
    expect(capitalizarNome("BANCO DO BRASIL S.A.")).toBe("Banco do Brasil S.A.");
    expect(capitalizarNome("  padaria  e  confeitaria de MINAS  ")).toBe("Padaria e Confeitaria de Minas");
  });
});

describe("interpretarEmpresa", () => {
  test("converte a resposta do BrasilAPI para os campos do formulário", () => {
    expect(interpretarEmpresa(RESPOSTA)).toEqual({
      razaoSocial: "Comercial Noroeste LTDA",
      nomeFantasia: "Noroeste Distribuidora",
      situacao: "ATIVA",
      cep: "16010040",
      logradouro: "Rua XV de Novembro, 800",
      complemento: "Sala 2",
      bairro: "Centro",
      cidade: "Aracatuba",
      estado: "SP",
      telefone: "1836224455",
      email: "juridico@noroeste.com.br",
    });
  });

  test("não repete o tipo quando o logradouro já começa com ele, e trata s/n", () => {
    const empresa = interpretarEmpresa({ ...RESPOSTA, logradouro: "RUA XV DE NOVEMBRO", numero: "S/N" });
    expect(empresa.logradouro).toBe("Rua XV de Novembro, s/n");
  });

  test("campos ausentes viram texto vazio; sem razão social não há empresa", () => {
    const empresa = interpretarEmpresa({ razao_social: "ACME ME", email: null, ddd_telefone_1: null });
    expect(empresa.email).toBe("");
    expect(empresa.telefone).toBe("");
    expect(interpretarEmpresa({})).toBeNull();
    expect(interpretarEmpresa(null)).toBeNull();
  });
});

describe("buscarEmpresaPorCnpj", () => {
  afterEach(() => jest.restoreAllMocks());

  test("não chama a API com CNPJ incompleto", async () => {
    global.fetch = jest.fn();
    expect(await buscarEmpresaPorCnpj("11.222.333/0001")).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("consulta o BrasilAPI só com os dígitos", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => RESPOSTA });
    const empresa = await buscarEmpresaPorCnpj("11.222.333/0001-81");
    expect(global.fetch).toHaveBeenCalledWith("https://brasilapi.com.br/api/cnpj/v1/11222333000181");
    expect(empresa.razaoSocial).toBe("Comercial Noroeste LTDA");
  });

  test("CNPJ não encontrado, erro de rede ou resposta inválida devolvem null sem quebrar", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    expect(await buscarEmpresaPorCnpj("11222333000181")).toBeNull();
    global.fetch = jest.fn().mockRejectedValue(new Error("offline"));
    expect(await buscarEmpresaPorCnpj("11222333000181")).toBeNull();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => { throw new Error("json"); } });
    expect(await buscarEmpresaPorCnpj("11222333000181")).toBeNull();
  });
});

describe("enderecoDaEmpresa e avisoDaEmpresa", () => {
  test("monta a linha de endereço", () => {
    expect(enderecoDaEmpresa(interpretarEmpresa(RESPOSTA))).toBe("Rua XV de Novembro, 800, Sala 2, Centro - Aracatuba/SP");
  });

  test("avisa quando não encontrou e quando a situação não é ativa, sem impedir nada", () => {
    expect(avisoDaEmpresa(null)).toMatch(/não encontrado/);
    expect(avisoDaEmpresa(interpretarEmpresa(RESPOSTA))).not.toMatch(/Atenção/);
    expect(avisoDaEmpresa(interpretarEmpresa({ ...RESPOSTA, descricao_situacao_cadastral: "BAIXADA" }))).toMatch(
      /situação cadastral baixada/
    );
  });
});
