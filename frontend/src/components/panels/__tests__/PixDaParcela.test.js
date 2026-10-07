import { montarMensagemPix } from "../PixDaParcela";

test("mensagem do WhatsApp leva valor, vencimento e o copia e cola", () => {
  const mensagem = montarMensagemPix({
    cliente_nome: "Maria Fernanda Costa",
    numero: 2,
    total_parcelas: 5,
    numero_processo: "0001234-56.2026.8.26.0100",
    valor: "1250.50",
    data_vencimento: "2026-11-10",
    payload: "000201...6304ABCD",
  });
  expect(mensagem).toContain("Olá, Maria!");
  expect(mensagem).toContain("parcela 2/5");
  expect(mensagem).toMatch(/R\$\s1\.250,50/);
  expect(mensagem).toContain("10/11/2026");
  expect(mensagem.endsWith("000201...6304ABCD")).toBe(true);
});
