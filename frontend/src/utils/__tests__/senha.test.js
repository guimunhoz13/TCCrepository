import { REQUISITOS_SENHA, senhaAtendeRequisitos } from "../senha";

describe("REQUISITOS_SENHA", () => {
  test("tem os 4 requisitos esperados", () => {
    expect(REQUISITOS_SENHA.map((r) => r.id)).toEqual([
      "tamanho",
      "maiuscula",
      "numero",
      "especial",
    ]);
  });
});

describe("senhaAtendeRequisitos", () => {
  test("rejeita senha vazia", () => {
    expect(senhaAtendeRequisitos("")).toBe(false);
    expect(senhaAtendeRequisitos(undefined)).toBe(false);
  });

  test("rejeita senha sem maiúscula", () => {
    expect(senhaAtendeRequisitos("abcdefg1!")).toBe(false);
  });

  test("rejeita senha sem número", () => {
    expect(senhaAtendeRequisitos("Abcdefgh!")).toBe(false);
  });

  test("rejeita senha sem caractere especial", () => {
    expect(senhaAtendeRequisitos("Abcdefg1")).toBe(false);
  });

  test("rejeita senha com menos de 8 caracteres", () => {
    expect(senhaAtendeRequisitos("Ab1!ab")).toBe(false);
  });

  test("aceita senha que atende todos os requisitos", () => {
    expect(senhaAtendeRequisitos("Abcdefg1!")).toBe(true);
  });
});
