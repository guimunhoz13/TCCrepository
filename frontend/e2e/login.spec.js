import { expect, test } from "@playwright/test";
import { email, entrar, semViolacoesDeAcessibilidade } from "./ajudantes";

test("senha errada mostra o erro e não entra", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("seu@email.com").fill(email("admin"));
  await page.getByPlaceholder("••••••••").fill("SenhaErrada@1");
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page.locator(".alert-error")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("entra e chega na dashboard sem violações de acessibilidade", async ({ page }) => {
  await entrar(page);
  await expect(page.locator(".sidebar-nav")).toContainText("Processos");
  await expect(page.getByText(/Prazo: réplica/).first()).toBeVisible();
  await semViolacoesDeAcessibilidade(page);
});

test("a tela de login também passa na checagem de acessibilidade", async ({ page }) => {
  await page.goto("/login");
  await semViolacoesDeAcessibilidade(page);
});
