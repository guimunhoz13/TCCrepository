// Máscaras de formatação automática enquanto o usuário digita, usadas em
// todos os formulários que pedem CPF, RG, telefone, CNPJ e OAB.

export function formatarCPF(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatarCNPJ(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 14);
  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatarTelefone(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

// RG varia de formato entre estados (não há padrão nacional), mas a forma
// mais comum é XX.XXX.XXX-D, com D sendo o dígito verificador (0-9 ou X).
export function formatarRG(valor) {
  const bruto = valor.toUpperCase().replace(/[^0-9X]/g, "");
  const temX = bruto.includes("X");
  const digitos = bruto.replace(/X/g, "");
  const corpo = digitos.slice(0, 8);
  const verificador = temX ? "X" : digitos.length > 8 ? digitos[8] : "";

  const formatado = corpo
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");

  if (!verificador) return formatado;
  return formatado ? `${formatado}-${verificador}` : verificador;
}

// OAB: número de registro (4 a 6 dígitos) + UF, ex.: 123456/SP.
export function formatarOAB(valor) {
  const limpo = valor.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const numeros = limpo.replace(/[A-Z]/g, "").slice(0, 6);
  const uf = limpo.replace(/[0-9]/g, "").slice(0, 2);
  return uf ? `${numeros}/${uf}` : numeros;
}
