/** @jest-environment jsdom */
import { prepararPainel, mockDashboard, mockRouter, mockRefresh, mockToggleTheme } from "../../../../test-support/painel";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Dashboard from "@/app/dashboard/page";
import { MenuMovelProvider } from "@/contexts/MenuMovelContext";
import * as api from "@/services/api";
beforeEach(() => {
  prepararPainel(); localStorage.setItem("access", "sessao-exclusiva-do-teste");
  Object.assign(mockDashboard, { stats: { escritorio: { nome: "Escritório fictício" }, totais: { clientes: 2, processos: 1, documentos: 1, agenda: 1 } },
    tarefas: [{ id: 8, titulo: "Revisar minuta fictícia", prioridade: "alta", prazo: "2030-12-01" }],
    processos: [{ id: 3, numero_processo: "PROC-038", titulo: "Processo fictício", status: "Em andamento", cliente_nome: "Cliente de teste" }],
    documentos: [{ id: 9, nome_arquivo: "Declaração fictícia", numero_processo: "PROC-038", enviado_em: "2026-11-11T12:00:00Z" }],
    agenda: [{ id: 5, titulo: "Prazo fatal fictício", tipo: "prazo", prioridade: "fatal", data_evento: "2020-01-01T12:00:00Z", cumprido: false }],
  });
});
function montar() { return render(<MenuMovelProvider><Dashboard /></MenuMovelProvider>); }

test("dashboard reúne alertas, tarefas e documentos e abre o cadastro de cliente", async () => {
  montar(); expect(screen.getByText("Revise sua agenda agora")).toBeTruthy(); expect(screen.getByText("Revisar minuta fictícia")).toBeTruthy(); expect(screen.getByText("Declaração fictícia")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Novo cliente" })); await screen.findByText("Cadastre a pessoa ou empresa");
  fireEvent.click(screen.getByRole("button", { name: "acao_fechar" }));
  fireEvent.click(screen.getByRole("button", { name: "Novo processo" })); await screen.findByRole("heading", { name: "painel_processos" }); expect(document.querySelector('[name="numero_processo"]')).toBeTruthy();
});

test("agenda e falha na abertura de documento mantêm feedback visível", async () => {
  api.abrirDocumento.mockRejectedValue(new Error("Documento indisponível.")); montar();
  fireEvent.click(screen.getByRole("button", { name: "Revisar agenda" })); await screen.findByRole("heading", { name: "painel_agenda" }); fireEvent.click(screen.getByRole("button", { name: "acao_fechar" }));
  const abrir = screen.getByRole("button", { name: /Declaração fictícia/ }); fireEvent.click(abrir); await waitFor(() => expect(api.abrirDocumento).toHaveBeenCalledWith(9));
});

test("sem sessão redireciona ao login e atualização e tema acionam os controles corretos", async () => {
  localStorage.removeItem("access"); montar(); await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/login"));
  fireEvent.click(screen.getByRole("button", { name: "acao_alternar_tema" })); expect(mockToggleTheme).toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /Atualizar/ })); expect(mockRefresh).toHaveBeenCalled();
});
