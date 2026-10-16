/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { PanelProvider, usePanel } from "../../../contexts/PanelContext";
import AdvogadosPanel from "../AdvogadosPanel";

jest.mock("../../../hooks/useRecurso", () => ({
  useRecurso: () => ({
    dados: [{ id: 1, nome: "João", email: "joao@example.com", oab: "123456/SP", especialidade: "Cível" }],
    carregando: false,
    erro: "",
    recarregar: jest.fn(),
  }),
}));
jest.mock("../../../hooks/useFotoProtegida", () => () => null);
jest.mock("../../../hooks/useUsuarioLogado", () => ({
  useUsuarioLogado: () => ({ tipo_usuario: "admin" }),
}));
jest.mock("../../../contexts/DashboardDataContext", () => ({
  useDashboardData: () => ({ refresh: jest.fn() }),
}));
jest.mock("../../../contexts/PreferencesContext", () => ({
  usePreferences: () => ({
    t: (chave) => ({
      nav_advogados: "Advogados",
      painel_advogados: "Advogados",
      acao_cadastrar_advogado: "Cadastrar advogado",
      acao_editar: "Editar",
      acao_fechar: "Fechar",
    })[chave] || chave,
  }),
}));
jest.mock("../../../contexts/AjudaContext", () => ({
  useAjuda: () => ({ abrirAjuda: jest.fn() }),
}));

function AbrirPainel() {
  const { openPanel } = usePanel();
  return <button onClick={() => openPanel("advogados")}>Abrir</button>;
}

test("permite iniciar um novo cadastro mesmo após abrir a edição", () => {
  render(
    <PanelProvider>
      <AbrirPainel />
      <AdvogadosPanel />
    </PanelProvider>
  );

  fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  expect(screen.getByDisplayValue("João")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Cadastrar advogado" })).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Cadastrar advogado" }));
  expect(screen.queryByDisplayValue("João")).toBeNull();
  expect(screen.getByText(/Cadastre um novo advogado no escritório/)).toBeTruthy();
  expect(screen.getByText("Senha")).toBeTruthy();
});
