import { SECOES_AJUDA, buscarNaAjuda, secaoDoPainel } from "../ajuda";
import { PANELS } from "@/contexts/PanelContext";

describe("conteúdo da ajuda", () => {
  test("toda seção tem título, resumo e ao menos um tópico", () => {
    for (const secao of SECOES_AJUDA) {
      expect(secao.titulo).toBeTruthy();
      expect(secao.resumo).toBeTruthy();
      expect(secao.topicos.length).toBeGreaterThan(0);
      for (const topico of secao.topicos) {
        expect(topico.titulo).toBeTruthy();
        expect(topico.texto).toBeTruthy();
      }
    }
  });

  test("os identificadores não se repetem", () => {
    const ids = SECOES_AJUDA.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("todo painel citado existe de verdade", () => {
    // Um painel renomeado sem atualizar a ajuda deixaria o botão abrindo
    // no assunto errado, em silêncio.
    const painelsValidos = Object.values(PANELS);
    for (const secao of SECOES_AJUDA) {
      if (secao.painel) expect(painelsValidos).toContain(secao.painel);
    }
  });

  test("os painéis da barra lateral com conteúdo próprio estão cobertos", () => {
    const cobertos = SECOES_AJUDA.map((s) => s.painel).filter(Boolean);
    for (const painel of [
      PANELS.CLIENTES,
      PANELS.PROCESSOS,
      PANELS.AGENDA,
      PANELS.DOCUMENTOS,
      PANELS.CONTRATOS,
      PANELS.HORAS,
      PANELS.TAREFAS,
      PANELS.MODELOS,
      PANELS.ADVOGADOS,
      PANELS.CONFIG,
    ]) {
      expect(cobertos).toContain(painel);
    }
  });
});

describe("secaoDoPainel", () => {
  test("encontra a seção do painel aberto", () => {
    expect(secaoDoPainel(PANELS.TAREFAS).id).toBe("tarefas");
  });

  test("sem painel aberto, não força nenhuma seção", () => {
    expect(secaoDoPainel(null)).toBeNull();
    expect(secaoDoPainel(PANELS.PLANOS)).toBeNull();
  });
});

describe("buscarNaAjuda", () => {
  test("busca vazia devolve tudo", () => {
    expect(buscarNaAjuda("")).toHaveLength(SECOES_AJUDA.length);
    expect(buscarNaAjuda("   ")).toHaveLength(SECOES_AJUDA.length);
  });

  test("acha pelo texto de um tópico, não só pelo título", () => {
    const achados = buscarNaAjuda("dias úteis");
    expect(achados.map((s) => s.id)).toContain("agenda");
  });

  test("devolve só os tópicos que casam, para a leitura ir direto ao ponto", () => {
    const agenda = buscarNaAjuda("dias úteis").find((s) => s.id === "agenda");
    expect(agenda.topicos).toHaveLength(1);
    expect(agenda.topicos[0].titulo).toBe("Cálculo em dias úteis");
  });

  test("quando o termo casa com o título da seção, mantém todos os tópicos", () => {
    const tarefas = buscarNaAjuda("Tarefas").find((s) => s.id === "tarefas");
    const original = SECOES_AJUDA.find((s) => s.id === "tarefas");
    expect(tarefas.topicos).toHaveLength(original.topicos.length);
  });

  test("ignora maiúsculas e minúsculas", () => {
    expect(buscarNaAjuda("DATAJUD").length).toBeGreaterThan(0);
    expect(buscarNaAjuda("datajud").length).toBeGreaterThan(0);
  });

  test("termo sem correspondência devolve lista vazia", () => {
    expect(buscarNaAjuda("xyzabc123")).toHaveLength(0);
  });

  test("não altera o conteúdo original", () => {
    const antes = SECOES_AJUDA.find((s) => s.id === "agenda").topicos.length;
    buscarNaAjuda("dias úteis");
    expect(SECOES_AJUDA.find((s) => s.id === "agenda").topicos).toHaveLength(antes);
  });
});
