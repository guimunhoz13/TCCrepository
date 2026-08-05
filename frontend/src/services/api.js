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

export async function registrarEscritorio(data) {
  return request("/escritorios/registrar/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function registrarAdvogado(data) {
  return request("/advogados/registrar/", {
    method: "POST",
    body: JSON.stringify(data),
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
    body: JSON.stringify(data),
  });
}

export async function updateCliente(id, data) {
  return request(`/clientes/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
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
