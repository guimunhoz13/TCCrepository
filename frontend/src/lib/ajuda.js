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
        titulo: "Cinco perfis de acesso",
        texto:
          "Administrador vê tudo e gerencia a equipe. Advogado usa o sistema no dia a dia. Estagiário cadastra e edita, mas não exclui nada nem vê o financeiro. Financeiro cuida de contratos, cobranças e despesas e só consulta o resto. Secretária cuida do atendimento, dos clientes e da agenda. Quando o seu perfil não pode fazer uma ação, o botão dela nem aparece.",
      },
      {
        titulo: "Busca no topo",
        texto:
          "O campo de busca procura ao mesmo tempo em clientes, processos, documentos, tarefas, agenda, contratos, horas e modelos. Clicar em um resultado abre o painel correspondente já na ficha certa.",
      },
      {
        titulo: "Pode ser instalado como aplicativo",
        texto:
          "No celular ou no computador, o navegador oferece instalar o LexOffice. Instalado, ele abre direto no painel, em janela própria e com ícone na tela inicial.",
      },
      {
        titulo: "Plano do escritório",
        texto:
          "Todo escritório começa no plano Gratuito, sem pagamento: até 3 usuários e 30 processos ativos. Os planos Básico e Profissional ampliam os limites e trazem as intimações do DJEN, a sincronização automática do DataJud e a IA. Atingir um limite só impede criar mais; nada é apagado. O plano atual e o uso ficam em Planos, no menu.",
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
          "Pessoa física (com CPF) ou jurídica (com CNPJ), e-mail, telefone e endereço — informando o CEP, rua, bairro, cidade e UF são preenchidos sozinhos. Para pessoa jurídica, ao informar o CNPJ, razão social, e-mail, telefone e endereço vêm do cadastro da Receita Federal, só nos campos que estiverem vazios — confira antes de salvar. O CPF precisa ter 11 dígitos e o CNPJ 14, e nenhum dos dois pode repetir dentro do mesmo escritório.",
      },
      {
        titulo: "O que dá para fazer em cada linha",
        texto:
          "Editar, enviar mensagem por WhatsApp com os dados já preenchidos, inativar, exportar os dados do titular, anonimizar e excluir.",
      },
      {
        titulo: "LGPD",
        texto:
          "O cadastro registra se o cliente consentiu com o tratamento dos dados e quando. Se ele pedir, o escritório exporta os dados dele em arquivo ou anonimiza o cadastro. A anonimização não tem volta e pede confirmação; os processos continuam no sistema.",
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
          "Número do processo, título, cliente, advogado responsável, área do direito, vara, comarca, valor da causa, parte contrária, advogado adverso, percentual de honorários de sucumbência e status. O número segue a numeração unificada do CNJ.",
      },
      {
        titulo: "Status",
        texto:
          "Em andamento, Concluído, Suspenso e Arquivado. Cada um tem sua cor, a mesma no selo da tabela e no gráfico da dashboard.",
      },
      {
        titulo: "Consulta ao tribunal (DataJud)",
        texto:
          "O botão de consulta busca os andamentos do processo na API pública do CNJ e importa os que ainda não estavam no sistema, sem duplicar. Nos planos pagos, processos em andamento e suspensos também são sincronizados automaticamente, e quem optou por receber o aviso é notificado por e-mail quando aparece andamento novo.",
      },
      {
        titulo: "Movimentações",
        texto:
          "O histórico do processo. Cada movimentação guarda a data real do tribunal e se veio da consulta automática ou foi lançada à mão, com o nome de quem lançou.",
      },
      {
        titulo: "Segredo de justiça",
        texto:
          "Um processo marcado como sigiloso ganha um selo e só aparece para o administrador e para o advogado responsável — na lista, na busca, nos relatórios, no calendário, nas intimações e no assistente de IA.",
      },
      {
        titulo: "Intimações do DJEN",
        texto:
          "A aba Intimações busca as publicações do Diário de Justiça Eletrônico Nacional pela OAB de cada advogado, liga cada uma ao processo, lê o prazo no texto e lança o vencimento na agenda. Sem prazo no texto, o sistema adota 5 dias e marca como estimado. Confira sempre o texto ao lado do prazo. Disponível nos planos pagos.",
      },
      {
        titulo: "Atualizar o cliente",
        texto:
          "Na ficha do processo, gera uma mensagem de WhatsApp explicando o andamento sem juridiquês. No plano Profissional quem escreve é a IA; nos outros, um modelo automático. Você sempre revisa antes de enviar.",
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
          "Ao cadastrar um prazo, o sistema calcula a data-limite contando apenas dias úteis, já descontando fins de semana, feriados nacionais e os feriados locais cadastrados em Agenda › Feriados locais, como manda o CPC. O calendário do painel marca esses feriados e o recesso forense.",
      },
      {
        titulo: "Feriados locais",
        texto:
          "Na aba Feriados locais, cadastre os feriados da sua comarca e as suspensões de expediente do tribunal, valendo só naquela data ou todo ano. Eles entram na calculadora de prazos, nas intimações do DJEN e no calendário do painel.",
      },
      {
        titulo: "Lembretes por e-mail",
        texto:
          "Quem ativou o lembrete recebe aviso antes do compromisso, com a antecedência escolhida nas Configurações. O mesmo vale para prazos. Há ainda um resumo semanal opcional, enviado toda segunda-feira.",
      },
      {
        titulo: "Agenda no celular",
        texto:
          "A aba Sincronizar baixa a agenda em arquivo .ics ou cria um link privado que o Google Agenda, o Outlook ou o iPhone assinam e mantêm atualizado sozinhos.",
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
        titulo: "Quadro",
        texto:
          "A aba Quadro mostra as tarefas em colunas — A fazer, Fazendo e Concluídas. Arraste o cartão ou use as setas dele, que funcionam também no teclado e no celular.",
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
      {
        titulo: "Cobrança por PIX",
        texto:
          "Com a chave PIX cadastrada em Configurações › Escritório, cada parcela pendente ganha um QR code e o código copia e cola com o valor certo, que pode ser enviado ao cliente pelo WhatsApp. A baixa da parcela continua sendo feita por você.",
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
          "Apenas dados do escritório de quem está logado — e processos em segredo de justiça só para quem pode vê-los. A pergunta pode ser sobre um cliente ou processo específico, e o assistente recebe o contexto daquele registro. Disponível no plano Profissional.",
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
          "Em Conta ficam seus dados, foto, senha e a verificação em duas etapas. Em Escritório, os dados que aparecem nos relatórios e e-mails, a chave PIX das cobranças e a equipe, onde o administrador inclui membros e define o perfil de cada um.",
      },
      {
        titulo: "Notificações",
        texto:
          "Liga e desliga cada aviso por e-mail: processo novo, documento anexado, mudança de status, andamento encontrado no tribunal, cliente novo, tarefa atribuída a você, lembrete de audiência e de prazo, e o resumo semanal. Também define com quantos dias de antecedência quer o lembrete e ativa as notificações no celular e no navegador, que chegam mesmo com o sistema fechado.",
      },
      {
        titulo: "Aparência",
        texto:
          "Tema claro ou escuro, densidade das tabelas, idioma e qual página abre ao entrar.",
      },
      {
        titulo: "Dados",
        texto:
          "Exporta clientes e processos em CSV, para abrir no Excel, e define a retenção de documentos. Na zona de risco, o administrador pode desativar o escritório.",
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
      {
        titulo: "Faturamento",
        texto:
          "Mostra o plano do escritório e quanto dele está em uso, com atalho para ver os planos.",
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
          "Mostra os compromissos e prazos mais próximos. Clicar em um deles abre a agenda no evento. O calendário do painel marca os feriados e o recesso forense.",
      },
      {
        titulo: "Sessão e segurança",
        texto:
          "Sair do sistema invalida o acesso no servidor, não só no navegador. Três tentativas de senha erradas seguidas bloqueiam a conta por 15 minutos; na verificação em duas etapas, cinco códigos errados.",
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
