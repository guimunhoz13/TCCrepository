/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import AppSidebar from "../AppSidebar";

const mockPush = jest.fn();
const mockPrefetch = jest.fn();
const mockOpenPanel = jest.fn();
const mockClosePanel = jest.fn();
let mockPathname = "/dashboard/compromissos";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, prefetch: mockPrefetch }),
  usePathname: () => mockPathname,
}));

jest.mock("../../../contexts/PanelContext", () => ({
  PANELS: {
    CLIENTES: "clientes",
    PROCESSOS: "processos",
    DOCUMENTOS: "documentos",
    AGENDA: "agenda",
    CONTRATOS: "contratos",
    HORAS: "horas",
    TAREFAS: "tarefas",
    MODELOS: "modelos",
    CONTATO: "contato",
    CONFIG: "config",
    ADVOGADOS: "advogados",
    PLANOS: "planos",
  },
  usePanel: () => ({
    activePanel: null,
    openPanel: mockOpenPanel,
    closePanel: mockClosePanel,
  }),
}));

jest.mock("../../../contexts/PreferencesContext", () => ({
  usePreferences: () => ({ t: (chave) => chave }),
}));
jest.mock("../../../contexts/MenuMovelContext", () => ({
  useMenuMovel: () => ({ aberto: false, fechar: jest.fn() }),
}));
jest.mock("../../../hooks/useUsuarioLogado", () => ({
  useUsuarioLogado: () => ({ tipo_usuario: "admin", escritorio_nome: "Teste" }),
}));
jest.mock("../../../hooks/usePermissoes", () => ({ usePermissoes: () => () => true }));
jest.mock("../../ui/Logo", () => function LogoMock() {
  return <span>Logo</span>;
});

describe("AppSidebar fora da dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/dashboard/compromissos";
  });

  test("pré-carrega a dashboard e navega antes de abrir um painel", () => {
    render(<AppSidebar />);

    expect(mockPrefetch).toHaveBeenCalledWith("/dashboard");
    fireEvent.click(screen.getAllByRole("button", { name: "nav_agenda" })[0]);

    expect(mockClosePanel).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/dashboard?painel=agenda");
    expect(mockOpenPanel).not.toHaveBeenCalled();
  });

  test("na dashboard abre o painel sem navegar", () => {
    mockPathname = "/dashboard";
    render(<AppSidebar />);

    fireEvent.click(screen.getAllByRole("button", { name: "nav_agenda" })[0]);

    expect(mockOpenPanel).toHaveBeenCalledWith("agenda");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
