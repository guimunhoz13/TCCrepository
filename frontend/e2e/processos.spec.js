import { expect, test } from "@playwright/test";
import {
  abrirAba,
  abrirMenu,
  campo,
  entrar,
  painel,
  semViolacoesDeAcessibilidade,
} from "./ajudantes";

test("orienta o cadastro, mostra o progresso e explica campos obrigatórios", async ({ page }) => {
  await entrar(page);
  // A rodada anterior deixa um rascunho por testar sem concluir o cadastro.
  // Limpa apenas esse rascunho no banco E2E local para repetir o estado vazio.
  const token = await page.evaluate(() => localStorage.getItem("access"));
  const api = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  expect(["localhost", "127.0.0.1"]).toContain(new URL(api).hostname);
  const limpeza = await page.request.delete(`${api}/rascunhos/novo-processo/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect([204, 404]).toContain(limpeza.status());
  await abrirMenu(page, "Processos");
  await abrirAba(page, "Novo");

  await expect(page.getByRole("heading", { name: "Cadastre o processo por etapas" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Etapas do cadastro do processo" })).toBeVisible();
  await expect(page.locator(".processo-form-progresso")).toContainText("0 de 5 obrigatórios");

  await page.getByRole("button", { name: "Cadastrar processo" }).click();
  await expect(page.getByText(/Preencha o campo “Número do processo”/)).toBeVisible();

  await campo(page, "Número do processo").fill("0009876-54.2026.8.26.0100");
  await campo(page, "Título").fill("Processo guiado E2E");
  await campo(page, "Descrição").fill("Validação do cadastro orientado sem gravar dados.");
  await expect(page.locator(".processo-form-progresso")).toContainText("3 de 5 obrigatórios");
  await expect(page.getByRole("button", { name: /Identificação/ })).toHaveClass(/concluida/);

  await semViolacoesDeAcessibilidade(page);
});

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
