/** @jest-environment jsdom */
import { montarPainel, prepararPainel, preencher, submeter, mockConfirmar, mockAvisar, mockRefresh } from "../../../../test-support/painel";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import DocumentosPanel from "../DocumentosPanel";
import * as api from "@/services/api";

const documento = { id: 9, nome_arquivo: "Declaração fictícia", numero_processo: "PROC-038", enviado_em: "2026-11-11T15:00:00Z" };
beforeEach(() => {
  prepararPainel();
  api.getDocumentos.mockResolvedValue([documento]);
  api.getProcessos.mockResolvedValue([{ id: 3, numero_processo: "PROC-038" }]);
});

test("envia arquivo e vínculo corretos, atualiza a lista e descarta o rascunho", async () => {
  await montarPainel(DocumentosPanel, "documentos", "novo");
  preencher("processo", "3");
  const arquivo = new File(["PDF de teste"], "anexo.pdf", { type: "application/pdf" });
  fireEvent.change(document.querySelector('[name="arquivo"]'), { target: { files: [arquivo] } });
  submeter();
  await screen.findByText("Documento enviado com sucesso.");
  const payload = api.createDocumento.mock.calls[0][0];
  expect(payload.get("arquivo")).toBe(arquivo);
  expect(payload.get("processo")).toBe("3");
  expect(payload.get("nome_arquivo")).toBe("anexo.pdf");
  expect(api.excluirRascunho).toHaveBeenCalledWith("novo-documento");
  expect(mockRefresh).toHaveBeenCalled();
  expect(await screen.findByText(documento.nome_arquivo)).toBeTruthy();
});

test("exige arquivo e preserva os campos quando o servidor recusa o envio", async () => {
  api.createDocumento.mockRejectedValue(new Error("Arquivo maior que o limite."));
  await montarPainel(DocumentosPanel, "documentos", "novo");
  submeter();
  expect(screen.getByText("Selecione um arquivo.")).toBeTruthy();
  expect(api.createDocumento).not.toHaveBeenCalled();
  preencher("nome_arquivo", "Minuta para revisar");
  fireEvent.change(document.querySelector('[name="arquivo"]'), { target: { files: [new File(["x"], "minuta.pdf")] } });
  submeter();
  await screen.findByText("Arquivo maior que o limite.");
  expect(document.querySelector('[name="nome_arquivo"]').value).toBe("Minuta para revisar");
  expect(api.excluirRascunho).not.toHaveBeenCalled();
});

test("abertura com erro informa a falha; exclusão exige confirmação e permite cancelar", async () => {
  api.abrirDocumento.mockRejectedValue(new Error("Acesso ao arquivo negado."));
  await montarPainel(DocumentosPanel, "documentos");
  await screen.findByText(documento.nome_arquivo);
  fireEvent.click(screen.getByRole("button", { name: "acao_abrir" }));
  await screen.findByText("Acesso ao arquivo negado.");
  mockConfirmar.mockResolvedValueOnce(false);
  fireEvent.click(screen.getByRole("button", { name: "acao_excluir" }));
  await waitFor(() => expect(mockConfirmar).toHaveBeenCalled());
  expect(api.deleteDocumento).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "acao_excluir" }));
  await waitFor(() => expect(api.deleteDocumento).toHaveBeenCalledWith(9));
  expect(mockAvisar).toHaveBeenCalledWith("Documento excluído.");
});

test("perfil de consulta não recebe ações de inclusão e exclusão", async () => {
  localStorage.setItem("usuarioLogado", JSON.stringify({ id: 1, permissoes: { documentos: ["ver"] } }));
  await montarPainel(DocumentosPanel, "documentos");
  await screen.findByText(documento.nome_arquivo);
  expect(screen.queryByRole("button", { name: "acao_enviar_documento" })).toBeNull();
  expect(screen.queryByRole("button", { name: "acao_excluir" })).toBeNull();
  expect(screen.getByRole("button", { name: "acao_abrir" })).toBeTruthy();
});
