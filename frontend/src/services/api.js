const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export function buildQuery(params) {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      query.set(chave, valor);
    }
  });
  const texto = query.toString();
  return texto ? `?${texto}` : "";
}

const CHAVE_REFRESH = {
  access: "refresh",
  master_access: "master_refresh",
};

// O access token expira em 30 minutos (ver SIMPLE_JWT no backend). Sem isso,
// a primeira chamada à API depois da expiração falhava com "Given token not
// valid for any token type" e o usuário era obrigado a atualizar a página e
// logar de novo no meio do uso do sistema.
async function renovarAccessToken(tokenKey) {
  const refreshKey = CHAVE_REFRESH[tokenKey];
  const refreshToken =
    refreshKey && typeof window !== "undefined"
      ? localStorage.getItem(refreshKey)
      : null;

  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    localStorage.setItem(tokenKey, data.access);
    return data.access;
  } catch {
    return null;
  }
}

async function request(endpoint, options = {}, tokenKey = "access") {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(tokenKey)
      : null;

  const isFormData = options.body instanceof FormData;

  async function enviar(tokenAtual) {
    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(tokenAtual && { Authorization: `Bearer ${tokenAtual}` }),
        ...options.headers,
      },
    });
  }

  let response = await enviar(token);

  if (response.status === 401 && token) {
    const novoToken = await renovarAccessToken(tokenKey);
    if (novoToken) {
      response = await enviar(novoToken);
    }
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const mensagem =
      data?.detail ||
      Object.values(data || {})
        .flat()
        .join(" ") ||
      "Não foi possível concluir a requisição.";

    throw new Error(mensagem);
  }

  return data;
}

