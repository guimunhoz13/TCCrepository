/** @jest-environment jsdom */
import * as api from "../api";
const resposta = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data, blob: async () => new Blob(["arquivo fictício"], { type: "application/pdf" }) });
beforeEach(() => { localStorage.clear(); global.fetch = jest.fn(); });
afterEach(() => { delete global.fetch; jest.restoreAllMocks(); });

test("requisições concorrentes com token expirado compartilham uma renovação", async () => {
  localStorage.setItem("access", "expirado"); localStorage.setItem("refresh", "refresh-antigo");
  fetch.mockImplementation(async (url, opts) => url.endsWith("/token/refresh/") ? resposta({ access: "renovado", refresh: "refresh-novo" }) : opts.headers.Authorization === "Bearer expirado" ? resposta({ detail: "Token expirado." }, 401) : resposta([{ id: 7 }]));
  const resultados = await Promise.all([api.getClientes(), api.getProcessos()]); expect(resultados).toEqual([[{ id: 7 }], [{ id: 7 }]]);
  expect(fetch.mock.calls.filter(([url]) => url.endsWith("/token/refresh/"))).toHaveLength(1);
  expect(localStorage.getItem("refresh")).toBe("refresh-novo");
});

test("renovação rejeitada por outra aba tenta o refresh mais recente", async () => {
  localStorage.setItem("access", "expirado"); localStorage.setItem("refresh", "refresh-antigo");
  fetch.mockImplementation(async (url, opts) => {
    if (url.endsWith("/token/refresh/")) {
      if (JSON.parse(opts.body).refresh === "refresh-antigo") { localStorage.setItem("refresh", "refresh-outra-aba"); return resposta({}, 401); }
      return resposta({ access: "renovado-outra-aba" });
    }
    return opts.headers.Authorization === "Bearer expirado" ? resposta({}, 401) : resposta([]);
  });
  await api.getClientes(); expect(localStorage.getItem("access")).toBe("renovado-outra-aba");
  expect(fetch.mock.calls.filter(([url]) => url.endsWith("/token/refresh/"))).toHaveLength(2);
});

test("falha na renovação mantém a recusa e não inventa uma sessão válida", async () => {
  localStorage.setItem("access", "expirado"); localStorage.setItem("refresh", "revogado");
  fetch.mockResolvedValue(resposta({ detail: "Sessão encerrada." }, 401));
  await expect(api.getClientes()).rejects.toMatchObject({ status: 401, message: "Sessão encerrada." }); expect(localStorage.getItem("access")).toBe("expirado");
});

test("sessão mestre renova seus próprios tokens e não usa a sessão do escritório", async () => {
  localStorage.setItem("access", "escritorio"); localStorage.setItem("master_access", "master-expirado"); localStorage.setItem("master_refresh", "master-refresh");
  fetch.mockImplementation(async (url, opts) => url.endsWith("/token/refresh/") ? resposta({ access: "master-novo" }) : opts.headers.Authorization === "Bearer master-expirado" ? resposta({}, 401) : resposta({ escritorios: 1 }));
  await expect(api.getMasterStats()).resolves.toEqual({ escritorios: 1 }); expect(localStorage.getItem("access")).toBe("escritorio");
  expect(fetch.mock.calls.find(([u]) => u.endsWith("/token/refresh/"))[1].body).toBe(JSON.stringify({ refresh: "master-refresh" }));
});

