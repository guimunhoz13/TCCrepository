import { agruparPorColuna } from "../TarefasQuadro";

describe("agruparPorColuna", () => {
  const tarefas = [
    { id: 1, titulo: "A", status: "aberta" },
    { id: 2, titulo: "B", status: "em_andamento" },
    { id: 3, titulo: "C", status: "concluida" },
    { id: 4, titulo: "D", status: "cancelada" },
  ];

  test("separa por situação e deixa cancelada fora do quadro", () => {
    const grupos = agruparPorColuna(tarefas);
    expect(grupos.aberta.map((t) => t.id)).toEqual([1]);
    expect(grupos.em_andamento.map((t) => t.id)).toEqual([2]);
    expect(grupos.concluida.map((t) => t.id)).toEqual([3]);
    expect(Object.keys(grupos)).toEqual(["aberta", "em_andamento", "concluida"]);
  });

  test("o cartão muda de coluna antes da API responder", () => {
    const grupos = agruparPorColuna(tarefas, { 1: "concluida" });
    expect(grupos.aberta).toEqual([]);
    expect(grupos.concluida.map((t) => t.id)).toEqual([1, 3]);
    expect(grupos.concluida[0].status).toBe("concluida");
  });
});
