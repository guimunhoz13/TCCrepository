import { expect, test } from "@playwright/test";
import { entrar } from "./ajudantes";

test("dashboard cabe em notebook com escala de 125%", async ({ page }) => {
  // Um painel físico de 1366px costuma oferecer cerca de 1093 CSS px quando
  // o Windows está em 125%. Esta é a faixa que antes empilhava tudo e deixava
  // o sino no canto, com o menu de notificações para fora da tela.
  await page.setViewportSize({ width: 1093, height: 700 });
  await entrar(page);

  await expect(page.locator(".sidebar-nav")).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir o menu" })).toBeHidden();

  const busca = await page.locator(".global-search").boundingBox();
  const sino = await page.getByRole("button", { name: "Notificações" }).boundingBox();

  expect(busca).not.toBeNull();
  expect(sino).not.toBeNull();
  expect(Math.abs(busca.y + busca.height / 2 - (sino.y + sino.height / 2))).toBeLessThan(4);
  expect(sino.x).toBeGreaterThanOrEqual(0);
  expect(sino.x + sino.width).toBeLessThanOrEqual(1093);

  const colunasDosIndicadores = await page.locator(".stats-grid").evaluate((elemento) =>
    getComputedStyle(elemento).gridTemplateColumns.split(" ").filter(Boolean).length
  );
  expect(colunasDosIndicadores).toBe(4);

  await page.getByRole("button", { name: "Notificações" }).click();
  const menu = await page.locator(".notif-dropdown").boundingBox();
  expect(menu).not.toBeNull();
  expect(menu.x).toBeGreaterThanOrEqual(0);
  expect(menu.x + menu.width).toBeLessThanOrEqual(1093);

  const largura = await page.evaluate(() => ({
    pagina: document.documentElement.scrollWidth,
    tela: window.innerWidth,
  }));
  expect(largura.pagina).toBeLessThanOrEqual(largura.tela);
});
