import { expect, test } from "@playwright/test";
import { entrar } from "./ajudantes";

test("navega de Compromissos para o Assistente IA sem ficar preso", async ({ page }) => {
  await entrar(page);
  const menu = page.locator(".sidebar-nav");

  await menu.getByText("Compromissos", { exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/compromissos$/);
  await expect(
    page.getByRole("heading", { name: "Compromissos futuros" })
  ).toBeVisible();

  await menu.getByText("Assistente IA", { exact: true }).click();
  await expect(page).toHaveURL(/\/assistente-ia$/);
  await expect(
    page.getByRole("heading", { name: "Assistente IA", exact: true }).first()
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
