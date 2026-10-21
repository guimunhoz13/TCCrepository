/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { useRascunhoFormulario } from "../useRascunhoFormulario";
import { excluirRascunho, getRascunho, salvarRascunho } from "../../services/api";

jest.mock("../../services/api", () => ({
  excluirRascunho: jest.fn(),
  getRascunho: jest.fn(),
  salvarRascunho: jest.fn(),
}));

const INICIAL = { nome: "", email: "" };

function useFormularioTeste() {
  const [valor, setValor] = useState(INICIAL);
  const rascunho = useRascunhoFormulario({
    chave: "novo-cliente",
    ativo: true,
    valor,
    setValor,
    valorInicial: INICIAL,
    atraso: 0,
  });
  return { valor, setValor, ...rascunho };
}

describe("useRascunhoFormulario", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    excluirRascunho.mockResolvedValue(null);
    salvarRascunho.mockResolvedValue({});
  });

  test("restaura o rascunho privado vindo do servidor", async () => {
    getRascunho.mockResolvedValue({ dados: { nome: "Ana" } });
    const { result } = renderHook(useFormularioTeste);

    await waitFor(() => expect(result.current.valor.nome).toBe("Ana"));
    expect(result.current.valor.email).toBe("");
    expect(result.current.estadoRascunho).toMatch(/restaurado/i);
    expect(salvarRascunho).not.toHaveBeenCalled();
  });

  test("salva alterações no servidor depois do intervalo", async () => {
    getRascunho.mockResolvedValue(null);
    const { result } = renderHook(useFormularioTeste);
    await waitFor(() => expect(getRascunho).toHaveBeenCalled());

    act(() => result.current.setValor({ nome: "Bruno", email: "b@exemplo.com" }));

    await waitFor(() =>
      expect(salvarRascunho).toHaveBeenCalledWith("novo-cliente", {
        nome: "Bruno",
        email: "b@exemplo.com",
      })
    );
    expect(result.current.estadoRascunho).toMatch(/salvo/i);
  });

  test("descarta o rascunho após o cadastro definitivo", async () => {
    getRascunho.mockResolvedValue(null);
    const { result } = renderHook(useFormularioTeste);
    await waitFor(() => expect(getRascunho).toHaveBeenCalled());

    await act(async () => result.current.descartarRascunho());

    expect(excluirRascunho).toHaveBeenCalledWith("novo-cliente");
    expect(result.current.estadoRascunho).toBe("");
  });
});
