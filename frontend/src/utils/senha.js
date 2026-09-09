// Requisitos de senha forte, espelhando validators.validar_senha_forte no
// backend (mínimo 8 caracteres, 1 maiúscula, 1 número, 1 caractere especial).

export const REQUISITOS_SENHA = [
  { id: "tamanho", label: "Pelo menos 8 caracteres", testar: (s) => s.length >= 8 },
  { id: "maiuscula", label: "Pelo menos 1 letra maiúscula", testar: (s) => /[A-Z]/.test(s) },
  { id: "numero", label: "Pelo menos 1 número", testar: (s) => /[0-9]/.test(s) },
  { id: "especial", label: "Pelo menos 1 caractere especial", testar: (s) => /[^A-Za-z0-9]/.test(s) },
];

export function senhaAtendeRequisitos(senha) {
  return REQUISITOS_SENHA.every((req) => req.testar(senha || ""));
}
