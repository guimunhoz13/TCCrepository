/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ContratosPanel from "../ContratosPanel";
import { getContratos, getProcessos, updateParcela } from "@/services/api";

const recarregarDashboard = jest.fn(() => Promise.resolve());
jest.mock("@/contexts/PanelContext", () => ({ usePanel: () => ({ activePanel: "contratos", panelTab: "lista", setPanelTab: jest.fn() }) }));
jest.mock("@/contexts/DashboardDataContext", () => ({ useDashboardData: () => ({ refresh: recarregarDashboard }) }));
jest.mock("@/contexts/ConfirmacaoContext", () => ({ useConfirmacao: () => jest.fn() }));
jest.mock("@/contexts/AvisosContext", () => ({ useAvisos: () => jest.fn() }));
jest.mock("@/contexts/PreferencesContext", () => ({ usePreferences: () => ({ t: (chave) => chave }) }));
jest.mock("@/hooks/usePermissoes", () => ({ usePermissoes: () => () => true }));
jest.mock("@/hooks/useRascunhoFormulario", () => ({ useRascunhoFormulario: () => ({ descartarRascunho: jest.fn() }) }));
jest.mock("@/components/shell/OverlayPanel", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("@/services/api", () => ({
  getContratos: jest.fn(), getProcessos: jest.fn(), updateParcela: jest.fn(),
  listarTudo: (buscar) => buscar(), normalizarLista: (dados) => Array.isArray(dados) ? dados : dados?.results || [],
}));

const contrato = { id: 1, numero_processo: "TESTE-LOCAL", cliente_nome: "Cliente Fictício", valor_total: "100.01",
  valor_pago: 0, valor_pendente: "100.01", status: "ativo",
  parcelas: [{ id: 7, numero: 1, valor: "100.01", status: "pendente", data_vencimento: "2026-11-09" }] };

beforeEach(() => {
  jest.clearAllMocks();
  getContratos.mockResolvedValue([contrato]);
  getProcessos.mockResolvedValue([]);
});

async function abrirParcela() {
  render(<ContratosPanel />);
  fireEvent.click(await screen.findByRole("button", { name: "Ver parcelas" }));
  return screen.getByRole("button", { name: "acao_marcar_pago" });
}

test("falha na baixa aparece para a pessoa e permite tentar novamente", async () => {
  updateParcela.mockRejectedValueOnce(new Error("Não foi possível registrar o pagamento."));
  const botao = await abrirParcela();
  fireEvent.click(botao);
  await waitFor(() => expect(screen.getByText("Não foi possível registrar o pagamento.")).not.toBeNull());
  expect(getContratos).toHaveBeenCalledTimes(1);
  expect(botao.disabled).toBe(false);
});

test("baixa pendente impede repetição e atualiza contrato e dashboard ao concluir", async () => {
  let concluir;
  updateParcela.mockReturnValue(new Promise((resolve) => { concluir = resolve; }));
  const botao = await abrirParcela();
  fireEvent.click(botao);
  expect(botao.disabled).toBe(true);
  fireEvent.click(botao);
  expect(updateParcela).toHaveBeenCalledTimes(1);
  expect(updateParcela).toHaveBeenCalledWith(7, { status: "pago" });
  await act(async () => concluir({ status: "pago" }));
  await waitFor(() => expect(getContratos).toHaveBeenCalledTimes(2));
  expect(recarregarDashboard).toHaveBeenCalledTimes(1);
  expect(botao.disabled).toBe(false);
});
