/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import AcessoAssistente from "@/app/assistente-ia/page";
import { getPlanoAtual } from "@/services/api";

jest.mock("@/services/api", () => ({ getPlanoAtual: jest.fn() }));
jest.mock("../AssistenteChat", () => ({
  __esModule: true,
  default: () => <textarea aria-label="Pergunta para o assistente" />,
}));

jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock("@/components/shell/AppSidebar", () => () => null);
jest.mock("@/components/shell/TopBar", () => () => null);
jest.mock("@/components/shell/GuiaContextual", () => () => null);
jest.mock("@/contexts/PanelContext", () => ({ PanelProvider: ({ children }) => <>{children}</> }));
jest.mock("@/contexts/PreferencesContext", () => ({ PreferencesProvider: ({ children }) => <>{children}</> }));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem("access", "token-sintetico-de-teste");
});

test("no Gratuito informa o plano exigido antes de oferecer o formulário", async () => {
  getPlanoAtual.mockResolvedValue({ plano: "gratuito", recursos: [] });
  render(<AcessoAssistente />);
  expect(await screen.findByText(/disponível no plano Profissional/)).toBeTruthy();
  expect(screen.queryByRole("textbox")).toBeNull();
});

test("o Profissional com recurso IA pode abrir o chat", async () => {
  getPlanoAtual.mockResolvedValue({ plano: "profissional", recursos: ["ia"] });
  render(<AcessoAssistente />);
  expect(await screen.findByRole("textbox", { name: "Pergunta para o assistente" })).toBeTruthy();
});

test("não exibe o chat antes da confirmação do plano", () => {
  getPlanoAtual.mockReturnValue(new Promise(() => {}));
  render(<AcessoAssistente />);
  expect(screen.getByRole("status").textContent).toMatch(/Verificando/);
  expect(screen.queryByRole("textbox")).toBeNull();
});

test("falha na consulta oferece nova tentativa sem liberar o chat", async () => {
  getPlanoAtual.mockRejectedValue(new Error("Consulta indisponível"));
  render(<AcessoAssistente />);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeTruthy();
  expect(screen.queryByRole("textbox")).toBeNull();
});
