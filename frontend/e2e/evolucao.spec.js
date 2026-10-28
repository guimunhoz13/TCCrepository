import { expect, test } from "@playwright/test";
import { abrirAba, abrirMenu, campo, entrar, semViolacoesDeAcessibilidade } from "./ajudantes";

test("cadastro avança por etapas, conserva os dados e aceita CNPJ com letras", async ({ page }) => {
  let enviado;
  await page.route("**/api/escritorios/registrar/", async (route) => {
    enviado = route.request().postDataJSON();
    await route.fulfill({ json: { requer_verificacao_email: false } });
  });
  await page.route("https://brasilapi.com.br/api/cnpj/**", (route) => route.fulfill({ status: 404, json: {} }));
  await page.goto("/cadastro");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("group", { name: "Dados do escritório" })).toBeVisible();
  await campo(page, "Nome do escritório").fill("Escritório de teste");
  await campo(page, "CNPJ").fill("12ABC34501DE35");
  await expect(campo(page, "CNPJ")).toHaveValue("12.ABC.345/01DE-35");
  await campo(page, "Telefone").fill("11988887777");
  await campo(page, "E-mail do escritório").fill("escritorio@example.com");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await campo(page, "Endereço").fill("Rua de Teste, 10");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await campo(page, "Nome do admin").fill("Administrador de teste");
  await campo(page, "E-mail do admin").fill("admin@example.com");
  await campo(page, "Senha do admin").fill("Teste@12345");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Está tudo certo?" })).toBeVisible();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(campo(page, "E-mail do admin")).toHaveValue("admin@example.com");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Criar escritório", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  expect(enviado.cnpj).toBe("12.ABC.345/01DE-35");
});

test("busca abre diretamente o cliente escolhido", async ({ page }) => {
  await entrar(page);
  await page.getByRole("textbox", { name: "Buscar em todo o escritório" }).fill("Maria");
  await page.locator(".global-search-results").getByRole("button").filter({ hasText: "Maria Fernanda" }).first().click();
  await expect(page.getByRole("region", { name: "Registro selecionado na busca" })).toContainText("Maria Fernanda");
  await expect(page.locator(".overlay-tabs .active")).toHaveText("Detalhe");
});

test("menu recolhido e densidade sobrevivem ao recarregamento sem cortar controles", async ({ page }) => {
  await page.setViewportSize({ width: 1093, height: 768 });
  const configuracao = page.waitForResponse((res) => res.url().includes("/configuracoes/") && res.request().method() === "GET");
  await entrar(page);
  const preferencias = (await (await configuracao).json()).preferencias;
  await expect(page.getByRole("button", { name: "Alternar densidade das listas" }))
    .toHaveAttribute("aria-pressed", String(preferencias.densidade_tabela === "compact"));
  await page.getByRole("button", { name: "Recolher menu lateral" }).click();
  const densidade = page.getByRole("button", { name: "Alternar densidade das listas" });
  const estadoAnterior = await densidade.getAttribute("aria-pressed");
  const salva = page.waitForResponse((res) => res.url().includes("/configuracoes/preferencias/") && res.request().method() === "PATCH");
  await densidade.click();
  expect((await salva).ok()).toBeTruthy();
  await page.reload();
  await expect(page.locator(".sidebar")).toHaveClass(/compacta/);
  await expect(page.locator("html")).toHaveAttribute("data-density", estadoAnterior === "true" ? "comfortable" : "compact");
  await page.getByRole("button", { name: "Expandir menu lateral" }).click();
  const caixa = await page.getByRole("button", { name: /^Notificações/ }).boundingBox();
  expect(caixa.x + caixa.width).toBeLessThanOrEqual(1093);
});

test("advogado confere uma intimação e a revisão fica identificada", async ({ page }) => {
  await entrar(page);
  await abrirMenu(page, "Processos");
  await abrirAba(page, "Intimações");
  await page.getByRole("button", { name: /^(Conferir prazo|Revisar conferência)$/ }).first().click();
  const form = page.locator(".conferencia-prazo");
  await form.getByLabel("Como você conferiu?").fill("Texto integral e calendário do tribunal conferidos no teste.");
  await form.getByRole("checkbox").check();
  await semViolacoesDeAcessibilidade(page);
  await form.getByRole("button", { name: "Confirmar prazo e registrar revisão" }).click();
  await expect(page.locator(".intimacao-conferencia").filter({ hasText: "Conferido por" }).first()).toBeVisible();
});
