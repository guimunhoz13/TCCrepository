const API_URL = "http://127.0.0.1:8000/api";

export async function getClientes() {

  const response = await fetch(`${API_URL}/clientes/`);

  return response.json();
}

export async function createCliente(data) {

  const response = await fetch(`${API_URL}/clientes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}