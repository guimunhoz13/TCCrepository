import { expect, test } from "@playwright/test";
import { abrirMenu, entrar, painel } from "./ajudantes";

test("no celular, o menu abre em gaveta e a lista cabe na tela", async ({ page }) => {
  await entrar(page);
  await expect(page.locator(".barra-inferior")).toBeVisible();

  await abrirMenu(page, "Clientes");
  await expect(painel(page).locator("tbody")).toContainText("Maria Fernanda Costa");

  const larguras = await page.evaluate(() => ({
    pagina: document.documentElement.scrollWidth,
    tela: window.innerWidth,
  }));
  expect(larguras.pagina).toBeLessThanOrEqual(larguras.tela);
});
