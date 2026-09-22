// Busca de endereço por CEP na API pública do ViaCEP, para poupar o
// usuário de digitar rua/bairro/cidade/UF na mão em todo cadastro.

export async function buscarEnderecoPorCep(cep) {
  const digitos = (cep || "").replace(/\D/g, "");
  if (digitos.length !== 8) return null;

  let resposta;
  try {
    resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
  } catch {
    return null;
  }

  if (!resposta.ok) return null;

  const dados = await resposta.json().catch(() => null);
  if (!dados || dados.erro) return null;

  return {
    logradouro: dados.logradouro || "",
    bairro: dados.bairro || "",
    cidade: dados.localidade || "",
    estado: dados.uf || "",
  };
}

export function montarEnderecoCompleto({ logradouro, bairro }) {
  return [logradouro, bairro].filter(Boolean).join(", ");
}
