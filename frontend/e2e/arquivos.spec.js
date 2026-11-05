import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { abrirAba, abrirMenu, campo, entrar, painel } from "./ajudantes";

test.use({ trace: "off" });

test.beforeEach(async ({ baseURL }) => {
  expect(["localhost", "127.0.0.1"]).toContain(new URL(baseURL).hostname);
  expect(["localhost", "127.0.0.1"]).toContain(new URL(process.env.NEXT_PUBLIC_API_URL).hostname);
});

test("documento autenticado reserva aba antes de concluir uma transferência lenta", async ({ page }) => {
  await entrar(page);
  await abrirMenu(page, "Documentos");
  await abrirAba(page, "Enviar documento");
  await campo(page, "Processo").selectOption({ index: 1 });
  await campo(page, "Nome do arquivo").fill("AUDITORIA abertura de PDF");
  await campo(page, "Arquivo").setInputFiles({
    name: "auditoria.pdf", mimeType: "application/pdf",
    buffer: readFileSync("../docs/testes/evidencias/2026-11-03/anexo-ficticio.pdf"),
  });
  await painel(page).locator("form").getByRole("button", { name: "Enviar documento", exact: true }).click();
  const linha = painel(page).locator("tbody tr", { hasText: "AUDITORIA abertura de PDF" }).last();
  await expect(linha).toBeVisible();
  let liberar;
  const porta = new Promise((resolve) => { liberar = resolve; });
  await page.route("**/api/documentos/*/download/", async (route) => {
    await porta;
    await route.continue();
  });
  const novaAba = page.waitForEvent("popup");
  const transferencia = page.waitForResponse("**/api/documentos/*/download/");
  await linha.getByRole("button", { name: "Abrir", exact: true }).click();
  const aba = await novaAba;
  expect(aba.url()).toBe("about:blank");
  // Chromium headless pode baixar PDFs em vez de usar o visualizador nativo.
  // Os dois resultados precisam entregar o arquivo autenticado intacto.
  const baixado = aba.waitForEvent("download").then(async (download) => {
      const salvo = await download.path();
      expect(readFileSync(salvo)).toEqual(readFileSync("../docs/testes/evidencias/2026-11-03/anexo-ficticio.pdf"));
      return "download";
  });
  const entrega = Promise.race([
    aba.waitForURL(/^blob:/).then(() => "visualizacao").catch((erro) => {
      if (erro.message.includes("ERR_ABORTED") || erro.message.includes("Download is starting")) return baixado;
      throw erro;
    }),
    baixado,
  ]);
  liberar();
  const resposta = await transferencia;
  expect(resposta.status()).toBe(200);
  expect(resposta.headers()["content-type"]).toContain("application/pdf");
  expect(["visualizacao", "download"]).toContain(await entrega);
  expect(await aba.evaluate(() => window.opener === null)).toBe(true);
});

test("relatório completo abre após receber os dados sem depender de popup tardio", async ({ page }) => {
  await entrar(page);
  await abrirMenu(page, "Configurações");
  await page.getByRole("button", { name: "Relatórios", exact: true }).click();
  await campo(page, "Cliente").selectOption({ label: "Maria Fernanda Costa" });
  const novaAba = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Gerar relatório", exact: true }).click();
  const aba = await novaAba;
  await expect(aba.getByRole("heading", { name: /Relatório do cliente/ })).toBeVisible();
  await expect(aba.locator("body")).toContainText("Maria Fernanda Costa");
  expect(await aba.evaluate(() => window.opener === null)).toBe(true);
});
