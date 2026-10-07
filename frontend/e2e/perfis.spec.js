import { expect, test } from "@playwright/test";
import { abrirMenu, entrar, painel } from "./ajudantes";

test("estagiário não vê o financeiro nem o processo sigiloso", async ({ page }) => {
  await entrar(page, "estagiario");
  const menu = page.locator(".sidebar-nav");
  await expect(menu).toContainText("Processos");
  await expect(menu).not.toContainText("Contratos");

  await abrirMenu(page, "Processos");
  await expect(painel(page).locator("tbody")).toContainText("Reclamação trabalhista");
  await expect(painel(page).locator("tbody")).not.toContainText("Guarda e alimentos");
});

test("administrador vê o sigiloso com o selo de segredo de justiça", async ({ page }) => {
  await entrar(page, "admin");
  await abrirMenu(page, "Processos");
  const linha = painel(page).locator("tbody tr", { hasText: "Guarda e alimentos" });
  await expect(linha.locator(".selo-sigilo")).toBeVisible();
});
