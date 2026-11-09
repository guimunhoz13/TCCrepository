import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import { email, entrar, SENHA } from "./ajudantes";

// Código TOTP da conta sintética; nenhum segredo de produção é utilizado.
function codigoTotp(segredo, deslocamento = 0) {
  const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...segredo.replace(/=+$/, "")].map((c) => alfabeto.indexOf(c).toString(2).padStart(5, "0")).join("");
  const chave = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000) + deslocamento));
  const hash = createHmac("sha1", chave).update(contador).digest();
  const posicao = hash.at(-1) & 15;
  return String((hash.readUInt32BE(posicao) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

async function restaurarContaSintetica(request) {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  expect(["localhost", "127.0.0.1"]).toContain(new URL(api).hostname);
  const admin = await request.post(`${api}/login/`, { data: { email: email("admin"), senha: SENHA } });
  expect(admin.ok()).toBeTruthy();
  const credenciais = await admin.json();
  const headers = { Authorization: `Bearer ${credenciais.access}` };
  const config = await request.get(`${api}/configuracoes/`, { headers });
  expect(config.ok()).toBeTruthy();
  const membro = (await config.json()).membros.find((m) => m.email === email("secretaria"));
  expect(membro).toBeTruthy();
  const restauracao = await request.post(`${api}/usuarios/${membro.id}/redefinir-2fa/`, { headers });
  expect(restauracao.ok()).toBeTruthy();
}

// Hooks têm sua própria etapa de encerramento mesmo quando o teste expira.
// Asserção de loopback impede qualquer alteração numa conta publicada.
test.beforeEach(async ({ request }) => restaurarContaSintetica(request));
test.afterEach(async ({ request }) => restaurarContaSintetica(request));

test("login com duas etapas exige o código e abre a sessão pelo formulário real", async ({ page, request }) => {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  expect(["localhost", "127.0.0.1"]).toContain(new URL(api).hostname);
  const respostaLogin = page.waitForResponse((res) => /\/api\/login\/$/.test(res.url()) && res.request().method() === "POST");
  await entrar(page, "secretaria");
  const sessao = await (await respostaLogin).json();
  const headers = { Authorization: `Bearer ${sessao.access}` };
  const inicio = await request.post(`${api}/configuracoes/2fa/`, { headers, data: { acao: "iniciar" } });
  expect(inicio.ok()).toBeTruthy();
  const { segredo } = await inicio.json();
  // Ativação no passo anterior, aceito pelo protocolo, deixa o passo atual
  // disponível para testar o login sem reutilizar um código já consumido.
  const ativacao = await request.post(`${api}/configuracoes/2fa/`, { headers, data: { acao: "ativar", codigo: codigoTotp(segredo, -1) } });
  expect(ativacao.ok()).toBeTruthy();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/login");
  await page.getByPlaceholder("seu@email.com").fill(email("secretaria"));
  await page.getByPlaceholder("••••••••").fill(SENHA);
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(page.getByRole("heading", { name: "Verificação em duas etapas", exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("access"))).toBeNull();
  await page.getByPlaceholder("000000", { exact: true }).fill(codigoTotp(segredo));
  await page.getByRole("button", { name: "Confirmar e entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator(".sidebar-nav")).toContainText("Clientes");
});
