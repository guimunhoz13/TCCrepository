/** @jest-environment jsdom */
import { montarPainel, prepararPainel, mockAtualizarPreferencias, mockSetTheme, mockConfirmar, mockRouter } from "../../../../test-support/painel";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import ConfigPanel from "../ConfigPanel";
import * as api from "@/services/api";
import * as push from "@/utils/push";
import { abrirRelatorio } from "@/utils/relatorio";
jest.mock("@/utils/push");
jest.mock("@/utils/relatorio", () => ({
  gerarHtmlRelatorioCliente: jest.fn(() => "<p>Relatório fictício</p>"),
  gerarHtmlRelatorioProcesso: jest.fn(() => "<p>Processo fictício</p>"),
  abrirRelatorio: jest.fn(),
}));
const configuracao = {
  usuario: { id: 1, nome: "Pessoa de teste", email: "pessoa@example.test", telefone: "18999990000", tipo_usuario: "admin", totp_ativo: false },
  escritorio: { id: 1, nome: "Escritório de teste", cidade: "Araçatuba", estado: "SP", cnpj: "11222333000181" },
  configuracao_escritorio: {}, membros: [], preferencias: { tema: "dark", idioma: "pt-BR" },
};
async function aba(chave) { fireEvent.click(screen.getByRole("button", { name: chave })); await act(async () => {}); }
function mudar(rotulo, valor) { fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } }); }
beforeEach(() => {
  prepararPainel();
  api.getConfiguracoes.mockResolvedValue(JSON.parse(JSON.stringify(configuracao)));
  api.getPlanoAtual.mockResolvedValue({ nome: "Gratuito", uso: { usuarios: 1, processos_ativos: 0 }, limites: { usuarios: 3, processos_ativos: 30 } });
  push.inscricaoAtual.mockResolvedValue(null); push.pushSuportado.mockReturnValue(true);
  api.getSituacaoPush.mockResolvedValue({ ativo: true, chave_publica: "chave-publica-ficticia", aparelhos: 0 });
  mockAtualizarPreferencias.mockResolvedValue({ preferencias: { idioma: "pt-BR", densidade_tabela: "compact" } });
  abrirRelatorio.mockImplementation(async (gerar) => { await gerar(); return "download"; });
});
async function montar() { await montarPainel(ConfigPanel, "config"); await screen.findByText("Dados pessoais"); }

test("salva dados pessoais e comunica uma falha sem apagar a edição", async () => {
  api.updateConta.mockRejectedValueOnce(new Error("E-mail já utilizado.")).mockResolvedValueOnce({ usuario: { ...configuracao.usuario, nome: "Nome revisado" }, detail: "Conta atualizada." });
  await montar(); mudar("Nome", "Nome revisado");
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" })); await screen.findByText("E-mail já utilizado.");
  expect(screen.getByLabelText("Nome").value).toBe("Nome revisado");
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" })); await screen.findByText("Conta atualizada.");
  expect(api.updateConta.mock.calls[1][0].get("nome")).toBe("Nome revisado");
  expect(api.salvarUsuarioLogado).toHaveBeenCalledWith(expect.objectContaining({ nome: "Nome revisado" }));
});

