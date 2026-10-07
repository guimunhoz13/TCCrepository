/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import RegisterForm from "../RegisterForm";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("../../../services/api", () => ({ registrarEscritorio: jest.fn() }));

const RESPOSTA = {
  razao_social: "SILVA E SABINO SOCIEDADE DE ADVOGADOS",
  nome_fantasia: "SILVA & SABINO ADVOCACIA",
  descricao_situacao_cadastral: "ATIVA",
  descricao_tipo_de_logradouro: "AVENIDA",
  logradouro: "BRASILIA",
  numero: "1000",
  complemento: "",
  bairro: "CENTRO",
  municipio: "ARACATUBA",
  uf: "SP",
  cep: "16010000",
  ddd_telefone_1: "1833210000",
  email: null,
};

const campo = (rotulo) => screen.getByText(rotulo).closest(".form-field").querySelector("input");

async function informarCnpj(valor) {
  fireEvent.change(campo("CNPJ"), { target: { value: valor } });
  await act(async () => {
    fireEvent.blur(campo("CNPJ"));
  });
}

describe("cadastro do escritório preenchido pelo CNPJ", () => {
  afterEach(() => jest.restoreAllMocks());

  test("preenche nome, telefone, endereço, cidade, UF e CEP com os dados da Receita", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => RESPOSTA });
    render(<RegisterForm />);
    await informarCnpj("11444777000161");

    expect(global.fetch).toHaveBeenCalledWith("https://brasilapi.com.br/api/cnpj/v1/11444777000161");
    expect(campo("Nome do escritório").value).toBe("Silva & Sabino Advocacia");
    expect(campo("Telefone").value).toBe("(18) 3321-0000");
    expect(campo("Endereço").value).toBe("Avenida Brasilia, 1000, Centro");
    expect(campo("Cidade").value).toBe("Aracatuba");
    expect(campo("Estado (UF)").value).toBe("SP");
    expect(campo("CEP").value).toBe("16010-000");
    expect(campo("E-mail do escritório").value).toBe("");
    expect(screen.getByRole("status").textContent).toMatch(/Receita Federal/);
  });

  test("não sobrescreve o que a pessoa já digitou", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => RESPOSTA });
    render(<RegisterForm />);
    fireEvent.change(campo("Nome do escritório"), { target: { value: "Meu Escritório" } });
    await informarCnpj("11444777000161");
    expect(campo("Nome do escritório").value).toBe("Meu Escritório");
    expect(campo("Cidade").value).toBe("Aracatuba");
  });

  test("CNPJ não encontrado só avisa; o formulário continua editável", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    render(<RegisterForm />);
    await informarCnpj("11444777000161");
    expect(screen.getByRole("status").textContent).toMatch(/não encontrado/);
    expect(campo("Nome do escritório").value).toBe("");
    expect(campo("Nome do escritório").disabled).toBe(false);
  });
});
