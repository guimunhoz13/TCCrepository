import { expect, test } from "@playwright/test";
import { abrirAba, abrirMenu, entrar, painel } from "./ajudantes";

// Não guardar credenciais/tokens de login em traces desta rodada.
test.use({ trace: "off" });

test("sem sessão, dashboard redireciona para login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("logout encerra a navegação autenticada", async ({ page }) => {
  await entrar(page);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  // Sair retorna à página pública; a dashboard continua exigindo login.
  await expect(page).toHaveURL("/");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

for (const perfil of ["estagiario", "secretaria"]) {
  test(`ficha respeita o acesso financeiro de ${perfil}`, async ({ page }) => {
    await entrar(page, perfil);
    await abrirMenu(page, "Processos");
    await painel(page).locator("tbody tr", { hasText: "0001234-56.2026.5.15.0002" }).click();
    await expect(page.locator(".ficha-identidade h2")).toHaveText("0001234-56.2026.5.15.0002");
    await expect(page.getByRole("heading", { name: "Resumo financeiro", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Contrato", exact: true })).toHaveCount(0);
    if (perfil === "secretaria") {
      await expect(page.getByRole("heading", { name: "Apontamentos de horas", exact: true })).toHaveCount(0);
    }
  });
}

test("falha simulada de clientes aparece e recupera ao reabrir", async ({ page }) => {
  await entrar(page);
  let falhar = true;
  await page.route("**/api/clientes/?*", (route) => {
    if (falhar) return route.fulfill({ status: 503, json: { detail: "Indisponibilidade simulada da auditoria." } });
    return route.continue();
  });
  await abrirMenu(page, "Clientes");
  await expect(painel(page).locator(".alert-error")).toContainText("Indisponibilidade simulada");
  falhar = false;
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await abrirMenu(page, "Clientes");
  await expect(painel(page).locator("tbody")).toContainText("Maria Fernanda");
  await expect(painel(page).locator(".alert-error")).toHaveCount(0);
});

test("rascunho atrasado preserva a digitação de um evento novo", async ({ page }) => {
  await entrar(page);
  let liberar;
  const resposta = new Promise((resolve) => { liberar = resolve; });
  await page.route("**/api/rascunhos/novo-evento-agenda/", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await resposta;
    return route.fulfill({ json: { dados: { titulo: "Rascunho antigo" } } });
  });
  await abrirMenu(page, "Agenda");
  const consulta = page.waitForRequest("**/api/rascunhos/novo-evento-agenda/");
  await abrirAba(page, "Novo");
  await consulta;
  await page.getByLabel("Título (obrigatório)", { exact: true }).fill("Evento novo da auditoria");
  liberar();
  await expect(page.getByRole("status").filter({ hasText: "Edição atual preservada" })).toBeVisible();
  await expect(page.getByLabel("Título (obrigatório)", { exact: true })).toHaveValue("Evento novo da auditoria");
});

test("horas e despesas iniciam com o dia de São Paulo na virada UTC", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-28T00:30:00Z"));
  await entrar(page);
  await abrirMenu(page, "Horas e custos");
  await abrirAba(page, "Apontar hora");
  await expect(page.getByLabel("Data (obrigatório)", { exact: true })).toHaveValue("2026-10-27");
  await abrirAba(page, "Nova despesa");
  await expect(page.getByLabel("Data (obrigatório)", { exact: true })).toHaveValue("2026-10-27");
});

test("sem JavaScript, senha de login não é enviada na URL", async ({ browser }) => {
  const contexto = await browser.newContext({ javaScriptEnabled: false });
  try {
    const pagina = await contexto.newPage();
    await pagina.goto(new URL("/login", process.env.E2E_BASE_URL || "http://localhost:3000").href);
    await pagina.getByPlaceholder("seu@email.com").fill("auditoria@example.com");
    await pagina.getByPlaceholder("••••••••").fill("DadoSinteticoDeTeste");
    const envio = pagina.waitForRequest((r) => new URL(r.url()).pathname === "/login" && r.method() === "POST");
    await pagina.getByRole("button", { name: "Entrar no sistema" }).click();
    const requisicao = await envio;
    expect(new URL(requisicao.url()).search).toBe("");
  } finally {
    await contexto.close();
  }
});
