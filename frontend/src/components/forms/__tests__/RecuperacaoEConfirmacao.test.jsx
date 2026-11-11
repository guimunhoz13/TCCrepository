/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import EsqueciSenhaForm from "../EsqueciSenhaForm";
import RedefinirSenhaForm from "../RedefinirSenhaForm";
import ConfirmarEmailForm from "../ConfirmarEmailForm";
import { confirmarEmail, redefinirSenha, solicitarRedefinicaoSenha } from "@/services/api";
let mockToken = "token-ficticio";
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }), useSearchParams: () => new URLSearchParams(mockToken ? { token: mockToken } : {}) }));
jest.mock("@/services/api", () => ({ confirmarEmail: jest.fn(), redefinirSenha: jest.fn(), solicitarRedefinicaoSenha: jest.fn() }));
beforeEach(() => { jest.clearAllMocks(); mockToken = "token-ficticio"; });
afterEach(() => { jest.useRealTimers(); });

test("recuperação remove espaços do e-mail e informa sucesso sem expor cadastro", async () => {
  solicitarRedefinicaoSenha.mockResolvedValue({ detail: "Se houver cadastro, enviamos as instruções." });
  render(<EsqueciSenhaForm />); fireEvent.change(document.querySelector('[name="email"]'), { target: { value: " pessoa@example.test " } }); fireEvent.submit(document.querySelector("form"));
  await screen.findByText("Se houver cadastro, enviamos as instruções."); expect(solicitarRedefinicaoSenha).toHaveBeenCalledWith("pessoa@example.test");
});

test("falha de rede na recuperação libera nova tentativa e mantém o e-mail", async () => {
  solicitarRedefinicaoSenha.mockRejectedValue(new Error("Serviço temporariamente indisponível."));
  render(<EsqueciSenhaForm />); fireEvent.change(document.querySelector('[name="email"]'), { target: { value: "pessoa@example.test" } }); fireEvent.submit(document.querySelector("form"));
  await screen.findByText("Serviço temporariamente indisponível."); expect(screen.getByRole("button", { name: "Enviar link de redefinição" }).disabled).toBe(false);
  expect(document.querySelector('[name="email"]').value).toBe("pessoa@example.test");
});

test("redefinição sem token orienta pedir outro link", () => { mockToken = ""; render(<RedefinirSenhaForm />); expect(screen.getByRole("heading", { name: "Link inválido" })).toBeTruthy(); expect(screen.getByRole("link", { name: "Solicitar novo link" }).getAttribute("href")).toBe("/esqueci-senha"); expect(redefinirSenha).not.toHaveBeenCalled(); });

test("redefinição recusa senha fraca e confirmação divergente antes de chamar a API", () => {
  render(<RedefinirSenhaForm />); const form = document.querySelector("form"); fireEvent.submit(form); expect(screen.getByText(/não atende a todos os requisitos/)).toBeTruthy();
  fireEvent.change(document.querySelector('[name="nova_senha"]'), { target: { value: "NovaSenha@123" } }); fireEvent.change(document.querySelector('[name="confirmar_senha"]'), { target: { value: "Diferente@123" } }); fireEvent.submit(form);
  expect(screen.getByText("A confirmação da nova senha não confere.")).toBeTruthy(); expect(redefinirSenha).not.toHaveBeenCalled();
});

test("redefinição válida redireciona somente após sucesso e respeita token expirado", async () => {
  redefinirSenha.mockRejectedValueOnce(new Error("Token expirado.")).mockResolvedValueOnce({ detail: "Senha redefinida." });
  render(<RedefinirSenhaForm />); for (const nome of ["nova_senha", "confirmar_senha"]) fireEvent.change(document.querySelector(`[name="${nome}"]`), { target: { value: "NovaSenha@123" } });
  fireEvent.submit(document.querySelector("form")); await screen.findByText("Token expirado."); expect(mockPush).not.toHaveBeenCalled();
  jest.useFakeTimers(); fireEvent.submit(document.querySelector("form")); await act(async () => {});
  expect(screen.getByText("Senha redefinida.")).toBeTruthy(); expect(redefinirSenha).toHaveBeenLastCalledWith({ token: "token-ficticio", nova_senha: "NovaSenha@123", confirmar_senha: "NovaSenha@123" });
  act(() => jest.advanceTimersByTime(2000)); expect(mockPush).toHaveBeenCalledWith("/login");
});

test("confirmação de e-mail apresenta erro e sucesso reais da API", async () => {
  confirmarEmail.mockRejectedValueOnce(new Error("Link expirado.")); const view = render(<ConfirmarEmailForm />); await screen.findByText("Link expirado."); view.unmount();
  confirmarEmail.mockResolvedValueOnce({ detail: "E-mail confirmado." }); render(<ConfirmarEmailForm />); await screen.findByText("E-mail confirmado."); expect(confirmarEmail).toHaveBeenLastCalledWith("token-ficticio");
});

test("confirmação sem token não faz requisição e uma resposta tardia não atualiza componente desmontado", async () => {
  mockToken = ""; const primeiro = render(<ConfirmarEmailForm />); expect(screen.getByRole("heading", { name: "Link inválido" })).toBeTruthy(); expect(confirmarEmail).not.toHaveBeenCalled(); primeiro.unmount();
  mockToken = "tardio"; let concluir; confirmarEmail.mockReturnValue(new Promise((resolve) => { concluir = resolve; })); const segundo = render(<ConfirmarEmailForm />); segundo.unmount(); await act(async () => concluir({ detail: "Confirmado depois de sair." }));
  expect(screen.queryByText("Confirmado depois de sair.")).toBeNull();
});
