import {
  GRUPOS_BUSCA,
  MINIMO_CARACTERES,
  agruparResultados,
  contarResultados,
} from "../busca";
import { PANELS } from "@/contexts/PanelContext";

// Formato da resposta de /api/busca/: a filtragem já foi feita no servidor.
const resposta = {
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

describe("agruparResultados", () => {
  test("o mínimo de letras para buscar é dois", () => {
    expect(MINIMO_CARACTERES).toBe(2);
  });

  test("mantém a ordem das áreas definida em GRUPOS_BUSCA", () => {
    const grupos = agruparResultados(resposta);
    expect(grupos.map((g) => g.chave)).toEqual(GRUPOS_BUSCA.map((g) => g.chave));
  });

  test("área sem resultado não aparece na lista", () => {
    const grupos = agruparResultados({ clientes: resposta.clientes, processos: [] });
    expect(grupos.map((g) => g.chave)).toEqual(["clientes"]);
  });

  test("resposta vazia ou ausente não quebra", () => {
    expect(agruparResultados({})).toEqual([]);
    expect(agruparResultados(undefined)).toEqual([]);
  });

  test("limita a quatro resultados por grupo", () => {
    const muitos = Array.from({ length: 9 }, (_, i) => ({ id: i, nome: `Cliente ${i}` }));
    expect(agruparResultados({ clientes: muitos })[0].itens).toHaveLength(4);
  });

  test("o título e o detalhe de cada resultado saem do próprio grupo", () => {
    const grupo = agruparResultados({ documentos: resposta.documentos })[0];
    expect(grupo.titulo(grupo.itens[0])).toBe("procuracao.pdf");
    expect(grupo.detalhe(grupo.itens[0])).toBe("0001234-56.2026.5.15.0002");
  });

  test("cliente pessoa jurídica mostra o CNPJ como detalhe", () => {
    const grupo = agruparResultados({ clientes: [{ id: 9, nome: "Empresa", cpf: "", cnpj: "11222333000144" }] })[0];
    expect(grupo.detalhe(grupo.itens[0])).toBe("11222333000144");
  });
});

describe("contarResultados", () => {
  test("soma os itens de todos os grupos", () => {
    expect(contarResultados(agruparResultados(resposta))).toBe(10);
    expect(contarResultados([])).toBe(0);
  });
});
