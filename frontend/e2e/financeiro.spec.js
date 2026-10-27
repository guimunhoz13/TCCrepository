import { expect, test } from "@playwright/test";
import { abrirMenu, entrar, semViolacoesDeAcessibilidade } from "./ajudantes";

test("gera o PIX copia e cola de uma parcela pendente", async ({ page }) => {
  await entrar(page, "financeiro");
  await abrirMenu(page, "Contratos");
  await page.getByRole("button", { name: /Ver parcelas/ }).first().click();
  await page.locator('button[aria-label^="Cobrar a parcela"]').first().click();
  await page.getByLabel("Tipo de operação").selectOption("real");

  const codigo = page.getByLabel("PIX copia e cola");
  await expect(codigo).toHaveValue(/^000201/);
  await expect(codigo).toHaveValue(/br\.gov\.bcb\.pix/);
  await expect(page.getByRole("dialog", { name: "Cobrar com PIX" }).locator("img")).toBeVisible();
});

test("Pix de teste confirma honorários sem dar baixa na parcela", async ({ page }) => {
  await entrar(page, "financeiro");
  await abrirMenu(page, "Contratos");
  await page.getByRole("button", { name: /Ver parcelas/ }).first().click();
  await page.locator('button[aria-label^="Cobrar a parcela"]').first().click();
  const janela = page.getByRole("dialog", { name: "Cobrar com PIX" });
  await expect(janela.getByLabel("Código de teste não pagável")).toHaveValue(/^LEXNEXO-TESTE-SEM-VALOR:/);
  await expect(janela.getByRole("button", { name: "Enviar pelo WhatsApp" })).toHaveCount(0);
  await semViolacoesDeAcessibilidade(page);
  const resposta = page.waitForResponse((res) => res.url().includes("/simular-pix/") && res.request().method() === "PATCH");
  await janela.getByRole("button", { name: "Simular pagamento aprovado" }).click();
  expect((await resposta).ok()).toBeTruthy();
  await expect(janela.getByRole("status")).toContainText("parcela real continua pendente");
  await janela.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.locator('button[aria-label^="Cobrar a parcela"]').first()).toBeVisible();
});

test("Pix de teste dos planos confirma sem ativar assinatura", async ({ page }) => {
  await entrar(page);
  await abrirMenu(page, "Planos");
  const planoAntes = await page.locator("#uso-do-plano").innerText();
  await page.getByRole("button", { name: "Testar Pix do Básico" }).click();
  const janela = page.getByRole("dialog", { name: "Testar Pix do plano Básico" });
  await expect(janela.getByLabel("Código de teste da assinatura")).toHaveValue(/^LEXNEXO-TESTE-SEM-VALOR:/);
  await semViolacoesDeAcessibilidade(page);
  await janela.getByRole("button", { name: "Simular assinatura aprovada" }).click();
  await expect(janela.getByRole("status")).toContainText("seu plano real não foi alterado");
  await janela.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.locator("#uso-do-plano")).toHaveText(planoAntes);
});
