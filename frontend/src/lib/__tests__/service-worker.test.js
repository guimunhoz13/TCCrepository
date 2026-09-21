/**
 * O service worker decide o que pode ser guardado no disco do navegador.
 * Como o sistema é multi-escritório e autenticado por token, uma resposta
 * de API guardada em cache entregaria dados de um cliente a quem usasse o
 * mesmo aparelho depois. Estes testes cobrem essa decisão.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

const CODIGO = readFileSync(
  path.join(process.cwd(), "src/lib/service-worker.js"),
  "utf8"
);

/** Carrega o service worker num escopo falso e devolve os handlers dele. */
function carregarServiceWorker() {
  const handlers = {};
  const escopo = {
    addEventListener: (nome, fn) => {
      handlers[nome] = fn;
    },
    location: { origin: "https://lexoffice.app" },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
  };

  const contexto = {
    self: escopo,
    caches: {
      open: () => Promise.resolve({ addAll: () => Promise.resolve(), put: () => {} }),
      keys: () => Promise.resolve([]),
      match: () => Promise.resolve(undefined),
      delete: () => Promise.resolve(true),
    },
    fetch: () => Promise.resolve({ ok: true, clone: () => ({}) }),
    URL,
    Response,
    Promise,
  };
  contexto.self = escopo;

  vm.createContext(contexto);
  vm.runInContext(CODIGO, contexto);
  return handlers;
}

/** Roda o handler de fetch e diz se ele assumiu a resposta. */
function despachar(handlers, requisicao) {
  let assumiu = false;
  handlers.fetch({
    request: requisicao,
    respondWith: () => {
      assumiu = true;
    },
  });
  return assumiu;
}

const req = (url, extras = {}) => ({
  url,
  method: "GET",
  mode: "no-cors",
  ...extras,
});

describe("service worker", () => {
  let handlers;

  beforeEach(() => {
    handlers = carregarServiceWorker();
  });

  test("registra os três ciclos de vida", () => {
    expect(Object.keys(handlers).sort()).toEqual(["activate", "fetch", "install"]);
  });

  test("nunca intercepta chamadas de API", () => {
    expect(despachar(handlers, req("https://lexoffice.app/api/clientes/"))).toBe(false);
    expect(
      despachar(handlers, req("https://lexoffice.app/api/dashboard/stats/", { mode: "cors" }))
    ).toBe(false);
  });

  test("nem mesmo uma navegação para /api/ é servida do cache", () => {
    expect(
      despachar(handlers, req("https://lexoffice.app/api/relatorio/", { mode: "navigate" }))
    ).toBe(false);
  });

  test("deixa passar requisição para outra origem", () => {
    expect(despachar(handlers, req("https://api.lexoffice.app/clientes/"))).toBe(false);
    expect(despachar(handlers, req("https://fonts.googleapis.com/css2"))).toBe(false);
  });

  test("ignora tudo que não seja GET", () => {
    expect(
      despachar(handlers, req("https://lexoffice.app/_next/static/chunks/a.js", { method: "POST" }))
    ).toBe(false);
  });

  test("assume os estáticos versionados do build", () => {
    expect(despachar(handlers, req("https://lexoffice.app/_next/static/chunks/a.js"))).toBe(true);
    expect(despachar(handlers, req("https://lexoffice.app/icon-192.png"))).toBe(true);
    expect(despachar(handlers, req("https://lexoffice.app/favicon.ico"))).toBe(true);
  });

  test("assume a navegação para poder mostrar a tela de offline", () => {
    expect(
      despachar(handlers, req("https://lexoffice.app/dashboard", { mode: "navigate" }))
    ).toBe(true);
  });
});
