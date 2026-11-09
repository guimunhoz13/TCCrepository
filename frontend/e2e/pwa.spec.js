import { expect, test } from "@playwright/test";
import { abrirMenu, entrar } from "./ajudantes";

// Os demais testes bloqueiam o worker para que page.route seja confiável.
// Este cenário usa o worker real, com cache e rede offline do navegador.
test.use({ serviceWorkers: "allow" });

test("PWA mostra a página offline e não armazena respostas privadas no cache", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Emulação da rede do service worker validada no Chromium; demais cenários cobrem os outros navegadores.");
  await entrar(page);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker?.controller)), { timeout: 20000 }).toBe(true);
  await abrirMenu(page, "Clientes");
  await expect(page.getByRole("dialog").locator(".linha-carregando")).toHaveCount(0);
  const caminhos = await page.evaluate(async () => {
    const chaves = await caches.keys();
    const requisicoes = await Promise.all(chaves.map(async (chave) => (await caches.open(chave)).keys()));
    return requisicoes.flat().map((requisicao) => new URL(requisicao.url).pathname);
  });
  expect(caminhos).toContain("/offline");
  expect(caminhos.some((caminho) => caminho.startsWith("/api/") || caminho.startsWith("/dashboard"))).toBe(false);
  try {
    await context.setOffline(true);
    const navegacao = await page.goto("/dashboard?auditoria-offline=1");
    await test.info().attach("navegacao-offline", { contentType: "application/json", body: JSON.stringify({
      online: await page.evaluate(() => navigator.onLine),
      servidaPeloWorker: navegacao.fromServiceWorker(),
      status: navegacao.status(),
      caminho: new URL(navegacao.url()).pathname,
    }) });
    await expect(page.getByRole("heading", { name: "Sem conexão", exact: true })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Maria Fernanda Costa");
    await expect(page.locator("body")).toContainText("precisa de internet");
  } finally {
    await context.setOffline(false);
  }
});
