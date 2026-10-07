import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de ponta a ponta: o navegador de verdade usando o front e a API
 * de verdade, sobre o escritório criado por `python manage.py popular_demo`.
 *
 * Localmente, suba o back-end (porta 8000) e o front (porta 3000) e rode
 * `npm run e2e`. No CI, o job "E2E (Playwright)" faz tudo isso sozinho.
 */
const NO_CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: NO_CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "computador", use: { ...devices["Desktop Chrome"] }, testIgnore: /celular\.spec/ },
    { name: "celular", use: { ...devices["Pixel 7"] }, testMatch: /celular\.spec/ },
  ],
});
