import {
  GRUPOS_BUSCA,
  MINIMO_CARACTERES,
  buscarEmTudo,
  contarResultados,
  normalizar,
} from "../busca";
import { PANELS } from "@/contexts/PanelContext";

const colecoes = {
  clientes: [
    { id: 1, nome: "João Conceição", cpf: "12345678900", email: "joao@ex.com" },
    { id: 2, nome: "Maria Souza", cpf: "98765432100", email: "maria@ex.com" },
  ],
  processos: [
    { id: 1, numero_processo: "0001234-56.2026.5.15.0002", titulo: "Reclamação Trabalhista", cliente_nome: "Maria Souza" },
  ],
  tarefas: [
    { id: 1, titulo: "Revisar a minuta", descricao: "Contestação", responsavel_nome: "Bruno", numero_processo: "0001234-56.2026.5.15.0002" },
    { id: 2, titulo: "Renovar certificado", descricao: "", responsavel_nome: "Ana", numero_processo: null },
  ],
  agenda: [
    { id: 1, titulo: "Audiência de conciliação", local_evento: "Fórum de Araçatuba", numero_processo: "0001234-56.2026.5.15.0002" },
  ],
  documentos: [
    { id: 1, nome_arquivo: "procuracao.pdf", numero_processo: "0001234-56.2026.5.15.0002" },
  ],
  contratos: [
    { id: 1, numero_processo: "0001234-56.2026.5.15.0002", processo_titulo: "Reclamação Trabalhista", cliente_nome: "Maria Souza" },
  ],
  apontamentos: [
    { id: 1, descricao: "Audiência de conciliação", numero_processo: "0001234-56.2026.5.15.0002", usuario_nome: "Bruno" },
  ],
  modelos: [
    { id: 1, nome: "Procuração ad judicia", tipo_display: "Procuração", conteudo: "Outorgo poderes..." },
  ],
};

describe("normalizar", () => {
  test("tira acentos para que a busca sem acento encontre", () => {
    expect(normalizar("João Conceição")).toBe("joao conceicao");
    expect(normalizar("Ação")).toBe("acao");
  });

  test("tolera valores ausentes", () => {
    expect(normalizar(null)).toBe("");
    expect(normalizar(undefined)).toBe("");
  });
});

describe("cobertura dos grupos", () => {
  test("cobre as oito áreas com conteúdo pesquisável", () => {
    expect(GRUPOS_BUSCA).toHaveLength(8);
  });

  test("todo grupo aponta para um painel que existe", () => {
    const validos = Object.values(PANELS);
    for (const grupo of GRUPOS_BUSCA) {
      expect(validos).toContain(grupo.painel);
    }
  });

  test("as chaves não se repetem", () => {
    const chaves = GRUPOS_BUSCA.map((g) => g.chave);
    expect(new Set(chaves).size).toBe(chaves.length);
  });
});

describe("buscarEmTudo", () => {
  test("exige um mínimo de letras", () => {
    expect(buscarEmTudo("a", colecoes)).toHaveLength(0);
    expect(MINIMO_CARACTERES).toBe(2);
  });

  test("acha o mesmo termo em áreas diferentes", () => {
    const grupos = buscarEmTudo("conciliação", colecoes);
    expect(grupos.map((g) => g.chave).sort()).toEqual(["agenda", "apontamentos"]);
  });

  test("encontra sem acento o que foi cadastrado com acento", () => {
    const grupos = buscarEmTudo("conciliacao", colecoes);
    expect(grupos.map((g) => g.chave)).toContain("agenda");
  });

  test("o número do processo puxa tudo que está ligado a ele", () => {
    const grupos = buscarEmTudo("0001234-56", colecoes);
    expect(grupos.map((g) => g.chave).sort()).toEqual([
      "agenda",
      "apontamentos",
      "contratos",
      "documentos",
      "processos",
      "tarefas",
    ]);
  });

  test("acha a tarefa pelo nome de quem é responsável", () => {
    const grupos = buscarEmTudo("bruno", colecoes);
    expect(grupos.map((g) => g.chave).sort()).toEqual(["apontamentos", "tarefas"]);
  });

  test("acha o modelo pelo conteúdo, não só pelo nome", () => {
    const grupos = buscarEmTudo("outorgo", colecoes);
    expect(grupos.map((g) => g.chave)).toEqual(["modelos"]);
  });

  test("grupo sem resultado não aparece na lista", () => {
    const grupos = buscarEmTudo("joao", colecoes);
    expect(grupos.map((g) => g.chave)).toEqual(["clientes"]);
  });

  test("coleção que ainda não carregou não quebra a busca", () => {
    const grupos = buscarEmTudo("maria", { clientes: colecoes.clientes });
    expect(grupos.map((g) => g.chave)).toEqual(["clientes"]);
    expect(() => buscarEmTudo("maria", {})).not.toThrow();
  });

  test("limita a quatro resultados por grupo", () => {
    const muitos = Array.from({ length: 9 }, (_, i) => ({
      id: i,
      nome: `Cliente Teste ${i}`,
      cpf: "",
      email: "",
    }));
    const grupos = buscarEmTudo("cliente teste", { clientes: muitos });
    expect(grupos[0].itens).toHaveLength(4);
  });

  test("o título e o detalhe de cada resultado saem do próprio grupo", () => {
    const grupo = buscarEmTudo("procuracao.pdf", colecoes)[0];
    expect(grupo.titulo(grupo.itens[0])).toBe("procuracao.pdf");
    expect(grupo.detalhe(grupo.itens[0])).toBe("0001234-56.2026.5.15.0002");
  });
});

describe("contarResultados", () => {
  test("soma os itens de todos os grupos", () => {
    expect(contarResultados(buscarEmTudo("0001234-56", colecoes))).toBe(6);
    expect(contarResultados([])).toBe(0);
  });
});
