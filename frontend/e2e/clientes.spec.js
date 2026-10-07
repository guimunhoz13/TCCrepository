import { expect, test } from "@playwright/test";
import { abrirAba, abrirMenu, campo, entrar, painel } from "./ajudantes";

test("cadastra um cliente e encontra na busca", async ({ page }) => {
  const sufixo = Date.now().toString().slice(-8);
  const nome = `Cliente E2E ${sufixo}`;
  await entrar(page);
  await abrirMenu(page, "Clientes");
  await abrirAba(page, "Novo");

  await campo(page, "Nome").fill(nome);
  await campo(page, "CPF").fill(`000${sufixo}`);
  await campo(page, "E-mail").fill(`cliente.e2e.${sufixo}@gmail.com`);
  await campo(page, "Telefone").fill("18999990000");
  await campo(page, "Endereço").fill("Rua do Teste, 100 - Araçatuba/SP");
  await page.getByText("O cliente autorizou o tratamento dos dados pessoais").click();
  await page.getByRole("button", { name: /Cadastrar cliente/i }).click();

  await expect(page.locator(".alert-success")).toContainText("cadastrado");
  await page.getByPlaceholder(/Buscar por nome/).fill(sufixo);
  await expect(painel(page).locator("tbody")).toContainText(nome);
});