export async function login(email, senha) {
  return request("/login/", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
}

export async function verificarEmail(email) {
  return request("/login/verificar-email/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function solicitarRedefinicaoSenha(email) {
  return request("/login/esqueci-senha/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function redefinirSenha({ token, nova_senha, confirmar_senha }) {
  return request("/login/redefinir-senha/", {
    method: "POST",
    body: JSON.stringify({ token, nova_senha, confirmar_senha }),
  });
}

export async function registrarEscritorio(data) {
  return request("/escritorios/registrar/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function confirmarEmail(token) {
  return request("/escritorios/confirmar-email/", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

function corpoRequisicao(data) {
  return data instanceof FormData ? data : JSON.stringify(data);
}

export async function registrarAdvogado(data) {
  return request("/advogados/registrar/", {
    method: "POST",
    body: corpoRequisicao(data),
  });
}

export async function getDashboardStats() {
  return request("/dashboard/stats/");
}

export async function getNoticiasJuridicas() {
  return request("/noticias/");
}

export async function getClientes(params) {
  return request(`/clientes/${buildQuery(params)}`);
}

export async function createCliente(data) {
  return request("/clientes/", {
    method: "POST",
    body: corpoRequisicao(data),
  });
}

export async function updateCliente(id, data) {
  return request(`/clientes/${id}/`, {
    method: "PATCH",
    body: corpoRequisicao(data),
  });
}

export async function deleteCliente(id) {
  return request(`/clientes/${id}/`, { method: "DELETE" });
}

export async function getProcessos(params) {
  return request(`/processos/${buildQuery(params)}`);
}

export async function createProcesso(data) {
  return request("/processos/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProcesso(id, data) {
  return request(`/processos/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteProcesso(id) {
  return request(`/processos/${id}/`, { method: "DELETE" });
}

export async function getAgenda(params) {
  return request(`/agenda/${buildQuery(params)}`);
}

export async function createAgenda(data) {
  return request("/agenda/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAgenda(id, data) {
  return request(`/agenda/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAgenda(id) {
  return request(`/agenda/${id}/`, { method: "DELETE" });
}

export async function calcularPrazo({ data_inicio, dias, dias_uteis = true }) {
  return request("/agenda/calcular-prazo/", {
    method: "POST",
    body: JSON.stringify({ data_inicio, dias, dias_uteis }),
  });
}

export async function getContratos() {
  return request("/contratos/");
}

export async function createContrato(data) {
  return request("/contratos/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateContrato(id, data) {
  return request(`/contratos/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteContrato(id) {
  return request(`/contratos/${id}/`, { method: "DELETE" });
}

export async function updateParcela(id, data) {
  return request(`/parcelas/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getDocumentos() {
  return request("/documentos/");
}

export async function createDocumento(formData) {
  return request("/documentos/", {
    method: "POST",
    body: formData,
  });
}

export async function deleteDocumento(id) {
  return request(`/documentos/${id}/`, { method: "DELETE" });
}

export async function getAdvogados() {
  return request("/advogados/");
}

export async function updateAdvogado(id, data) {
  return request(`/advogados/${id}/`, {
    method: "PATCH",
    body: corpoRequisicao(data),
  });
}

export async function enviarMensagemIA({ mensagem, historico = [], contexto = {} }) {
  return request("/assistente-ia/", {
    method: "POST",
    body: JSON.stringify({ mensagem, historico, contexto }),
  });
}

export function normalizarLista(dados) {
  if (Array.isArray(dados)) return dados;
  if (Array.isArray(dados?.results)) return dados.results;
  return [];
}

export function getUsuarioLogado() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("usuarioLogado");
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  // Revoga o refresh token no servidor (best-effort, sem bloquear a saída):
  // sem isso, uma cópia do token continuaria válida por dias mesmo depois
  // de "sair".
  const refreshToken = localStorage.getItem("refresh");
  if (refreshToken) {
    fetch(`${API_URL}/logout/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    }).catch(() => {});
  }

  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("usuarioLogado");
}


export async function getConfiguracoes() {
  return request("/configuracoes/");
}

export async function updateConta(data) {
  return request("/configuracoes/conta/", {
    method: "PATCH",
    body: corpoRequisicao(data),
  });
}

export async function alterarSenha(data) {
  return request("/configuracoes/senha/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePreferencias(data) {
  return request("/configuracoes/preferencias/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateEscritorio(data) {
  return request("/configuracoes/escritorio/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function desativarEscritorio(data) {
  return request("/configuracoes/desativar-escritorio/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function downloadArquivo(endpoint, nomeArquivo) {
  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });

  if (!response.ok) {
    let mensagem = "Não foi possível exportar os dados.";
    try {
      const data = await response.json();
      mensagem = data?.detail || mensagem;
    } catch {}
    throw new Error(mensagem);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportarClientesCSV() {
  return downloadArquivo("/configuracoes/exportar/clientes/", "clientes.csv");
}

export function exportarProcessosCSV() {
  return downloadArquivo("/configuracoes/exportar/processos/", "processos.csv");
}

export async function getRelatorioCliente(clienteId) {
  return request(`/configuracoes/relatorio/cliente/${clienteId}/`);
}

export async function getRelatorioProcesso(processoId) {
  return request(`/configuracoes/relatorio/processo/${processoId}/`);
}

export async function enviarRelatorioClientePorEmail(clienteId, destinatario) {
  return request(`/configuracoes/relatorio/cliente/${clienteId}/email/`, {
    method: "POST",
    body: JSON.stringify({ destinatario }),
  });
}

export async function enviarRelatorioProcessoPorEmail(processoId, destinatario) {
  return request(`/configuracoes/relatorio/processo/${processoId}/email/`, {
    method: "POST",
    body: JSON.stringify({ destinatario }),
  });
}

// =========================================================
// PAINEL MESTRE (DESENVOLVEDOR)
// =========================================================

async function masterRequest(endpoint, options = {}) {
  return request(endpoint, options, "master_access");
}

export async function masterLogin(email, senha) {
  return request("/master/login/", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
}

export function masterLogout() {
  const refreshToken = localStorage.getItem("master_refresh");
  if (refreshToken) {
    fetch(`${API_URL}/logout/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    }).catch(() => {});
  }

  localStorage.removeItem("master_access");
  localStorage.removeItem("master_refresh");
  localStorage.removeItem("masterLogado");
}

export function getMasterLogado() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("masterLogado");
  return raw ? JSON.parse(raw) : null;
}

export async function getMasterStats() {
  return masterRequest("/master/stats/");
}

export async function getMasterEscritorios() {
  return masterRequest("/master/escritorios/");
}

export async function createMasterEscritorio(data) {
  return masterRequest("/master/escritorios/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMasterEscritorio(id, data) {
  return masterRequest(`/master/escritorios/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMasterEscritorio(id) {
  return masterRequest(`/master/escritorios/${id}/`, { method: "DELETE" });
}

export async function getMasterAuditoria(params) {
  return masterRequest(`/master/auditoria/${buildQuery(params)}`);
}

export async function getAuditoria(params) {
  return request(`/auditoria/${buildQuery(params)}`);
}

// ---------------------------------------------------------------
// Apontamento de horas (timesheet)
// ---------------------------------------------------------------

export async function getApontamentos(filtros = {}) {
  const busca = new URLSearchParams(
    Object.entries(filtros).filter(([, valor]) => valor !== "" && valor != null)
  ).toString();
  return request(`/apontamentos/${busca ? `?${busca}` : ""}`);
}

export async function createApontamento(data) {
  return request("/apontamentos/", { method: "POST", body: corpoRequisicao(data) });
}

export async function deleteApontamento(id) {
  return request(`/apontamentos/${id}/`, { method: "DELETE" });
}

// ---------------------------------------------------------------
// Despesas e custas processuais
// ---------------------------------------------------------------

export async function getDespesas(filtros = {}) {
  const busca = new URLSearchParams(
    Object.entries(filtros).filter(([, valor]) => valor !== "" && valor != null)
  ).toString();
  return request(`/despesas/${busca ? `?${busca}` : ""}`);
}

export async function createDespesa(data) {
  return request("/despesas/", { method: "POST", body: corpoRequisicao(data) });
}

export async function updateDespesa(id, data) {
  return request(`/despesas/${id}/`, { method: "PATCH", body: corpoRequisicao(data) });
}

export async function deleteDespesa(id) {
  return request(`/despesas/${id}/`, { method: "DELETE" });
}

// ---------------------------------------------------------------
// Tempo de uso do sistema
// ---------------------------------------------------------------

export async function registrarAtividade() {
  return request("/atividade/", { method: "POST", body: JSON.stringify({}) });
}

export async function getTempoDeUso(mes) {
  return request(`/relatorios/tempo-uso/${mes ? `?mes=${mes}` : ""}`);
}
