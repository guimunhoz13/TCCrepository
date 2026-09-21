import { gerarHtmlRelatorioCliente, gerarHtmlRelatorioProcesso } from "../relatorio";

const escritorio = { nome: "Escritório Teste" };

const contrato = {
  id: 1,
  numero_processo: "0001234-56.2026.8.26.0100",
  tipo_honorario: "hora",
  valor_total: "5000.00",
  valor_pago: "2000.00",
  valor_pendente: "3000.00",
  status: "ativo",
};

const apontamento = {
  id: 1,
  numero_processo: "0001234-56.2026.8.26.0100",
  usuario_nome: "Dra. Ana",
  data: "2026-03-10",
  minutos: 150,
  descricao: "Elaboração da petição inicial",
  faturavel: true,
  valor: "750.00",
};

const despesa = {
  id: 1,
  numero_processo: "0001234-56.2026.8.26.0100",
  tipo_display: "Custas processuais",
  descricao: "Guia de custas iniciais",
  valor: "312.45",
  data: "2026-03-11",
  reembolsavel: true,
  reembolsada: false,
};

const resumo = {
  minutos_trabalhados: 150,
  minutos_faturaveis: 150,
  valor_horas_faturaveis: 750,
  total_despesas: 312.45,
  despesas_a_reembolsar: 312.45,
  valor_contratado: 5000,
  valor_pago: 2000,
  valor_pendente: 3000,
};

function dadosCliente(extra = {}) {
  return {
    escritorio,
    cliente: { nome: "João da Silva", cpf: "123.456.789-00", ativo: true },
    processos: [],
    documentos: [],
    agenda: [],
    contratos: [contrato],
    apontamentos: [apontamento],
    despesas: [despesa],
    resumo,
    ...extra,
  };
}

function dadosProcesso(extra = {}) {
  return {
    escritorio,
    processo: { numero_processo: "0001234-56.2026.8.26.0100", titulo: "Ação trabalhista", status: "Em andamento" },
    cliente: { nome: "João da Silva" },
    documentos: [],
    movimentacoes: [],
    agenda: [],
    contratos: [contrato],
    apontamentos: [apontamento],
    despesas: [despesa],
    resumo,
    ...extra,
  };
}

describe("gerarHtmlRelatorioCliente", () => {
  test("mostra contratos, horas e despesas do cliente", () => {
    const html = gerarHtmlRelatorioCliente(dadosCliente());

    expect(html).toContain("Situação financeira");
    expect(html).toContain("Por hora trabalhada");
    expect(html).toContain("Elaboração da petição inicial");
    expect(html).toContain("Guia de custas iniciais");
    expect(html).toContain("2h30");
    expect(html).toContain("A reembolsar");
  });

  test("formata os totais em reais", () => {
    const html = gerarHtmlRelatorioCliente(dadosCliente());

    // O toLocaleString usa espaço não separável antes do valor.
    expect(html.replace(/ /g, " ")).toContain("R$ 3.000,00");
  });

  test("não desloca datas sem hora para o dia anterior", () => {
    const html = gerarHtmlRelatorioCliente(dadosCliente());

    expect(html).toContain("10/03/2026");
    expect(html).not.toContain("09/03/2026");
  });

  test("marca hora de cortesia em vez de mostrar valor", () => {
    const html = gerarHtmlRelatorioCliente(
      dadosCliente({ apontamentos: [{ ...apontamento, faturavel: false, valor: null }] })
    );

    expect(html).toContain("Não faturável");
  });

  test("avisa quando não há nada lançado", () => {
    const html = gerarHtmlRelatorioCliente(
      dadosCliente({ contratos: [], apontamentos: [], despesas: [], resumo: {} })
    );

    expect(html).toContain("Nenhum contrato registrado.");
    expect(html).toContain("Nenhuma hora apontada.");
    expect(html).toContain("Nenhuma despesa lançada.");
    expect(html).toContain("0h00");
  });

  test("escapa conteúdo vindo do usuário", () => {
    const html = gerarHtmlRelatorioCliente(
      dadosCliente({ despesas: [{ ...despesa, descricao: "<script>alert(1)</script>" }] })
    );

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("gerarHtmlRelatorioProcesso", () => {
  test("mostra o bloco financeiro do processo", () => {
    const html = gerarHtmlRelatorioProcesso(dadosProcesso());

    expect(html).toContain("Situação financeira");
    expect(html).toContain("Despesas e custas");
    expect(html).toContain("Guia de custas iniciais");
  });

  test("omite a coluna de processo, que repetiria o mesmo número", () => {
    const html = gerarHtmlRelatorioProcesso(dadosProcesso());
    const secoes = html.slice(html.indexOf("Situação financeira"));

    expect(secoes).not.toContain("<th>Processo</th>");
  });

  test("mantém a coluna de processo no relatório do cliente", () => {
    const html = gerarHtmlRelatorioCliente(dadosCliente());
    const secoes = html.slice(html.indexOf("Situação financeira"));

    expect(secoes).toContain("<th>Processo</th>");
  });
});
