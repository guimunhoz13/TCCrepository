/** @jest-environment jsdom */
import { abrirDocumento } from "../api";
import { abrirRelatorio } from "../../utils/relatorio";

describe("abertura de arquivos após uma consulta autenticada", () => {
  let janela;
  beforeEach(() => {
    jest.useFakeTimers();
    janela = { opener: window, location: { replace: jest.fn() }, close: jest.fn(), closed: false };
    jest.spyOn(window, "open").mockReturnValue(janela);
    URL.createObjectURL = jest.fn(() => "blob:arquivo-de-teste");
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    localStorage.setItem("access", "token-ficticio");
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    localStorage.clear();
    delete global.fetch;
  });

  test("reserva a aba no clique, antes de aguardar a resposta da API", async () => {
    let responder;
    global.fetch = jest.fn(() => new Promise((resolve) => { responder = resolve; }));
    const resultado = abrirDocumento(7);
    expect(window.open).toHaveBeenCalledWith("", "_blank");
    expect(janela.opener).toBeNull();
    responder({ ok: true, status: 200, blob: async () => new Blob(["PDF fictício"], { type: "application/pdf" }) });
    await resultado;
    expect(janela.location.replace).toHaveBeenCalledWith("blob:arquivo-de-teste");
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer token-ficticio");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:arquivo-de-teste");
  });

  test("com popups bloqueados, baixa o documento sem perder o conteúdo", async () => {
    window.open.mockReturnValue(null);
    let nomeSalvo;
    HTMLAnchorElement.prototype.click.mockImplementation(function () { nomeSalvo = this.download; });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, blob: async () => new Blob(["PDF"], { type: "application/pdf" }) });
    await expect(abrirDocumento(7)).resolves.toBe("download");
    expect(nomeSalvo).toBe("documento.pdf");
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(document.querySelector('a[download]')).toBeNull();
  });

  test("erro de autorização fecha a aba vazia e não disponibiliza arquivo", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({ detail: "Acesso negado." }) });
    await expect(abrirDocumento(7)).rejects.toThrow("Acesso negado.");
    expect(janela.close).toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  test("não deixa aba vazia quando a rede falha", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Sem conexão."));
    await expect(abrirDocumento(7)).rejects.toThrow("Sem conexão.");
    expect(janela.close).toHaveBeenCalled();
  });

  test("relatório reserva a janela antes de consultar seus dados", async () => {
    const obterHtml = jest.fn(async () => {
      expect(window.open).toHaveBeenCalled();
      return "<!doctype html><h1>Relatório fictício</h1>";
    });
    await expect(abrirRelatorio(obterHtml)).resolves.toBe("aba");
    expect(obterHtml).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL.mock.calls[0][0].type).toContain("text/html");
  });

  test("relatório pode ser salvo quando o navegador impede novas abas", async () => {
    window.open.mockReturnValue(null);
    await expect(abrirRelatorio(async () => "<h1>Relatório fictício</h1>")).resolves.toBe("download");
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
  });
});
