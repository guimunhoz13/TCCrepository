import { buscarEnderecoPorCep, montarEnderecoCompleto } from "../cep";

describe("buscarEnderecoPorCep", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("retorna null sem chamar a API quando o CEP não tem 8 dígitos", async () => {
    global.fetch = jest.fn();
    const resultado = await buscarEnderecoPorCep("123");
    expect(resultado).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("retorna o endereço formatado a partir da resposta da API", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        logradouro: "Avenida Paulista",
        bairro: "Bela Vista",
        localidade: "São Paulo",
        uf: "SP",
      }),
    });

    const resultado = await buscarEnderecoPorCep("01310-200");

    expect(global.fetch).toHaveBeenCalledWith("https://viacep.com.br/ws/01310200/json/");
    expect(resultado).toEqual({
      logradouro: "Avenida Paulista",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
    });
  });

  test("retorna null quando a API informa CEP inexistente", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ erro: true }),
    });

    const resultado = await buscarEnderecoPorCep("00000000");
    expect(resultado).toBeNull();
  });

  test("retorna null quando a requisição falha", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("offline"));
    const resultado = await buscarEnderecoPorCep("01310200");
    expect(resultado).toBeNull();
  });
});

describe("montarEnderecoCompleto", () => {
  test("junta logradouro e bairro separados por vírgula", () => {
    expect(
      montarEnderecoCompleto({ logradouro: "Avenida Paulista", bairro: "Bela Vista" })
    ).toBe("Avenida Paulista, Bela Vista");
  });

  test("omite partes vazias", () => {
    expect(montarEnderecoCompleto({ logradouro: "Avenida Paulista", bairro: "" })).toBe(
      "Avenida Paulista"
    );
  });
});
