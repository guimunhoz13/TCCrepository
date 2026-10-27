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

test("telas principais cabem no celular e mantêm os controles acessíveis", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await entrar(page);

  for (const item of ["Clientes", "Processos", "Agenda", "Documentos", "Contratos", "Tarefas"]) {
    await abrirMenu(page, item);
    await expect(painel(page).getByRole("button", { name: "Fechar" })).toBeVisible();
    const largura = await page.evaluate(() => ({
      pagina: document.documentElement.scrollWidth,
      tela: window.innerWidth,
    }));
    expect(largura.pagina, `A tela ${item} vazou horizontalmente`).toBeLessThanOrEqual(largura.tela);
    await painel(page).getByRole("button", { name: "Fechar" }).click();
  }
});

test("gaveta e painel mantêm a dashboard parada no celular", async ({ page }) => {
  await entrar(page);
  await page.mouse.move(350, 450);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(350);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const posicao = await page.evaluate(() => window.scrollY);
  await page.locator(".barra-inferior").getByRole("button", { name: "Menu", exact: true }).click();
  await page.mouse.move(390, 400);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.scrollY)).toBe(posicao);
  await page.locator(".sidebar-nav").getByRole("button", { name: "Documentos", exact: true }).click();
  await expect(page.locator(".overlay-panel")).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("overflow-y", "hidden");
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.scrollY)).toBe(posicao);
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.locator("html")).not.toHaveCSS("overflow-y", "hidden");
  expect(await page.evaluate(() => window.scrollY)).toBe(posicao);
});
