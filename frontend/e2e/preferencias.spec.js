import { expect, test } from "@playwright/test";
import { abrirMenu, entrar } from "./ajudantes";

test("foto é salva separadamente e continua disponível após recarregar", async ({ page }) => {
  await entrar(page);
  await abrirMenu(page, "Configurações");
  await page.getByLabel("Escolher foto de perfil").setInputFiles({
    name: "perfil-teste.png", mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGNkYGhgwAaYsIoOWgkAaYgAkK2VydMAAAAASUVORK5CYII=", "base64"),
  });
  const salva = page.waitForResponse((res) => res.url().includes("/configuracoes/conta/") && res.request().method() === "PATCH");
  await page.getByRole("button", { name: "Salvar foto", exact: true }).click();
  expect((await salva).ok()).toBeTruthy();
  await expect(page.getByRole("button", { name: "Salvar foto", exact: true })).toBeHidden();
  await page.reload();
  await expect.poll(() => page.locator(".topbar .avatar-img").evaluateAll((imgs) => imgs.some((img) => img.complete && img.naturalWidth > 0))).toBe(true);
});

test("modo compacto reduz visivelmente as linhas e mantém a escolha", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const carregamento = page.waitForResponse((res) => /\/api\/configuracoes\/$/.test(res.url()) && res.ok());
  await entrar(page);
  const iniciais = await (await carregamento).json();
  await expect(page.locator("html")).toHaveAttribute("data-density", iniciais.preferencias.densidade_tabela);
  const densidade = page.getByRole("button", { name: "Alternar densidade das listas" });
  async function alternar() {
    const salva = page.waitForResponse((res) => res.url().includes("/configuracoes/preferencias/") && res.request().method() === "PATCH");
    await densidade.click();
    expect((await salva).ok()).toBeTruthy();
  }
  if ((await densidade.getAttribute("aria-pressed")) === "true") await alternar();
  await expect(page.locator("html")).toHaveAttribute("data-density", "comfortable");
  await abrirMenu(page, "Clientes");
  // Aguarda um registro real, não uma linha do esqueleto de carregamento.
  const linha = page.locator(".overlay-body tbody tr").filter({ has: page.getByRole("button", { name: "Editar", exact: true }) }).first();
  await expect(linha).toBeVisible();
  const confortavel = (await linha.boundingBox()).height;
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await alternar();
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
  await abrirMenu(page, "Clientes");
  await expect(linha).toBeVisible();
  expect((await linha.boundingBox()).height).toBeLessThan(confortavel * 0.85);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
});

for (const { densidade, menuCompacto } of [
  { densidade: "compact", menuCompacto: false },
  { densidade: "comfortable", menuCompacto: true },
]) {
  test(`Compromissos mantém densidade ${densidade} e menu ${menuCompacto ? "recolhido" : "expandido"} durante a navegação`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const configuracao = page.waitForResponse((res) => /\/api\/configuracoes\/$/.test(res.url()) && res.ok());
    await entrar(page);
    const iniciais = (await (await configuracao).json()).preferencias;
    await expect(page.locator("html")).toHaveAttribute("data-density", iniciais.densidade_tabela);
    if (iniciais.densidade_tabela !== densidade) {
      const salva = page.waitForResponse((res) => res.url().includes("/configuracoes/preferencias/") && res.request().method() === "PATCH");
      await page.getByRole("button", { name: "Alternar densidade das listas" }).click();
      expect((await salva).ok()).toBeTruthy();
    }
    if (menuCompacto) await page.getByRole("button", { name: "Recolher menu lateral" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-density", densidade);
    await expect(page.locator(".sidebar")).toHaveClass(menuCompacto ? /compacta/ : /^(?!.*compacta)/);

    // Observa a transição inteira: checar só a aparência final deixa passar
    // a piscada do modo padrão enquanto as preferências são carregadas.
    await page.evaluate(({ densidade, menuCompacto }) => {
      window.aparenciaDuranteNavegacao = [];
      const registrar = () => {
        const menu = document.querySelector(".sidebar");
        if (!menu) return;
        const atual = {
          densidade: document.documentElement.getAttribute("data-density"),
          compacto: menu.classList.contains("compacta"),
          largura: Math.round(menu.getBoundingClientRect().width),
        };
        if (atual.densidade !== densidade || atual.compacto !== menuCompacto) {
          window.aparenciaDuranteNavegacao.push(atual);
        }
      };
      window.observarDensidade = new MutationObserver((registros) => {
        for (const registro of registros) {
          if (registro.oldValue !== densidade) {
            window.aparenciaDuranteNavegacao.push({ densidadeAnterior: registro.oldValue });
          }
        }
        registrar();
      });
      window.observarDensidade.observe(document.documentElement, {
        attributes: true, attributeFilter: ["data-density"], attributeOldValue: true,
      });
      window.observarMenu = new MutationObserver(registrar);
      window.observarMenu.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    }, { densidade, menuCompacto });

    const menu = page.locator(".sidebar-nav");
    await menu.getByRole("button", { name: "Compromissos", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Compromissos futuros" })).toBeVisible();
    await expect(page.getByText("Carregando compromissos...")).toBeHidden();
    await menu.getByRole("button", { name: "Dashboard", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Compromissos futuros" })).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Também mantém o caminho que sai de Compromissos para um painel.
    await menu.getByRole("button", { name: "Compromissos", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Compromissos futuros" })).toBeVisible();
    await menu.getByRole("button", { name: "Agenda", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    const mudancas = await page.evaluate(() => {
      window.observarDensidade.disconnect();
      window.observarMenu.disconnect();
      return window.aparenciaDuranteNavegacao;
    });
    expect(mudancas).toEqual([]);
    await expect(page.locator("html")).toHaveAttribute("data-density", densidade);
    await expect(page.locator(".sidebar")).toHaveClass(menuCompacto ? /compacta/ : /^(?!.*compacta)/);
  });
}
