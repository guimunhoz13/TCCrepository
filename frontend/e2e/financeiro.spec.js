import { expect, test } from "@playwright/test";
import { abrirMenu, entrar } from "./ajudantes";

test("gera o PIX copia e cola de uma parcela pendente", async ({ page }) => {
  await entrar(page, "financeiro");
  await abrirMenu(page, "Contratos");
  await page.getByRole("button", { name: /Ver parcelas/ }).first().click();
  await page.locator('button[aria-label^="Cobrar a parcela"]').first().click();

  const codigo = page.getByLabel("PIX copia e cola");
  await expect(codigo).toHaveValue(/^000201/);
  await expect(codigo).toHaveValue(/br\.gov\.bcb\.pix/);
  await expect(page.getByRole("dialog", { name: "Cobrar com PIX" }).locator("img")).toBeVisible();
});
