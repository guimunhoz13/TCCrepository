const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

async function request(endpoint, options = {}) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access")
      : null;

  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

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

export async function registrarEscritorio(data) {
  return request("/escritorios/registrar/", {
    method: "POST",
    body: JSON.stringify(data),
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

export async function getClientes() {
  return request("/clientes/");
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

export async function getProcessos() {
  return request("/processos/");
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

export async function getAgenda() {
  return request("/agenda/");
}

export async function createAgenda(data) {
  return request("/agenda/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAgenda(id) {
  return request(`/agenda/${id}/`, { method: "DELETE" });
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
