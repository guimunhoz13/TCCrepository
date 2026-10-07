/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import LoginForm from "../LoginForm";
import { login, loginSegundoFator } from "../../../services/api";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
jest.mock("../../../services/api", () => ({
  login: jest.fn(),
  loginSegundoFator: jest.fn(),
  salvarUsuarioLogado: jest.fn(),
}));

const SESSAO = { access: "a", refresh: "r", usuario: { nome: "Ana" } };

async function entrarComSenha() {
  fireEvent.change(screen.getByPlaceholderText("seu@email.com"), {
    target: { value: " ana@escritorio.com " },
  });
  fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "Senha@123" } });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Entrar no sistema" })));
}

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("sem duas etapas, entra direto com a senha", async () => {
    login.mockResolvedValue(SESSAO);
    render(<LoginForm />);
    await entrarComSenha();

    expect(login).toHaveBeenCalledWith("ana@escritorio.com", "Senha@123");
    expect(localStorage.getItem("access")).toBe("a");
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  test("com duas etapas, pede o código e só então abre a sessão", async () => {
    login.mockResolvedValue({ requer_2fa: true, desafio: "desafio-assinado" });
    loginSegundoFator.mockResolvedValue(SESSAO);
    render(<LoginForm />);
    await entrarComSenha();

    expect(push).not.toHaveBeenCalled();
    expect(localStorage.getItem("access")).toBeNull();
    const campo = screen.getByLabelText("Código");
    fireEvent.change(campo, { target: { value: "123 456" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Confirmar e entrar" })));

    expect(loginSegundoFator).toHaveBeenCalledWith("desafio-assinado", "123456");
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  test("código errado mostra o erro e limpa o campo", async () => {
    login.mockResolvedValue({ requer_2fa: true, desafio: "d" });
    loginSegundoFator.mockRejectedValue(new Error("Código inválido."));
    render(<LoginForm />);
    await entrarComSenha();

    fireEvent.change(screen.getByLabelText("Código"), { target: { value: "000000" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Confirmar e entrar" })));

    expect(screen.getByText("Código inválido.")).toBeTruthy();
    expect(screen.getByLabelText("Código").value).toBe("");
    expect(push).not.toHaveBeenCalled();
  });

  test("dá para voltar e entrar com outra conta", async () => {
    login.mockResolvedValue({ requer_2fa: true, desafio: "d" });
    render(<LoginForm />);
    await entrarComSenha();

    fireEvent.click(screen.getByRole("button", { name: "Voltar e entrar com outra conta" }));
    expect(screen.getByRole("button", { name: "Entrar no sistema" })).toBeTruthy();
  });
});
