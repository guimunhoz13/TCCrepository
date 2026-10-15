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
