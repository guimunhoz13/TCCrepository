import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";

export const SENHA = process.env.E2E_SENHA || "Demo@1234";
export const email = (perfil) => `${perfil}@demo.lexoffice.app`;

/** Entra pela tela de login, como uma pessoa faria. */
export async function entrar(page, perfil = "admin") {
  await page.goto("/login");
  await page.getByPlaceholder("seu@email.com").fill(email(perfil));
  await page.getByPlaceholder("••••••••").fill(SENHA);
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await page.waitForURL("**/dashboard**");
}

/** Abre um item do menu lateral (no celular, abre a gaveta antes). */
export async function abrirMenu(page, item) {
  const menu = page.locator(".sidebar-nav");
  if (!(await menu.isVisible())) {
    await page.getByRole("button", { name: /abrir o menu/i }).click();
  }
  await menu.getByText(item, { exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

export async function abrirAba(page, aba) {
  await page.locator(".overlay-tabs").getByText(aba, { exact: true }).click();
}

/** Campo de formulário pelo rótulo visível. */
export function campo(page, rotulo) {
  return page
    .locator(".form-field")
    .filter({ has: page.locator("label", { hasText: new RegExp(`^${rotulo}$`) }) })
    .locator("input, select, textarea")
    .first();
}

/** Falha se a tela tiver violação de acessibilidade WCAG 2 A/AA. */
export async function semViolacoesDeAcessibilidade(page) {
  const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const resumo = resultado.violations.map((v) => `${v.id}: ${v.nodes[0]?.target?.join(" ")}`);
  expect(resumo).toEqual([]);
}

/** O painel (diálogo) aberto por cima da dashboard. */
export function painel(page) {
  return page.getByRole("dialog");
}
