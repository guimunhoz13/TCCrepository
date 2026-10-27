import { expect, test } from "@playwright/test";
import { abrirMenu, entrar } from "./ajudantes";

test("foto é salva separadamente e continua disponível após recarregar", async ({ page }) => {
  await entrar(page);
  await abrirMenu(page, "Configurações");
  await page.getByLabel("Escolher foto de perfil").setInputFiles({
    name: "perfil-teste.png", mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGNkYGhgwAaYsIoOWgkAaYgAkK2VydMAAAAASUVORK5CYII=", "base64"),
  });
  const salva = page.waitForResponse((res) => res.url().includes("/configuracoes/conta/") && res.request().method() === "PATCH");
  await page.getByRole("button", { name: "Salvar foto", exact: true }).click();
  expect((await salva).ok()).toBeTruthy();
  await expect(page.getByRole("button", { name: "Salvar foto", exact: true })).toBeHidden();
  await page.reload();
  await expect.poll(() => page.locator(".topbar .avatar-img").evaluateAll((imgs) => imgs.some((img) => img.complete && img.naturalWidth > 0))).toBe(true);
});

test("modo compacto reduz visivelmente as linhas e mantém a escolha", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const carregamento = page.waitForResponse((res) => /\/api\/configuracoes\/$/.test(res.url()) && res.ok());
  await entrar(page);
  const iniciais = await (await carregamento).json();
  await expect(page.locator("html")).toHaveAttribute("data-density", iniciais.preferencias.densidade_tabela);
  const densidade = page.getByRole("button", { name: "Alternar densidade das listas" });
  async function alternar() {
    const salva = page.waitForResponse((res) => res.url().includes("/configuracoes/preferencias/") && res.request().method() === "PATCH");
    await densidade.click();
    expect((await salva).ok()).toBeTruthy();
  }
  if ((await densidade.getAttribute("aria-pressed")) === "true") await alternar();
  await expect(page.locator("html")).toHaveAttribute("data-density", "comfortable");
  await abrirMenu(page, "Clientes");
  const linha = page.locator(".overlay-body tbody tr").first();
  await expect(linha).toBeVisible();
  const confortavel = (await linha.boundingBox()).height;
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await alternar();
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
  await abrirMenu(page, "Clientes");
  await expect(linha).toBeVisible();
  expect((await linha.boundingBox()).height).toBeLessThan(confortavel * 0.85);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
});
