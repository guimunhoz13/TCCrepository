/** Conteúdo da central de ajuda.
 *
 * Fica separado do componente porque é texto, não interface: escrever,
 * revisar e testar um texto não deveria exigir mexer em JSX. Cada seção
 * corresponde a um item da barra lateral, e `painel` liga a seção ao
 * painel aberto no momento — assim o botão de ajuda já abre no assunto
 * de quem clicou.
 */

export const SECOES_AJUDA = [
  {
    id: "visao-geral",
    titulo: "Como o sistema funciona",
    resumo:
      "O LexOffice organiza a rotina de um escritório de advocacia em um só lugar: clientes, processos, prazos, documentos, honorários e horas trabalhadas.",
    topicos: [
      {
        titulo: "Cada escritório enxerga só os próprios dados",
        texto:
          "Todo registro pertence a um escritório. Um usuário nunca vê cliente, processo ou documento de outro escritório, mesmo que saiba o endereço da página.",
      },
      {
        titulo: "A barra lateral abre painéis, não páginas",
        texto:
          "Clicar em Clientes, Processos ou qualquer outro item abre um painel por cima da dashboard. Fechar o painel devolve você exatamente onde estava, sem recarregar nada.",
      },
      {
        titulo: "Dois perfis de acesso",
        texto:
          "Administrador vê tudo e cadastra advogados. Advogado usa o sistema no dia a dia, mas não cadastra outros usuários nem consulta o registro de auditoria.",
      },
      {
        titulo: "Busca no topo",
        texto:
          "O campo de busca procura em clientes, processos e documentos ao mesmo tempo. Clicar em um resultado abre o painel correspondente já na ficha certa.",
      },
      {
        titulo: "Pode ser instalado como aplicativo",
        texto:
          "No celular ou no computador, o navegador oferece instalar o LexOffice. Instalado, ele abre direto no painel, em janela própria e com ícone na tela inicial.",
      },
    ],
  },

  {
    id: "dashboard",
    titulo: "Dashboard",
    resumo: "A tela de abertura responde o que exige atenção hoje.",
    topicos: [
      {
        titulo: "Cartões de contagem",
        texto:
          "Clientes, processos, audiências e documentos cadastrados, com quantos entraram na última semana. O botão “Ver todos” abre o painel correspondente.",
      },
      {
        titulo: "Financeiro do escritório",
        texto:
          "A receber soma as parcelas em aberto de todos os contratos. Recebido no mês conta as quitadas desde o dia 1º. Vencido fica em vermelho quando alguma parcela passou do prazo. Também mostra as horas faturáveis apontadas no mês e as despesas adiantadas que ainda não foram cobradas do cliente.",
      },
      {
        titulo: "Próximos compromissos e prazos vencendo",
        texto:
          "Os compromissos futuros da agenda e os prazos dos próximos três dias. Prazo que vence hoje aparece destacado.",
      },
      {
        titulo: "Minhas tarefas",
        texto:
          "As tarefas atribuídas a você que ainda estão abertas, da mais urgente para a menos. Tarefa com prazo vencido é marcada como atrasada.",
      },
      {
        titulo: "Gráficos",
        texto:
          "O donut divide os processos por status; clicar numa fatia ou na legenda destaca aquele status. As barras comparam os totais do escritório. As cores do gráfico são as mesmas dos selos das tabelas.",
      },
    ],
  },

  {
    id: "clientes",
    painel: "clientes",
    titulo: "Clientes",
    resumo: "Cadastro de quem o escritório representa.",
    topicos: [
      {
        titulo: "Lista",
        texto:
          "Todos os clientes com busca e filtro por situação. Cliente inativo continua no sistema com o histórico preservado — inativar não apaga nada.",
      },
      {
        titulo: "Novo cliente",
        texto:
          "Nome, CPF, e-mail, telefone e endereço. O CPF é conferido pelo dígito verificador e não pode repetir dentro do mesmo escritório.",
      },
      {
        titulo: "O que dá para fazer em cada linha",
        texto:
          "Editar, inativar, gerar o relatório completo do cliente e enviar mensagem por WhatsApp com os dados já preenchidos.",
      },
      {
        titulo: "Relatório do cliente",
        texto:
          "Abre em nova aba, pronto para imprimir ou salvar em PDF. Traz processos, documentos, agenda, contratos, horas trabalhadas, despesas e o resumo financeiro. Também pode ser enviado por e-mail pela aba Relatórios das Configurações.",
      },
    ],
  },

  {
    id: "processos",
    painel: "processos",
    titulo: "Processos",
    resumo: "O acompanhamento de cada caso, do cadastro às movimentações.",
    topicos: [
      {
        titulo: "Cadastro",
        texto:
          "Número do processo, título, cliente, advogado responsável, área do direito, vara, comarca, tribunal, valor da causa e status. O número segue a numeração unificada do CNJ.",
      },
      {
        titulo: "Status",
        texto:
          "Em andamento, Concluído, Suspenso e Arquivado. Cada um tem sua cor, a mesma no selo da tabela e no gráfico da dashboard.",
      },
      {
        titulo: "Consulta ao tribunal (DataJud)",
        texto:
          "O botão de consulta busca os andamentos do processo na API pública do CNJ e importa os que ainda não estavam no sistema, sem duplicar. Processos em andamento e suspensos também são sincronizados automaticamente, e quem optou por receber o aviso é notificado por e-mail quando aparece andamento novo.",
      },
      {
        titulo: "Movimentações",
        texto:
          "O histórico do processo. Cada movimentação guarda a data real do tribunal e se veio da consulta automática ou foi lançada à mão, com o nome de quem lançou.",
      },
    ],
  },

  {
    id: "agenda",
    painel: "agenda",
    titulo: "Agenda",
    resumo: "Audiências, reuniões e prazos processuais.",
    topicos: [
      {
        titulo: "Compromisso ou prazo",
        texto:
          "Compromisso é algo com hora marcada — audiência, reunião, perícia. Prazo é uma data-limite processual.",
      },
      {
        titulo: "Prazo fatal",
        texto:
          "Um prazo pode ser marcado como fatal (peremptório). Ele aparece destacado e o lembrete por e-mail avisa que é fatal.",
      },
      {
        titulo: "Cálculo em dias úteis",
        texto:
          "Ao cadastrar um prazo, o sistema calcula a data-limite contando apenas dias úteis, já descontando fins de semana e feriados nacionais, como manda o CPC.",
      },
      {
        titulo: "Lembretes por e-mail",
        texto:
          "Quem ativou o lembrete recebe aviso antes do compromisso, com a antecedência escolhida nas Configurações. O mesmo vale para prazos. Há ainda um resumo semanal opcional, enviado toda segunda-feira.",
      },
    ],
  },

  {
    id: "tarefas",
    painel: "tarefas",
    titulo: "Tarefas",
    resumo:
      "O trabalho interno do escritório que não tem hora marcada: levantar jurisprudência, revisar uma minuta, ligar para a testemunha.",
    topicos: [
      {
        titulo: "Toda tarefa tem um responsável",
        texto:
          "É a diferença para a agenda. Quem recebe a tarefa é avisado por e-mail, a menos que tenha desligado esse aviso nas Configurações. Quem se atribui uma tarefa não recebe aviso de si mesmo.",
      },
      {
        titulo: "As abas",
        texto:
          "Minhas tarefas mostra o que está em aberto para você. Do escritório mostra o que está em aberto para todos. Histórico traz tudo, inclusive o que já foi concluído ou cancelado.",
      },
      {
        titulo: "Prioridade e prazo",
        texto:
          "A lista vem ordenada por prioridade e depois pelo prazo mais próximo. Tarefa sem prazo fica no fim — não é urgente só por não ter data. Prazo vencido marca a tarefa como atrasada.",
      },
      {
        titulo: "Processo é opcional",
        texto:
          "Nem todo trabalho nasce de um processo. Renovar o certificado digital do escritório é tarefa sem processo vinculado.",
      },
    ],
  },

  {
    id: "documentos",
    painel: "documentos",
    titulo: "Documentos",
    resumo: "Arquivos anexados a um processo.",
    topicos: [
      {
        titulo: "O que pode ser enviado",
        texto:
          "PDF, DOC, DOCX, JPG e PNG, com até 10 MB por arquivo. Todo documento fica vinculado a um processo.",
      },
      {
        titulo: "Na lista",
        texto:
          "Nome do arquivo, processo, quem enviou e quando. Dá para baixar ou excluir.",
      },
    ],
  },

  {
    id: "contratos",
    painel: "contratos",
    titulo: "Contratos e honorários",
    resumo: "O acordo financeiro de cada processo.",
    topicos: [
      {
        titulo: "Tipos de honorário",
        texto:
          "Valor fixo, percentual de êxito ou por hora trabalhada. Cada processo tem no máximo um contrato.",
      },
      {
        titulo: "Parcelamento",
        texto:
          "À vista ou parcelado. Escolhendo parcelado, o sistema gera as parcelas com vencimento mensal; a última absorve a diferença de arredondamento para que a soma feche com o valor do contrato.",
      },
      {
        titulo: "Marcar parcela como paga",
        texto:
          "A data do pagamento é gravada no momento em que você marca. É ela que alimenta o “Recebido no mês” da dashboard.",
      },
    ],
  },

  {
    id: "horas",
    painel: "horas",
    titulo: "Horas e custos",
    resumo: "Quanto tempo e quanto dinheiro cada processo consumiu.",
    topicos: [
      {
        titulo: "Apontar hora",
        texto:
          "Data, tempo gasto, o que foi feito e se é faturável. O tempo é guardado em minutos, então 1h30 não vira arredondamento. Informando o valor por hora, o sistema calcula quanto aquele apontamento vale.",
      },
      {
        titulo: "Hora não faturável",
        texto:
          "Retrabalho ou cortesia entram no total trabalhado mas ficam de fora do que há a cobrar. Aparecem no relatório marcadas como não faturáveis.",
      },
      {
        titulo: "Despesas e custas",
        texto:
          "Custas processuais, diligências, cópias, viagem e honorários periciais. Uma despesa pode ser marcada como reembolsável — adiantada pelo escritório e cobrada do cliente depois — e como já reembolsada.",
      },
      {
        titulo: "Tempo de uso",
        texto:
          "Quanto tempo cada usuário passou dentro do sistema no mês. O sistema registra atividade a cada cinco minutos enquanto a aba está visível; ficar com a aba aberta em segundo plano não conta.",
      },
    ],
  },

  {
    id: "modelos",
    painel: "modelos",
    titulo: "Modelos de documento",
    resumo:
      "Textos que se repetem — procuração, contrato, declaração — preenchidos com os dados de um cliente ou processo.",
    topicos: [
      {
        titulo: "Como escrever um modelo",
        texto:
          "Escreva o texto e marque as partes variáveis entre chaves duplas, como {{cliente.nome}} ou {{processo.numero}}. A lista de variáveis disponíveis fica ao lado do editor.",
      },
      {
        titulo: "Gerar o documento",
        texto:
          "Escolha o modelo e o cliente ou processo. O sistema preenche as variáveis e avisa quais ficaram sem valor, para você não imprimir um documento com lacuna.",
      },
      {
        titulo: "Só as variáveis do catálogo funcionam",
        texto:
          "O sistema reconhece uma lista fechada de variáveis. Qualquer outra coisa entre chaves é deixada como está — é o que impede um modelo de alcançar dado que não deveria.",
      },
    ],
  },

  {
    id: "advogados",
    painel: "advogados",
    titulo: "Advogados",
    resumo: "Os profissionais do escritório. Disponível para administradores.",
    topicos: [
      {
        titulo: "Cadastro",
        texto:
          "Nome, e-mail, OAB, especialidade e valor por hora padrão. O cadastro cria também o acesso do advogado ao sistema.",
      },
      {
        titulo: "Valor por hora padrão",
        texto:
          "Serve de sugestão ao apontar horas, mas pode ser alterado em cada apontamento.",
      },
    ],
  },

  {
    id: "assistente",
    titulo: "Assistente IA",
    resumo: "Um assistente que responde sobre os dados do próprio escritório.",
    topicos: [
      {
        titulo: "O que ele enxerga",
        texto:
          "Apenas dados do escritório de quem está logado. A pergunta pode ser sobre um cliente ou processo específico, e o assistente recebe o contexto daquele registro.",
      },
      {
        titulo: "Como usar bem",
        texto:
          "Funciona melhor com perguntas concretas — resumir o andamento de um processo, listar o que está pendente de um cliente. Confira sempre a resposta antes de usá-la em peça processual.",
      },
    ],
  },

  {
    id: "configuracoes",
    painel: "config",
    titulo: "Configurações",
    resumo: "Oito abas, da sua conta ao registro de auditoria.",
    topicos: [
      {
        titulo: "Conta e Escritório",
        texto:
          "Seus dados, foto e senha. Em Escritório ficam os dados que aparecem no cabeçalho dos relatórios e dos e-mails.",
      },
      {
        titulo: "Notificações",
        texto:
          "Liga e desliga cada aviso por e-mail: processo novo, documento anexado, mudança de status, andamento encontrado no tribunal, cliente novo, tarefa atribuída a você, lembrete de audiência e de prazo, e o resumo semanal. Também define com quantos dias de antecedência quer o lembrete.",
      },
      {
        titulo: "Aparência",
        texto:
          "Tema claro ou escuro, densidade das tabelas, idioma e qual página abre ao entrar.",
      },
      {
        titulo: "Dados",
        texto: "Exporta clientes e processos em CSV, para abrir no Excel.",
      },
      {
        titulo: "Relatórios",
        texto:
          "Gera o relatório de um cliente ou de um processo, envia por e-mail ou abre no WhatsApp com o resumo pronto.",
      },
      {
        titulo: "Auditoria",
        texto:
          "Só para administradores. Registra login, tentativa de login que falhou, criação, edição e exclusão, com usuário, data e endereço de origem.",
      },
    ],
  },

  {
    id: "atalhos",
    titulo: "Detalhes que ajudam",
    resumo: "Coisas pequenas que passam despercebidas.",
    topicos: [
      {
        titulo: "Trocar o tema",
        texto:
          "O ícone de lua ou sol no topo alterna entre claro e escuro, e o sistema lembra a escolha no próximo acesso.",
      },
      {
        titulo: "O sino de notificações",
        texto:
          "Mostra os compromissos e prazos mais próximos. Clicar em um deles abre a agenda no evento.",
      },
      {
        titulo: "Sessão e segurança",
        texto:
          "Sair do sistema invalida o acesso no servidor, não só no navegador. Cinco tentativas de login erradas bloqueiam a conta temporariamente.",
      },
      {
        titulo: "Sem conexão",
        texto:
          "Instalado como aplicativo, o sistema abre uma tela explicando a falta de conexão em vez de um erro do navegador. Dados de processo nunca ficam guardados no aparelho.",
      },
    ],
  },
];

/** Devolve a seção correspondente a um painel aberto, se houver. */
export function secaoDoPainel(painel) {
  if (!painel) return null;
  return SECOES_AJUDA.find((secao) => secao.painel === painel) || null;
}

/** Filtra seções e tópicos por um termo de busca.
 *
 * Duas intenções diferentes, duas respostas: procurar pelo nome de um
 * assunto ("Tarefas") devolve o assunto inteiro; procurar por um detalhe
 * ("dias úteis") devolve só os tópicos que falam dele, para a leitura ir
 * direto ao ponto.
 */
export function buscarNaAjuda(termo) {
  const alvo = (termo || "").trim().toLowerCase();
  if (!alvo) return SECOES_AJUDA;

  const contem = (texto) => (texto || "").toLowerCase().includes(alvo);

  return SECOES_AJUDA.map((secao) => {
    if (contem(secao.titulo)) return secao;

    const topicos = secao.topicos.filter(
      (topico) => contem(topico.titulo) || contem(topico.texto)
    );
    if (topicos.length > 0) return { ...secao, topicos };

    // O resumo descreve o assunto como um todo: casando só nele, o assunto
    // inteiro é a resposta.
    return contem(secao.resumo) ? secao : null;
  }).filter(Boolean);
}
