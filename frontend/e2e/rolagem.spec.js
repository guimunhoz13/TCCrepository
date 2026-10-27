import { expect, test } from "@playwright/test";
import { abrirAba, abrirMenu, entrar } from "./ajudantes";

async function rolar(page, x, y, delta = 600) {
  await page.mouse.move(x, y);
  await page.mouse.wheel(0, delta);
  // O wheel é assíncrono; aguarda também o término da rolagem suave.
  await page.waitForTimeout(350);
}

test("painel bloqueia a dashboard ao fundo e devolve sua posição ao fechar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await entrar(page);
  await rolar(page, 1350, 500, 500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  expect(Math.abs((await page.locator(".sidebar").boundingBox()).y)).toBeLessThan(2);
  const posicao = await page.evaluate(() => window.scrollY);

  await abrirMenu(page, "Documentos");
  await abrirAba(page, "Enviar documento");
  await rolar(page, 260, 400); // Fora da janela, sobre o fundo escurecido.
  expect(await page.evaluate(() => window.scrollY)).toBe(posicao);
  await rolar(page, 900, 70); // Cabeçalho não rolável.
  expect(await page.evaluate(() => window.scrollY)).toBe(posicao);
  expect(Math.abs((await page.locator(".sidebar").boundingBox()).y)).toBeLessThan(2);

  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(await page.evaluate(() => window.scrollY)).toBe(posicao);
  await rolar(page, 1350, 500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(posicao);
  expect(Math.abs((await page.locator(".sidebar").boundingBox()).y)).toBeLessThan(2);
});

test("só o conteúdo do painel rola e fechar a ajuda não libera a página de trás", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await entrar(page);
  await abrirMenu(page, "Processos");
  await abrirAba(page, "Novo");
  const conteudo = page.locator(".overlay-body");
  const posicao = await page.evaluate(() => window.scrollY);
  await rolar(page, 1200, 500, 450);
  await expect.poll(() => conteudo.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(posicao);
  await conteudo.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await rolar(page, 1200, 500);
  expect(await page.evaluate(() => window.scrollY)).toBe(posicao);

  await page.getByRole("button", { name: "Abrir a ajuda desta aba" }).click();
  await page.getByRole("button", { name: "Fechar a ajuda", exact: true }).click();
  await expect(page.locator(".overlay-panel")).toBeVisible();
  await rolar(page, 260, 400);
  expect(await page.evaluate(() => window.scrollY)).toBe(posicao);
  await expect(page.locator("html")).toHaveCSS("overflow-y", "hidden");
});
