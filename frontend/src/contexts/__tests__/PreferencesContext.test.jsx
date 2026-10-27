/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PreferencesProvider, usePreferences } from "../PreferencesContext";
import { getConfiguracoes, updatePreferencias } from "../../services/api";

jest.mock("../../services/api", () => ({ getConfiguracoes: jest.fn(), updatePreferencias: jest.fn() }));

function Controle() {
  const { densidade, atualizarPreferencias } = usePreferences();
  return <button onClick={() => atualizarPreferencias({ densidade_tabela: "compact" })}>{densidade}</button>;
}

test("consulta inicial atrasada não reverte uma preferência escolhida pelo usuário", async () => {
  let concluir;
  getConfiguracoes.mockReturnValue(new Promise((resolve) => { concluir = resolve; }));
  updatePreferencias.mockResolvedValue({ preferencias: { densidade_tabela: "compact" } });
  render(<PreferencesProvider><Controle /></PreferencesProvider>);
  fireEvent.click(screen.getByRole("button"));
  await waitFor(() => expect(screen.getByRole("button").textContent).toBe("compact"));
  await act(async () => concluir({ preferencias: { densidade_tabela: "comfortable" } }));
  expect(screen.getByRole("button").textContent).toBe("compact");
  expect(document.documentElement.getAttribute("data-density")).toBe("compact");
});
