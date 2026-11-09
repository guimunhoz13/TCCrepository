import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de ponta a ponta: o navegador de verdade usando o front e a API
 * de verdade, sobre o escritório criado por `python manage.py popular_demo`.
 *
 * Localmente, suba o back-end (porta 8000) e o front (porta 3000) e rode
 * `npm run e2e`. No CI, o job "E2E (Playwright)" faz tudo isso sozinho.
 */
// Playwright 1.56 exige esta opção para aplicar setOffline também ao worker.
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS ||= "1";

const NO_CI = Boolean(process.env.CI);
const dispositivoComputador = {
  chromium: "Desktop Chrome",
  firefox: "Desktop Firefox",
  webkit: "Desktop Safari",
}[process.env.E2E_BROWSER || "chromium"];
if (!dispositivoComputador) throw new Error("E2E_BROWSER deve ser chromium, firefox ou webkit.");

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: NO_CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    // Rotas simuladas precisam pertencer ao contexto do navegador, sem
    // interferência do worker de produção. O teste PWA permite o worker
    // explicitamente e confere cache e navegação offline de verdade.
    serviceWorkers: "block",
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "computador", use: { ...devices[dispositivoComputador],
      ...(process.env.E2E_BROWSER_EXECUTABLE ? { launchOptions: { executablePath: process.env.E2E_BROWSER_EXECUTABLE } } : {}),
    }, testIgnore: /celular\.spec/ },
    { name: "celular", use: { ...devices["Pixel 7"] }, testMatch: /celular\.spec/ },
  ],
});
