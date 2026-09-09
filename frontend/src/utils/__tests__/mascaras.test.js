import {
  formatarCPF,
  formatarCNPJ,
  formatarTelefone,
  formatarRG,
  formatarOAB,
} from "../mascaras";

describe("formatarCPF", () => {
  test("organiza os dígitos em ###.###.###-##", () => {
    expect(formatarCPF("11122233344")).toBe("111.222.333-44");
  });

  test("ignora caracteres não numéricos e limita a 11 dígitos", () => {
    expect(formatarCPF("111.222.333-44999")).toBe("111.222.333-44");
  });

  test("formata progressivamente enquanto o usuário digita", () => {
    expect(formatarCPF("111")).toBe("111");
    expect(formatarCPF("1112")).toBe("111.2");
  });
});

describe("formatarCNPJ", () => {
  test("organiza os dígitos em ##.###.###/####-##", () => {
    expect(formatarCNPJ("12345678000199")).toBe("12.345.678/0001-99");
  });

  test("limita a 14 dígitos", () => {
    expect(formatarCNPJ("123456780001999999")).toBe("12.345.678/0001-99");
  });
});

describe("formatarTelefone", () => {
  test("formata celular (11 dígitos) com hífen após o 5º dígito", () => {
    expect(formatarTelefone("11988887777")).toBe("(11) 98888-7777");
  });

  test("formata fixo (10 dígitos) com hífen após o 4º dígito", () => {
    expect(formatarTelefone("1122223333")).toBe("(11) 2222-3333");
  });

  test("limita a 11 dígitos", () => {
    expect(formatarTelefone("119888877779999")).toBe("(11) 98888-7777");
  });
});

describe("formatarRG", () => {
  test("organiza os dígitos em XX.XXX.XXX", () => {
    expect(formatarRG("123456789")).toBe("12.345.678-9");
  });

  test("aceita X maiúsculo ou minúsculo como dígito verificador final", () => {
    expect(formatarRG("12345678x")).toBe("12.345.678-X");
    expect(formatarRG("12345678X")).toBe("12.345.678-X");
  });

  test("limita a 8 dígitos além do dígito verificador", () => {
    expect(formatarRG("1234567899999")).toBe("12.345.678-9");
  });
});

describe("formatarOAB", () => {
  test("organiza número e UF no formato número/UF", () => {
    expect(formatarOAB("123456sp")).toBe("123456/SP");
  });

  test("mantém só os números enquanto a UF não é digitada", () => {
    expect(formatarOAB("123456")).toBe("123456");
  });

  test("limita o número a 6 dígitos e a UF a 2 letras", () => {
    expect(formatarOAB("1234567890spx")).toBe("123456/SP");
  });
});
