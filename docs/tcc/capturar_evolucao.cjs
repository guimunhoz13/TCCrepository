// Execute apenas contra a demonstração local, nunca contra dados de clientes.
const path = require("path");
const { chromium } = require("../../frontend/node_modules/@playwright/test");

(async () => {
  const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
  if (!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)) {
    throw new Error("As capturas documentais exigem a demonstração local.");
  }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
    await page.goto(`${baseURL}/login`);
    await page.getByPlaceholder("seu@email.com").fill("admin@demo.lexnexo.app");
    await page.getByPlaceholder("••••••••").fill(process.env.E2E_SENHA || "Demo@1234");
    await page.getByRole("button", { name: "Entrar no sistema" }).click();
    await page.waitForURL("**/dashboard**");
    await page.locator(".sync-indicator").filter({ hasText: /^Atualizado/ }).waitFor();
    if (await page.locator("html").getAttribute("data-theme") === "dark") {
      await page.getByRole("button", { name: "Alternar tema" }).click();
    }
    await page.screenshot({ path: path.join(__dirname, "diagramas/print_evolucao_dashboard.png"), animations: "disabled" });
    await page.locator(".sidebar-nav").getByRole("button", { name: "Processos", exact: true }).click();
    await page.locator(".overlay-tabs").getByText("Intimações", { exact: true }).click();
    await page.getByRole("button", { name: /Conferir prazo|Revisar conferência/ }).first().click();
    await page.locator(".conferencia-prazo").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(__dirname, "diagramas/print_evolucao_conferencia.png"), animations: "disabled" });
    console.log("Capturas da evolução geradas com a demonstração local.");
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
