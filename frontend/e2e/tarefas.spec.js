import { expect, test } from "@playwright/test";
import { abrirAba, abrirMenu, entrar } from "./ajudantes";

test("move um cartão no quadro Kanban e volta", async ({ page }) => {
  await entrar(page);
  await abrirMenu(page, "Tarefas");
  await abrirAba(page, "Quadro");

  const tarefa = "Ligar para a testemunha";
  const colunas = page.locator(".quadro-coluna");
  await expect(colunas.nth(0)).toContainText(tarefa);

  await page.getByRole("button", { name: `Mover "${tarefa}" para Fazendo` }).click();
  await expect(colunas.nth(1)).toContainText(tarefa);

  await page.getByRole("button", { name: `Mover "${tarefa}" para A fazer` }).click();
  await expect(colunas.nth(0)).toContainText(tarefa);
});
