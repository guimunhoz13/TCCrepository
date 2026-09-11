import {
  limparTelefone,
  construirLinkWhatsApp,
  montarMensagemCliente,
  montarMensagemProcesso,
} from "../whatsapp";

describe("limparTelefone", () => {
  test("remove tudo que não é dígito", () => {
    expect(limparTelefone("(11) 98888-7777")).toBe("11988887777");
  });

  test("retorna string vazia para valores nulos/indefinidos", () => {
    expect(limparTelefone(null)).toBe("");
    expect(limparTelefone(undefined)).toBe("");
  });
});

describe("construirLinkWhatsApp", () => {
  test("adiciona o prefixo 55 para números com DDD (11 dígitos)", () => {
    const link = construirLinkWhatsApp("(11) 98888-7777", "Olá");
    expect(link).toBe("https://wa.me/5511988887777?text=Ol%C3%A1");
  });

  test("não duplica o código do país quando o número já é longo", () => {
    const link = construirLinkWhatsApp("5511988887777", "Oi");
    expect(link).toBe("https://wa.me/5511988887777?text=Oi");
  });

  test("retorna null quando o telefone está vazio", () => {
    expect(construirLinkWhatsApp("", "Oi")).toBeNull();
    expect(construirLinkWhatsApp(null, "Oi")).toBeNull();
  });
});

describe("montarMensagemCliente", () => {
  test("monta a mensagem com os dados do cliente", () => {
    const mensagem = montarMensagemCliente({
      nome: "Joana Silva",
      cpf: "111.222.333-44",
      email: "joana@teste.com",
      ativo: true,
    });
    expect(mensagem).toContain("Olá Joana");
    expect(mensagem).toContain("Cliente: Joana Silva");
    expect(mensagem).toContain("CPF: 111.222.333-44");
    expect(mensagem).toContain("Status: Ativo");
  });

  test("usa travessão para campos ausentes e trata cliente inativo", () => {
    const mensagem = montarMensagemCliente({ ativo: false });
    expect(mensagem).toContain("CPF: —");
    expect(mensagem).toContain("Status: Inativo");
  });
});

describe("montarMensagemProcesso", () => {
  test("traduz o status 'Concluido' para 'Concluído'", () => {
    const mensagem = montarMensagemProcesso({
      numero_processo: "0001/2026",
      titulo: "Ação Trabalhista",
      status: "Concluido",
      cliente_nome: "Joana Silva",
    });
    expect(mensagem).toContain("Status: Concluído");
    expect(mensagem).toContain("Cliente: Joana Silva");
  });

  test("omite advogado responsável quando não informado", () => {
    const mensagem = montarMensagemProcesso({ numero_processo: "0002/2026" });
    expect(mensagem).not.toContain("Advogado responsável");
  });
});
