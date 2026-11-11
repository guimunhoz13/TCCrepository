/** @jest-environment jsdom */
import { prepararPainel } from "../../../../test-support/painel";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PrimeirosPassos from "../PrimeirosPassos";
import { PanelProvider, usePanel } from "@/contexts/PanelContext";
function Destino() { const { activePanel, panelTab } = usePanel(); return <output data-testid="destino">{activePanel}:{panelTab}</output>; }
function montar(stats) { return render(<PanelProvider><PrimeirosPassos stats={stats} carregando={false} /><Destino /></PanelProvider>); }
beforeEach(() => prepararPainel());

test("tour inicial pode ser percorrido, encerrado e marcado como visto por usuário", async () => {
  montar({ totais: {} }); await screen.findByRole("dialog");
  expect(screen.getByRole("button", { name: "Anterior" }).disabled).toBe(true);
  for (let i=0;i<4;i++) fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
  expect(screen.getByText("Confira antes de concluir")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Anterior" })); expect(screen.getByText("A ajuda acompanha a tela")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Próximo" })); fireEvent.click(screen.getByRole("button", { name: "Começar a usar" }));
  expect(screen.queryByRole("dialog")).toBeNull(); expect(localStorage.getItem("lexnexo:onboarding:v1:1")).toBe("visto");
});

test("checklist usa dados reais, expande etapas e abre o próximo cadastro", async () => {
  montar({ escritorio: { nome: "Teste" }, totais: { clientes: 1, processos: 0 } });
  fireEvent.click(screen.getByRole("button", { name: "Ver etapas" }));
  fireEvent.click(screen.getByRole("button", { name: "Criar processo" }));
  expect(screen.getByTestId("destino").textContent).toBe("processos:novo");
  fireEvent.click(screen.getByRole("button", { name: "Recolher etapas" })); expect(screen.getByRole("button", { name: /Próximo passo/ })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Ver apresentação" })); await screen.findByRole("dialog");
  fireEvent.keyDown(window, { key: "Escape" }); expect(screen.queryByRole("dialog")).toBeNull();
});

test("configuração concluída não repete apresentação nem checklist", async () => {
  localStorage.setItem("usuarioLogado", JSON.stringify({ id: 1, nome: "Pessoa de teste", email: "pessoa@example.test" }));
  montar({ escritorio: { nome: "Teste" }, totais: { clientes: 1, processos: 1, documentos: 1, agenda: 1 } });
  await waitFor(() => expect(screen.queryByText("Configure seu LexNexo")).toBeNull()); expect(screen.queryByRole("dialog")).toBeNull();
});
