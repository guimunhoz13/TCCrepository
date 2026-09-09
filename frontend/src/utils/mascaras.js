// Máscaras e validações de documentos/contato usados nos cadastros
// (cliente, advogado e escritório): CPF, CNPJ, RG, telefone e OAB.

const UFS_VALIDAS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

function somenteDigitos(valor) {
  return (valor || "").replace(/\D/g, "");
}

export function formatarCPF(valor) {
  const numeros = somenteDigitos(valor).slice(0, 11);
  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function validarCPF(valor) {
  const numeros = somenteDigitos(valor);
  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false;

  const calcularDigito = (base) => {
    let soma = 0;
    let peso = base.length + 1;
    for (const digito of base) {
      soma += Number(digito) * peso;
      peso -= 1;
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const digito1 = calcularDigito(numeros.slice(0, 9));
  const digito2 = calcularDigito(numeros.slice(0, 9) + digito1);
  return numeros === numeros.slice(0, 9) + String(digito1) + String(digito2);
}

export function formatarCNPJ(valor) {
  const numeros = somenteDigitos(valor).slice(0, 14);
  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function validarCNPJ(valor) {
  const numeros = somenteDigitos(valor);
  if (numeros.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numeros)) return false;

  const calcularDigito = (base) => {
    const pesos = base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base
      .split("")
      .reduce((acc, digito, i) => acc + Number(digito) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const digito1 = calcularDigito(numeros.slice(0, 12));
  const digito2 = calcularDigito(numeros.slice(0, 12) + digito1);
  return numeros === numeros.slice(0, 12) + String(digito1) + String(digito2);
}

export function formatarTelefone(valor) {
  const numeros = somenteDigitos(valor).slice(0, 11);
  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function validarTelefone(valor) {
  const numeros = somenteDigitos(valor);
  return numeros.length === 10 || numeros.length === 11;
}

// RG não tem um padrão único nacional, mas a grande maioria dos estados
// emite 9 caracteres (8 dígitos + dígito verificador, que pode ser "X").
export function formatarRG(valor) {
  const limpo = (valor || "")
    .toUpperCase()
    .replace(/[^0-9X]/g, "")
    .slice(0, 9);
  return limpo
    .replace(/^(\d{2})(\w)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\w)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\w)$/, ".$1-$2");
}

export function validarRG(valor) {
  const limpo = (valor || "").toUpperCase().replace(/[^0-9X]/g, "");
  return limpo.length >= 7 && limpo.length <= 9;
}

// OAB: número de inscrição (até 6 dígitos) + seccional (UF), ex.: 123456/SP.
export function formatarOAB(valor) {
  const bruto = (valor || "").toUpperCase();
  const numeros = bruto.replace(/[^0-9]/g, "").slice(0, 6);
  const letras = bruto.replace(/[^A-Z]/g, "").slice(0, 2);
  if (!numeros) return "";
  return letras ? `${numeros}/${letras}` : numeros;
}

export function validarOAB(valor) {
  const bruto = (valor || "").toUpperCase();
  const numeros = bruto.replace(/[^0-9]/g, "");
  const letras = bruto.replace(/[^A-Z]/g, "");
  if (numeros.length < 3 || numeros.length > 6) return false;
  if (letras.length !== 2 || !UFS_VALIDAS.includes(letras)) return false;
  return true;
}
