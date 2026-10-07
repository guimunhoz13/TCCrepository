// Dados de uma empresa pelo CNPJ, na API pública do BrasilAPI (que repassa
// o cadastro da Receita Federal), para poupar o usuário de digitar razão
// social, endereço e telefone de um cliente pessoa jurídica.
//
// É só uma ajuda de preenchimento: se a consulta falhar ou o CNPJ não for
// encontrado, o cadastro segue normalmente com os dados digitados à mão.

const MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos", "a", "o"]);
const SIGLAS = new Set(["LTDA", "S.A.", "S/A", "SA", "ME", "EPP", "EIRELI", "S/S", "SS", "MEI", "CIA", "S.A"]);
// Numeral romano válido ("XV de Novembro", "Pio XII", "Torre I"), que fica em maiúsculas.
const ROMANO = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

/** "COMERCIAL NOROESTE LTDA" → "Comercial Noroeste LTDA". */
export function capitalizarNome(texto) {
  return (texto || "")
    .trim()
    .split(/\s+/)
    .map((palavra, i) => {
      const maiuscula = palavra.toUpperCase();
      if (SIGLAS.has(maiuscula) || ROMANO.test(maiuscula)) return maiuscula;
      const minuscula = palavra.toLowerCase();
      if (i > 0 && MINUSCULAS.has(minuscula)) return minuscula;
      return minuscula.charAt(0).toUpperCase() + minuscula.slice(1);
    })
    .join(" ");
}

function montarLogradouro(dados) {
  const tipo = (dados.descricao_tipo_de_logradouro || "").trim();
  const nome = (dados.logradouro || "").trim();
  const completo = tipo && !nome.toUpperCase().startsWith(tipo.toUpperCase()) ? `${tipo} ${nome}` : nome;
  return capitalizarNome(completo);
}

/** Converte a resposta do BrasilAPI no que os formulários usam. */
export function interpretarEmpresa(dados) {
  if (!dados || !dados.razao_social) return null;
  const numero = (dados.numero || "").trim();
  return {
    razaoSocial: capitalizarNome(dados.razao_social),
    nomeFantasia: capitalizarNome(dados.nome_fantasia || ""),
    situacao: (dados.descricao_situacao_cadastral || "").trim().toUpperCase(),
    cep: (dados.cep || "").toString().replace(/\D/g, ""),
    logradouro: [montarLogradouro(dados), numero.toUpperCase() === "S/N" ? "s/n" : numero].filter(Boolean).join(", "),
    complemento: capitalizarNome(dados.complemento || ""),
    bairro: capitalizarNome(dados.bairro || ""),
    cidade: capitalizarNome(dados.municipio || ""),
    estado: (dados.uf || "").trim().toUpperCase(),
    telefone: (dados.ddd_telefone_1 || "").toString().replace(/\D/g, ""),
    email: (dados.email || "").trim().toLowerCase(),
  };
}

export async function buscarEmpresaPorCnpj(cnpj) {
  const digitos = (cnpj || "").replace(/\D/g, "");
  if (digitos.length !== 14) return null;

  let resposta;
  try {
    resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digitos}`);
  } catch {
    return null;
  }
  if (!resposta.ok) return null;

  const dados = await resposta.json().catch(() => null);
  return interpretarEmpresa(dados);
}

/** Linha de endereço completa: "Rua X, 800, Sala 2, Centro - Araçatuba/SP". */
export function enderecoDaEmpresa(empresa) {
  const partes = [empresa.logradouro, empresa.complemento, empresa.bairro].filter(Boolean).join(", ");
  const cidadeUf = [empresa.cidade, empresa.estado].filter(Boolean).join("/");
  return [partes, cidadeUf].filter(Boolean).join(" - ");
}

/** Aviso mostrado depois da consulta (a situação não impede o cadastro). */
export function avisoDaEmpresa(empresa) {
  if (!empresa) return "CNPJ não encontrado na Receita Federal. Preencha os dados à mão.";
  const base = "Dados preenchidos a partir do cadastro da Receita Federal. Confira antes de salvar.";
  if (empresa.situacao && empresa.situacao !== "ATIVA") {
    return `${base} Atenção: situação cadastral ${empresa.situacao.toLowerCase()}.`;
  }
  return base;
}
