const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";


async function request(endpoint, options = {}) {

  const token = localStorage.getItem("access");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",

      ...(token && {
        Authorization: `Bearer ${token}`,
      }),

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
      data?.message ||
      "Não foi possível concluir a requisição.";

    throw new Error(mensagem);

  }

  return data;

}



// =====================
// CLIENTES
// =====================

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
  return request(`/clientes/${id}/`, {
    method: "DELETE",
  });
}



// =====================
// PROCESSOS
// =====================

export async function getProcessos() {
  return request("/processos/");
}



// =====================
// AGENDA
// =====================

export async function getAgenda() {
  return request("/agenda/");
}



// =====================
// DOCUMENTOS
// =====================

export async function getDocumentos() {
  return request("/documentos/");
}



// =====================
// ADVOGADOS
// =====================

export async function getAdvogados() {
  return request("/advogados/");
}