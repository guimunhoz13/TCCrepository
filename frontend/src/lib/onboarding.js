/**
 * Os primeiros passos refletem dados reais do escritório. Assim o checklist
 * continua correto se a pessoa cadastrar algo por outro caminho ou em outro
 * aparelho, sem depender de uma lista marcada manualmente no navegador.
 */
export function primeirosPassos({ stats, usuario, pode = () => true }) {
  const totais = stats?.totais || {};
  const escritorio = stats?.escritorio || {};
  const perfilPronto = Boolean(
    usuario?.nome && usuario?.email && (escritorio?.nome || usuario?.escritorio_nome)
  );

  const passos = [
    {
      id: "perfil",
      titulo: "Confira seu perfil e o escritório",
      descricao: "Revise nome, telefone, endereço do escritório e chave PIX.",
      concluido: perfilPronto,
      painel: "config",
      aba: "conta",
      acao: "Revisar configurações",
    },
  ];

  if (pode("clientes", "criar")) {
    passos.push({
      id: "cliente",
      titulo: "Cadastre o primeiro cliente",
      descricao: "Comece por CPF ou CNPJ, contato, endereço e consentimento LGPD.",
      concluido: Number(totais.clientes || 0) > 0,
      painel: "clientes",
      aba: "novo",
      acao: "Cadastrar cliente",
    });
  }

  if (pode("processos", "criar")) {
    const temCliente = Number(totais.clientes || 0) > 0;
    passos.push({
      id: "processo",
      titulo: "Crie o primeiro processo",
      descricao: temCliente
        ? "Vincule o cliente, o responsável e os dados do tribunal."
        : "O processo precisa de um cliente; o atalho leva primeiro ao cadastro dele.",
      concluido: Number(totais.processos || 0) > 0,
      painel: temCliente ? "processos" : "clientes",
      aba: "novo",
      acao: temCliente ? "Criar processo" : "Cadastrar cliente primeiro",
    });
  }

  if (pode("agenda", "criar")) {
    passos.push({
      id: "agenda",
      titulo: "Registre um compromisso ou prazo",
      descricao: "Use a agenda para audiências, reuniões e datas-limite processuais.",
      concluido: Number(totais.agenda || 0) > 0,
      painel: "agenda",
      aba: "novo",
      acao: "Abrir agenda",
    });
  }

  if (pode("documentos", "criar")) {
    const temProcesso = Number(totais.processos || 0) > 0;
    passos.push({
      id: "documento",
      titulo: "Anexe o primeiro documento",
      descricao: temProcesso
        ? "Centralize os arquivos no processo correspondente."
        : "Todo documento precisa de um processo; crie um antes de enviar o arquivo.",
      concluido: Number(totais.documentos || 0) > 0,
      painel: temProcesso ? "documentos" : "processos",
      aba: "novo",
      acao: temProcesso ? "Enviar documento" : "Criar processo primeiro",
    });
  }

  return passos;
}

export function progressoDosPassos(passos) {
  const concluidos = passos.filter((passo) => passo.concluido).length;
  return {
    concluidos,
    total: passos.length,
    percentual: passos.length ? Math.round((concluidos / passos.length) * 100) : 100,
  };
}

export function escritorioAindaVazio(stats) {
  const totais = stats?.totais || {};
  return ["clientes", "processos", "agenda", "documentos"].every(
    (chave) => Number(totais[chave] || 0) === 0
  );
}
