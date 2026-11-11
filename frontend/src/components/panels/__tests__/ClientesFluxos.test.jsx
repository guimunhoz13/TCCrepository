/** @jest-environment jsdom */
import { montarPainel, prepararPainel, preencher, submeter, mockConfirmar, mockRefresh } from "../../../../test-support/painel";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import ClientesPanel from "../ClientesPanel";
import * as api from "@/services/api";
import { buscarEmpresaPorCnpj } from "@/utils/cnpj";
import { buscarEnderecoPorCep } from "@/utils/cep";
jest.mock("@/utils/cnpj", () => ({ ...jest.requireActual("@/utils/cnpj"), buscarEmpresaPorCnpj: jest.fn() }));
jest.mock("@/utils/cep", () => ({ buscarEnderecoPorCep: jest.fn() }));
const cliente = { id: 7, nome: "Cliente de teste", cpf: "12345678900", email: "cliente@example.test", telefone: "18999990000", endereco: "Rua de teste", ativo: true, consentimento_lgpd: true, documento_identidade_enviado: true };
beforeEach(() => { prepararPainel(); api.getClientes.mockResolvedValue([cliente]); });

test("cadastro físico envia consentimento, dados opcionais e anexos sem perder o vínculo", async () => {
  await montarPainel(ClientesPanel, "clientes", "novo");
  for (const [k,v] of Object.entries({ nome: "Ana de Teste", cpf: "12345678900", email: "ana@example.test", telefone: "18999990000", endereco: "Rua Um", data_nascimento: "1990-02-03", rg: "123456789", estado_civil: "solteiro", nacionalidade: "Brasileira" })) preencher(k,v);
  fireEvent.click(document.querySelector('[name="consentimento_lgpd"]'));
  const foto = new File(["foto"], "foto.png", { type: "image/png" });
  const identidade = new File(["identidade"], "identidade.pdf");
  fireEvent.change(document.querySelector('[name="foto"]'), { target: { files: [foto] } });
  fireEvent.change(document.querySelector('[name="documento_identidade"]'), { target: { files: [identidade] } });
  submeter();
  await screen.findByText("Cliente cadastrado com sucesso.");
  const payload = api.createCliente.mock.calls[0][0];
  expect(payload.get("nome")).toBe("Ana de Teste");
  expect(payload.get("consentimento_lgpd")).toBe("true");
  expect(payload.get("data_nascimento")).toBe("1990-02-03");
  expect(payload.get("cnpj")).toBe("");
  expect(payload.get("foto")).toBe(foto);
  expect(payload.get("documento_identidade")).toBe(identidade);
  expect(mockRefresh).toHaveBeenCalled();
});

test("consulta CNPJ preenche vazios, preserva edição manual e omite dados físicos", async () => {
  buscarEmpresaPorCnpj.mockResolvedValue({ razaoSocial: "Empresa consultada", email: "empresa@example.test", telefone: "1833334444", logradouro: "Rua Dois", numero: "20", bairro: "Centro", municipio: "Araçatuba", uf: "SP", cep: "16010000", situacaoCadastral: "ATIVA" });
  await montarPainel(ClientesPanel, "clientes", "novo");
  preencher("tipo_pessoa", "juridica");
  preencher("nome", "Nome revisado manualmente");
  fireEvent.blur(preencher("cnpj", "11222333000181"));
  await waitFor(() => expect(document.querySelector('[name="email"]').value).toBe("empresa@example.test"));
  expect(document.querySelector('[name="nome"]').value).toBe("Nome revisado manualmente");
  expect(document.querySelector('[name="cpf"]')).toBeNull();
  submeter();
  await screen.findByText("Cliente cadastrado com sucesso.");
  const payload = api.createCliente.mock.calls[0][0];
  expect(payload.get("tipo_pessoa")).toBe("juridica");
  expect(payload.get("cpf")).toBe("");
  expect(payload.has("data_nascimento")).toBe(false);
});

test("CEP preenche endereço e falha no cadastro conserva a edição", async () => {
  buscarEnderecoPorCep.mockResolvedValue({ logradouro: "Rua do CEP", bairro: "Centro", cidade: "Araçatuba", estado: "SP" });
  api.createCliente.mockRejectedValue(new Error("CPF já cadastrado."));
  await montarPainel(ClientesPanel, "clientes", "novo");
  preencher("nome", "Preservar este nome");
  fireEvent.blur(preencher("cep", "16010000"));
  await waitFor(() => expect(document.querySelector('[name="endereco"]').value).toContain("Rua do CEP"));
  submeter();
  await screen.findByText("CPF já cadastrado.");
  expect(document.querySelector('[name="nome"]').value).toBe("Preservar este nome");
  expect(api.excluirRascunho).not.toHaveBeenCalled();
});

test("edita o cliente existente e permite cancelar sem gravar", async () => {
  await montarPainel(ClientesPanel, "clientes");
  await screen.findByText(cliente.nome);
  fireEvent.click(screen.getByRole("button", { name: "acao_editar" }));
  expect(document.querySelector('[name="nome"]').value).toBe(cliente.nome);
  fireEvent.click(screen.getByRole("button", { name: "acao_cancelar" }));
  expect(api.updateCliente).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "acao_editar" }));
  preencher("nome", "Cliente revisado");
  submeter();
  await screen.findByText("Cliente atualizado com sucesso.");
  expect(api.updateCliente).toHaveBeenCalledWith(7, expect.any(FormData));
  expect(api.updateCliente.mock.calls[0][1].get("nome")).toBe("Cliente revisado");
});

test("LGPD e exclusão respeitam a confirmação antes da operação", async () => {
  await montarPainel(ClientesPanel, "clientes");
  await screen.findByText(cliente.nome);
  const excluir = screen.getByRole("button", { name: "acao_excluir" });
  mockConfirmar.mockResolvedValueOnce(false);
  fireEvent.click(excluir);
  await waitFor(() => expect(mockConfirmar).toHaveBeenCalled());
  expect(api.deleteCliente).not.toHaveBeenCalled();
  fireEvent.click(excluir);
  await waitFor(() => expect(api.deleteCliente).toHaveBeenCalledWith(7));
});
