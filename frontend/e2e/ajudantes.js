import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";

export const SENHA = process.env.E2E_SENHA || "Demo@1234";
export const email = (perfil) => `${perfil}@demo.lexnexo.app`;

/** Entra pela tela de login, como uma pessoa faria. */
export async function entrar(page, perfil = "admin") {
  await page.goto("/login");
  // O rótulo é associado pelo efeito da aplicação após a montagem. Esperar
  // por ele evita digitar no HTML inicial antes dos handlers do React.
  await page.getByRole("textbox", { name: /^E-mail/ }).fill(email(perfil));
  await page.getByPlaceholder("••••••••").fill(SENHA);
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await page.waitForURL("**/dashboard**");
  // A URL muda antes de a dashboard terminar de montar/carregar.
  // Começar pelo estado pronto evita clicar no HTML inicial da navegação.
  await expect(page.getByRole("button", { name: "Atualizar dados do painel", exact: true, includeHidden: true })).toBeEnabled();
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
  const rotuloSeguro = rotulo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page
    .locator(".form-field")
    .filter({
      has: page.locator("label", {
        hasText: new RegExp(`^${rotuloSeguro}(?: \\(obrigatório\\))?$`),
      }),
    })
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