test("multipart preserva arquivo e deixa o navegador definir o Content-Type", async () => {
  localStorage.setItem("access", "sessao-ficticia"); fetch.mockResolvedValue(resposta({ id: 1 }));
  const form = new FormData(); form.append("arquivo", new File(["x"], "anexo.pdf")); await api.createDocumento(form);
  expect(fetch.mock.calls[0][1].body).toBe(form); expect(fetch.mock.calls[0][1].headers["Content-Type"]).toBeUndefined(); expect(fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer sessao-ficticia");
});

test("validações aninhadas avisam os campos e resposta sem JSON usa mensagem de erro", async () => {
  const evento = jest.fn(); window.addEventListener("lexnexo:erros-api", evento);
  fetch.mockResolvedValueOnce(resposta({ cliente: { nome: ["Obrigatório."] } }, 400));
  await expect(api.createCliente({})).rejects.toMatchObject({ campos: { cliente: "Obrigatório." } }); expect(evento.mock.calls[0][0].detail.campos).toEqual({ cliente: "Obrigatório." }); window.removeEventListener("lexnexo:erros-api", evento);
  fetch.mockResolvedValueOnce({ ok: false, status: 502, json: async () => { throw new Error("HTML do proxy"); } }); await expect(api.getClientes()).rejects.toMatchObject({ status: 502, message: "Não foi possível concluir a requisição." });
});

test("foto protegida é buscada com autenticação renovada e rejeita endereço fora da rota", async () => {
  localStorage.setItem("access", "expirado"); localStorage.setItem("refresh", "refresh-ficticio");
  fetch.mockImplementation(async (url, opts) => url.endsWith("/token/refresh/") ? resposta({ access: "renovado" }) : opts.headers.Authorization === "Bearer expirado" ? resposta({}, 401) : resposta(null));
  expect(api.fotoProtegida("/api/fotos/usuario/1/")).toBe(true); expect(api.fotoProtegida("data:image/png;base64,AA==")).toBe(false);
  await expect(api.buscarFotoAutenticada("/api/fotos/usuario/1/")).resolves.toBeInstanceOf(Blob);
  expect(() => api.buscarFotoAutenticada("/arquivo-publico.png")).toThrow("Endereço de foto inválido.");
});

test("download falho conserva mensagem da API; arquivo válido libera o objeto temporário", async () => {
  fetch.mockResolvedValueOnce(resposta({ detail: "Arquivo não pertence ao escritório." }, 403)); await expect(api.baixarDocumento(9)).rejects.toThrow("Arquivo não pertence ao escritório.");
  fetch.mockResolvedValueOnce(resposta(null)); URL.createObjectURL = jest.fn(() => "blob:temporario"); URL.revokeObjectURL = jest.fn(); jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  await api.baixarDocumento(9, "nome.pdf"); expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:temporario"); expect(document.querySelector('a[download="nome.pdf"]')).toBeNull();
});

test("paginação reúne todas as páginas e propaga falha em página posterior", async () => {
  const buscar = jest.fn().mockResolvedValueOnce({ results: [{ id: 1 }], next: "pagina2" }).mockResolvedValueOnce({ results: [{ id: 2 }], next: null });
  await expect(api.listarTudo(buscar, { ativo: true })).resolves.toEqual([{ id: 1 }, { id: 2 }]); expect(buscar).toHaveBeenLastCalledWith({ ativo: true, page: 2, page_size: 1000 });
  buscar.mockResolvedValueOnce({ results: [], next: "pagina2" }).mockRejectedValueOnce(new Error("Página indisponível.")); await expect(api.listarTudo(buscar)).rejects.toThrow("Página indisponível.");
});

test("rascunho ausente é normalizado e logout remove só as chaves da sessão correspondente", async () => {
  fetch.mockResolvedValue(resposta({ detail: "Não encontrado." }, 404)); await expect(api.getRascunho("teste/038")).resolves.toBeNull(); await expect(api.excluirRascunho("teste/038")).resolves.toBeNull();
  localStorage.setItem("access", "sessao"); localStorage.setItem("refresh", "refresh"); localStorage.setItem("master_access", "mestre"); localStorage.setItem("usuarioLogado", "{}");
  fetch.mockRejectedValue(new Error("Rede desligada.")); api.logout(); await Promise.resolve(); expect(localStorage.getItem("access")).toBeNull(); expect(localStorage.getItem("usuarioLogado")).toBeNull(); expect(localStorage.getItem("master_access")).toBe("mestre");
});
