import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { abrirAba, abrirMenu, campo, entrar } from "./ajudantes";

test("todas as áreas do administrador abrem com conteúdo, formulários rotulados e navegação por teclado", async ({ page }) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await entrar(page);
  const areas = [
    ["Agenda", "Novo"], ["Clientes", "Novo"], ["Processos", "Novo"],
    ["Documentos", "Enviar documento"], ["Modelos de documento", "Novo modelo"],
    ["Contratos", "Novo"], ["Horas e custos", null], ["Tarefas", null],
    ["Advogados", null], ["Planos", null], ["Contato", null], ["Configurações", null],
  ];
  const erros = [];
  page.on("pageerror", (erro) => erros.push(erro.message));
  for (const [area, aba] of areas) {
    await test.step(area, async () => {
      await abrirMenu(page, area);
      const painel = page.getByRole("dialog");
      // O título pode ser mais completo que o nome curto do menu
      // (ex.: "Contratos de Honorários").
      await expect(painel.locator("h3").first()).toBeVisible();
      await expect(painel.locator(".linha-carregando")).toHaveCount(0);
      await expect(painel.locator(".alert-error")).toHaveCount(0);
      const conferir = async (etapa) => {
        const analise = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
        const violacoes = analise.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
        if (violacoes.length) await test.info().attach(`${area}-${etapa}`, { body: JSON.stringify(violacoes), contentType: "application/json" });
        expect.soft(violacoes, `${area}: ${etapa}`).toEqual([]);
      };
      await conferir("lista");
      if (aba) {
        await abrirAba(page, aba);
        await expect(painel.locator("form")).toBeVisible();
        await conferir("formulario");
      }
      // Esc fecha o painel e o próximo passo continua pela navegação real.
      await page.keyboard.press("Escape");
      await expect(painel).toHaveCount(0);
    });
  }
  expect(erros).toEqual([]);
});

test("falha ao registrar pagamento é visível, pode ser repetida e mantém a parcela pendente", async ({ page }) => {
  await entrar(page, "financeiro");
  await abrirMenu(page, "Contratos");
  await page.getByRole("button", { name: "Ver parcelas" }).first().click();
  await page.route("**/api/parcelas/*/", async (rota) => {
    if (rota.request().method() === "PATCH") {
      await rota.fulfill({ status: 503, json: { detail: "Falha sintética da auditoria: tente novamente." } });
    } else await rota.continue();
  });
  const botao = page.getByRole("button", { name: "Marcar como pago", exact: true }).first();
  await botao.click();
  await expect(page.getByRole("dialog").locator(".alert-error")).toContainText("Falha sintética da auditoria");
  await expect(botao).toBeEnabled();
  await expect(page.getByRole("dialog").locator("tbody").last()).toContainText("Pendente");
});

test("agenda grava data e hora locais e reabre a edição sem deslocar o horário", async ({ page }) => {
  await entrar(page);
  await abrirMenu(page, "Agenda");
  await abrirAba(page, "Novo");
  const titulo = `AUDITORIA horário local ${Date.now()}`;
  await campo(page, "Título").fill(titulo);
  await campo(page, "Descrição").fill("Compromisso sintético do banco local E2E.");
  await campo(page, "Data e hora").fill("2026-11-26T14:30");
  await campo(page, "Local").fill("Sala fictícia local");
  const gravacao = page.waitForResponse((res) => /\/api\/agenda\/$/.test(res.url()) && res.request().method() === "POST");
  await page.getByRole("button", { name: "Agendar evento", exact: true }).click();
  const resposta = await gravacao;
  expect(resposta.ok()).toBeTruthy();
  const registro = await resposta.json();
  expect(registro.data_evento).toMatch(/^2026-11-26T14:30:00-03:00$/);
  const linha = page.getByRole("row").filter({ hasText: titulo });
  await expect(linha).toContainText("26/11/2026, 14:30");
  await linha.getByRole("button", { name: "Editar evento", exact: true }).click();
  await expect(campo(page, "Data e hora")).toHaveValue("2026-11-26T14:30");
});

test("configurações mantêm o foco no diálogo e devolvem ao menu ao fechar com Escape", async ({ page }) => {
  await entrar(page);
  await abrirMenu(page, "Configurações");
  const dialogo = page.getByRole("dialog", { name: "Configurações" });
  await expect(dialogo.getByRole("button", { name: "Ativar verificação em duas etapas", exact: true })).toBeVisible();
  await expect(dialogo).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  const ultimo = dialogo.locator('button:visible:enabled, a[href]:visible, input:visible:enabled, select:visible:enabled, textarea:visible:enabled').last();
  await expect(ultimo).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialogo.getByRole("button", { name: "Abrir a ajuda das configurações", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialogo).toHaveCount(0);
  await expect(page.locator(".sidebar-nav").getByRole("button", { name: "Configurações", exact: true })).toBeFocused();
});