test("rejeita foto grande, salva foto válida e revoga a prévia ao sair", async () => {
  api.updateConta.mockResolvedValue({ usuario: configuracao.usuario, detail: "Foto atualizada." });
  await montar(); const input = screen.getByLabelText("Escolher foto de perfil");
  const grande = new File(["x"], "grande.png"); Object.defineProperty(grande, "size", { value: 6 * 1024 * 1024 });
  fireEvent.change(input, { target: { files: [grande] } }); await screen.findByText("Escolha uma foto com até 5 MB.");
  expect(api.updateConta).not.toHaveBeenCalled();
  const foto = new File(["x"], "foto.png", { type: "image/png" }); fireEvent.change(input, { target: { files: [foto] } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar foto" })); await screen.findByText("Foto atualizada.");
  expect(api.updateConta.mock.calls[0][0].get("foto")).toBe(foto);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:arquivo-de-teste");
});

test("troca de senha exige requisitos e atualiza os tokens após sucesso", async () => {
  api.alterarSenha.mockResolvedValue({ detail: "Senha alterada.", access: "access-ficticio-novo", refresh: "refresh-ficticio-novo" });
  await montar(); expect(screen.getByRole("button", { name: "Alterar senha" }).disabled).toBe(true);
  mudar("Senha atual", "SenhaAnterior@1"); mudar("Nova senha", "NovaSenha@123"); mudar("Confirmar nova senha", "NovaSenha@123");
  fireEvent.click(screen.getByRole("button", { name: "Mostrar senhas" })); expect(screen.getByLabelText("Nova senha").type).toBe("text");
  fireEvent.click(screen.getByRole("button", { name: "Alterar senha" })); await screen.findByText("Senha alterada.");
  expect(localStorage.getItem("access")).toBe("access-ficticio-novo"); expect(localStorage.getItem("refresh")).toBe("refresh-ficticio-novo");
  expect(screen.getByLabelText("Nova senha").value).toBe("");
});

test("ativa e desativa segundo fator somente com o código e a senha exigidos", async () => {
  api.configurarDoisFatores.mockResolvedValueOnce({ qr_code: "data:image/png;base64,AA==", segredo: "SEGREDO-APENAS-DO-TESTE" }).mockResolvedValue({});
  await montar(); fireEvent.click(screen.getByRole("button", { name: "Ativar verificação em duas etapas" }));
  await screen.findByText("SEGREDO-APENAS-DO-TESTE"); fireEvent.change(screen.getByPlaceholderText("000000"), { target: { value: "123456" } });
  fireEvent.submit(document.querySelector('form[method="post"]')); await screen.findByText(/Verificação em duas etapas ativada/);
  expect(api.configurarDoisFatores).toHaveBeenCalledWith("ativar", { codigo: "123456" });
  const form = screen.getByRole("button", { name: "Desativar" }).closest("form");
  fireEvent.change(form.querySelector('input[type="password"]'), { target: { value: "SenhaDeTeste@1" } });
  fireEvent.change(form.querySelector('input[inputmode="numeric"]'), { target: { value: "654321" } });
  fireEvent.submit(form); await screen.findByText("Verificação em duas etapas desativada.");
  expect(api.configurarDoisFatores).toHaveBeenCalledWith("desativar", { senha: "SenhaDeTeste@1", codigo: "654321" });
});

test("dados do escritório e PIX usam respostas do servidor e mostram validação", async () => {
  api.updateEscritorio.mockResolvedValue({ escritorio: configuracao.escritorio, configuracao_escritorio: { chave_pix: "pix@example.test" }, detail: "Escritório atualizado." });
  await montar(); await aba("config_escritorio"); mudar("Nome do escritório", "Escritório revisado"); mudar("Estado", "sp");
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" })); await screen.findByText("Escritório atualizado.");
  expect(api.updateEscritorio).toHaveBeenCalledWith(expect.objectContaining({ nome: "Escritório revisado", estado: "SP" }));
  mudar("Tipo da chave", "email"); mudar("Chave PIX", "pix@example.test"); mudar("Nome do recebedor (até 25 letras)", "Escritório de teste"); mudar("Cidade (até 15 letras)", "Araçatuba");
  fireEvent.click(screen.getByRole("button", { name: "Salvar PIX" })); await screen.findByText(/Dados do PIX salvos/);
  expect(api.updateEscritorio).toHaveBeenLastCalledWith(expect.objectContaining({ tipo_chave_pix: "email", chave_pix: "pix@example.test" }));
});

test("aparência aplica densidade e tema globalmente e informa falha de persistência", async () => {
  await montar(); await aba("config_aparencia");
  fireEvent.change(screen.getByRole("combobox", { name: "aparencia_densidade" }), { target: { value: "compact" } });
  await screen.findByText(/Preferência salva/); expect(mockAtualizarPreferencias).toHaveBeenCalledWith({ densidade_tabela: "compact" });
  fireEvent.click(screen.getByRole("button", { name: "aparencia_claro" })); await waitFor(() => expect(mockSetTheme).toHaveBeenCalledWith("light"));
  mockAtualizarPreferencias.mockRejectedValueOnce(new Error("Não foi possível salvar o idioma."));
  fireEvent.change(screen.getByRole("combobox", { name: "aparencia_idioma" }), { target: { value: "es-ES" } });
  await screen.findByText("Não foi possível salvar o idioma.");
});

test("notificações permitem inscrição e cancelamento do aparelho e preferências", async () => {
  push.inscreverEsteAparelho.mockResolvedValue({ endpoint: "https://push.example.test/aparelho" });
  push.cancelarEsteAparelho.mockResolvedValue("https://push.example.test/aparelho");
  api.updatePreferencias.mockResolvedValue({ preferencias: {} });
  api.testarPush.mockResolvedValue({ detail: "Solicitação de teste registrada." });
  await montar(); await aba("config_notificacoes"); await screen.findByText(/Desligadas neste aparelho/);
  push.inscricaoAtual.mockResolvedValue({ endpoint: "https://push.example.test/aparelho" });
  fireEvent.click(screen.getByRole("button", { name: "Ativar neste aparelho" })); await screen.findByText("Notificações ativadas neste aparelho.");
  expect(api.inscreverPush).toHaveBeenCalledWith({ endpoint: "https://push.example.test/aparelho" });
  fireEvent.click(await screen.findByRole("button", { name: "Enviar notificação de teste" })); await screen.findByText("Solicitação de teste registrada.");
  fireEvent.click(await screen.findByRole("button", { name: "Desativar neste aparelho" })); await screen.findByText("Notificações desativadas neste aparelho.");
  expect(api.cancelarPush).toHaveBeenCalledWith("https://push.example.test/aparelho");
  fireEvent.click(screen.getByRole("checkbox", { name: /Novo processo cadastrado/ }));
  await screen.findByText("Preferências de notificação salvas.");
  expect(api.updatePreferencias).toHaveBeenCalledWith({ notificacao_novo_processo: false });
});

test("dados administrativos exigem confirmação e exportação relata erro", async () => {
  api.exportarClientesCSV.mockRejectedValueOnce(new Error("Exportação recusada."));
  api.updateEscritorio.mockResolvedValue({ configuracao_escritorio: { retencao_documentos: "5y" } });
  api.desativarEscritorio.mockResolvedValue({ detail: "Escritório desativado." });
  await montar(); await aba("config_dados");
  fireEvent.click(screen.getByRole("button", { name: "Exportar clientes (CSV)" })); await screen.findByText("Exportação recusada.");
  mudar("Tempo de retenção de documentos", "5y"); await screen.findByText("Retenção de documentos atualizada.");
  expect(screen.getByRole("button", { name: "Desativar escritório" }).disabled).toBe(true);
  mudar("Senha do administrador", "SenhaDeTeste@1"); mudar("Digite EXCLUIR para confirmar", "EXCLUIR");
  mockConfirmar.mockResolvedValueOnce(false); fireEvent.click(screen.getByRole("button", { name: "Desativar escritório" }));
  await waitFor(() => expect(mockConfirmar).toHaveBeenCalled()); expect(api.desativarEscritorio).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Desativar escritório" })); await screen.findByText("Escritório desativado.");
  expect(mockRouter.replace).toHaveBeenCalledWith("/");
});

test("relatório sugere destinatário, distingue download e recusa e-mail vazio", async () => {
  api.getClientes.mockResolvedValue([{ id: 7, nome: "Cliente fictício", email: "cliente@example.test", telefone: "18999990000" }]);
  api.getRelatorioCliente.mockResolvedValue({ cliente: { nome: "Cliente fictício" } });
  api.enviarRelatorioClientePorEmail.mockResolvedValue({ detail: "Solicitação de envio registrada." });
  await montar(); await aba("config_relatorios"); await screen.findByRole("option", { name: "Cliente fictício" });
  mudar("relatorios_cliente", "7"); expect(screen.getByLabelText("relatorios_email_label").value).toBe("cliente@example.test");
  fireEvent.click(screen.getByRole("button", { name: "acao_gerar_relatorio" })); await screen.findByText(/Relatório salvo em HTML/);
  expect(api.getRelatorioCliente).toHaveBeenCalledWith("7");
  mudar("relatorios_email_label", ""); fireEvent.click(screen.getByRole("button", { name: "acao_enviar_email" })); await screen.findByText("Informe o e-mail de destino."); expect(api.enviarRelatorioClientePorEmail).not.toHaveBeenCalled();
  mudar("relatorios_email_label", "destino@example.test"); fireEvent.click(screen.getByRole("button", { name: "acao_enviar_email" })); await screen.findByText("Solicitação de envio registrada.");
  expect(api.enviarRelatorioClientePorEmail).toHaveBeenCalledWith("7", "destino@example.test");
});

test("auditoria mostra antes e depois e faturamento deixa explícita a cobrança manual", async () => {
  api.getAuditoria.mockResolvedValue([{ id: 1, acao: "editar", criado_em: "2026-11-11T12:00:00Z", usuario_nome: "Pessoa de teste", descricao: "Cliente atualizado", alteracoes: [{ campo: "ativo", rotulo: "Ativo", anterior: true, novo: false }] }]);
  await montar(); await aba("config_auditoria"); await screen.findByText("Cliente atualizado");
  fireEvent.click(screen.getByRole("button", { name: "Ver 1" })); expect(screen.getByText("Sim")).toBeTruthy(); expect(screen.getByText("Não")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Ocultar" })); expect(screen.queryByText("Sim")).toBeNull();
  await aba("config_faturamento"); await screen.findByText("Gratuito"); expect(screen.getByText(/cobrança online ainda não está conectada/)).toBeTruthy();
});
