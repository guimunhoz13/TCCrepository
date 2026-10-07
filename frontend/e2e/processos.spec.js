import { expect, test } from "@playwright/test";
import { abrirMenu, entrar, painel } from "./ajudantes";

test("abre a ficha do processo e gera a atualização para o cliente", async ({ page }) => {
  await entrar(page);
  await abrirMenu(page, "Processos");
  await painel(page).locator("tbody tr", { hasText: "0001234-56.2026.5.15.0002" }).click();

  await expect(page.locator(".ficha-identidade h2")).toHaveText("0001234-56.2026.5.15.0002");
  await expect(page.getByText("Conclusos para decisão").first()).toBeVisible();

  await page.getByRole("button", { name: "Atualizar o cliente" }).click();
  const mensagem = page.getByLabel("Mensagem para o cliente");
  // Sem chave da OpenAI no CI, vale o modelo automático, que traduz o
  // andamento para linguagem simples.
  await expect(mensagem).toHaveValue(/Olá, Maria!/);
  await expect(mensagem).toHaveValue(/O processo foi para o juiz analisar/);
});
