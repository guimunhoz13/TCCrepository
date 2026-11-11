import { act, fireEvent, render, screen } from "@testing-library/react";
import { PanelProvider, usePanel } from "@/contexts/PanelContext";
import RotulosAutomaticos from "@/components/shell/RotulosAutomaticos";
import * as api from "@/services/api";

// Só a fronteira HTTP e os avisos externos são substituídos. Os formulários,
// estado dos painéis, paginação, rascunhos e controles permanecem reais.
jest.mock("@/services/api");
export const mockConfirmar = jest.fn();
export const mockAvisar = jest.fn();
export const mockRefresh = jest.fn();
export const mockAtualizarPreferencias = jest.fn();
export const mockSetTheme = jest.fn();
export const mockToggleTheme = jest.fn();
export const mockDashboard = {};
export const mockRouter = { push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() };
jest.mock("next/navigation", () => ({ useRouter: () => mockRouter, usePathname: () => "/dashboard" }));
jest.mock("@/contexts/ConfirmacaoContext", () => ({ useConfirmacao: () => mockConfirmar }));
jest.mock("@/contexts/AvisosContext", () => ({ useAvisos: () => mockAvisar }));
jest.mock("@/contexts/DashboardDataContext", () => ({
  DashboardDataProvider: ({ children }) => children,
  useDashboardData: () => ({ ...mockDashboard, refresh: mockRefresh }),
}));
jest.mock("@/contexts/PreferencesContext", () => ({ usePreferences: () => ({
  t: (chave) => chave, atualizarPreferencias: mockAtualizarPreferencias, preferencias: {},
}) }));
jest.mock("@/contexts/ThemeContext", () => ({ useTheme: () => ({ theme: "dark", setTheme: mockSetTheme, toggleTheme: mockToggleTheme }) }));
jest.mock("@/contexts/AjudaContext", () => ({ useAjuda: () => ({ abrirAjuda: jest.fn() }) }));

export function prepararPainel() {
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("usuarioLogado", JSON.stringify({ id: 1, nome: "Pessoa de teste", tipo_usuario: "admin" }));
  for (const fn of Object.values(api)) if (jest.isMockFunction(fn)) fn.mockReset().mockResolvedValue([]);
  const real = jest.requireActual("@/services/api");
  api.normalizarLista.mockImplementation(real.normalizarLista);
  api.listarTudo.mockImplementation(real.listarTudo);
  api.getUsuarioLogado.mockImplementation(real.getUsuarioLogado);
  api.fotoProtegida.mockReturnValue(false);
  api.getRascunho.mockResolvedValue(null);
  mockConfirmar.mockResolvedValue(true);
  mockRefresh.mockResolvedValue(undefined);
  Object.assign(mockDashboard, { stats: null, processos: [], agenda: [], documentos: [], tarefas: [], novosNaSemana: {}, carregando: false, erro: "", versaoDados: null, atualizadoEm: null });
  URL.createObjectURL = jest.fn(() => "blob:arquivo-de-teste");
  URL.revokeObjectURL = jest.fn();
}

export async function montarPainel(Component, painel, aba = "lista") {
  function Abrir() {
    const { openPanel } = usePanel();
    return <button onClick={() => openPanel(painel, aba)}>Abrir cenário de teste</button>;
  }
  const view = render(<PanelProvider><RotulosAutomaticos /><Abrir /><Component /></PanelProvider>);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Abrir cenário de teste" })));
  return view;
}

export function preencher(nome, valor) {
  const campo = document.querySelector(`[name="${nome}"]`);
  if (!campo) throw new Error(`Campo não encontrado: ${nome}`);
  fireEvent.change(campo, { target: { value: valor } });
  return campo;
}

export function submeter() {
  const form = document.querySelector("form");
  if (!form) throw new Error("Formulário não encontrado");
  fireEvent.submit(form);
}
