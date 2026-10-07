import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { abrirAba, abrirMenu, entrar } from "./ajudantes";

test("baixa a agenda em .ics com o prazo fatal", async ({ page }) => {
  await entrar(page);
  await abrirMenu(page, "Agenda");
  await abrirAba(page, "Sincronizar");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Baixar agenda/ }).click();
  const arquivo = await download;
  expect(arquivo.suggestedFilename()).toBe("agenda-lexoffice.ics");
  const conteudo = await readFile(await arquivo.path(), "utf8");
  expect(conteudo).toContain("BEGIN:VCALENDAR");
  expect(conteudo).toContain("PRAZO FATAL");
  expect(conteudo).toContain("Audiência de instrução");
});
