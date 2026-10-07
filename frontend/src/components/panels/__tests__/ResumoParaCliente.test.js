import { descreverOrigem } from "../ResumoParaCliente";

test("explica de onde veio o texto, no singular e no plural", () => {
  expect(descreverOrigem({ fonte: "ia", andamentos: 3 })).toBe("Escrito pela IA a partir de 3 andamentos recentes.");
  expect(descreverOrigem({ fonte: "modelo", andamentos: 1 })).toBe("Modelo automático com 1 andamento recente em linguagem simples.");
  expect(descreverOrigem({ fonte: "modelo", andamentos: 0 })).toMatch(/não há andamentos/);
});
