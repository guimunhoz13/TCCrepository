const {
  img, figura, h1, h2, h3, p, bullet, celula, AZUL, DOURADO, CINZA, DIAG, ORIG,
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ImageRun, Header, Footer, PageNumber, ShadingType, VerticalAlign, HeadingLevel, PageBreak,
} = require("./build_rt.js");
const { TabStopType } = require("docx");

// Largura útil da página A4 com as margens de main.js (11906 − 1701 − 1134).
const LARGURA_UTIL = 9071;

// Numeração automática das figuras, na ordem em que aparecem no documento.
let numeroFigura = 0;
function fig(caminho, largura, altura, legenda, max) {
  numeroFigura += 1;
  return figura(caminho, largura, altura, `Figura ${numeroFigura} – ${legenda.replace(/^Figura \d+ – /, "")}`, max);
}

// ============================================================
// CAPA
// ============================================================
const capa = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [img(`${ORIG}/image2.png`, 1917, 1990, 140)] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
    children: [img(`${ORIG}/image1.png`, 2560, 248, 440)] }),
  new Paragraph({ text: "", spacing: { after: 600 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new TextRun({ text: "João Henrique Souza Sabino", size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 500 },
    children: [new TextRun({ text: "Guilherme Munhoz", size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({ text: "Sistema Web para Gerenciamento de Escritório de Advocacia", bold: true, size: 30 })] }),
  new Paragraph({ text: "", spacing: { after: 400 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({ text: "Relatório técnico apresentado como requisito parcial para obtenção de aprovação na disciplina de Projeto Final de Curso, no Curso de Tecnologia em Desenvolvimento de Sistemas, no Centro Universitário Católico Salesiano Auxilium.", size: 21 })] }),
  new Paragraph({ text: "", spacing: { after: 400 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({ text: "Orientador: Sergio Luis Tosin", size: 21 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: "Coorientador: Francisco Antônio", size: 21 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Araçatuba, 2026", size: 21 })] }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ============================================================
// RESUMO (formatação corrigida — bloco único, justificado, com
// rótulo de Palavras-chave destacado)
// ============================================================
const resumo = [
  h1("RESUMO"),
  p("O presente trabalho apresenta o desenvolvimento de uma aplicação web para o gerenciamento de escritórios de advocacia, com isolamento completo de dados entre escritórios (arquitetura multi-tenant). O sistema centraliza clientes, processos, prazos e compromissos, tarefas, contratos e honorários, horas e despesas, relatórios e a comunicação com o cliente por e-mail e WhatsApp, além de um assistente de inteligência artificial que responde com base apenas nos dados do próprio escritório. Na etapa mais recente, o acesso passou a ser controlado por perfis (administrador, advogado, estagiário, financeiro e secretária), processos em segredo de justiça ficaram restritos ao administrador e ao advogado responsável, o login ganhou verificação em duas etapas e foram implementados os direitos do titular previstos na Lei Geral de Proteção de Dados (consentimento, portabilidade e anonimização). O sistema passou a importar as intimações publicadas no Diário de Justiça Eletrônico Nacional (DJEN), calculando o prazo em dias úteis forenses — inclusive com os feriados locais e as suspensões de expediente cadastrados pelo escritório — e lançando-o na agenda; a gerar cobranças por PIX para cada parcela de honorários; a redigir, com apoio da IA, atualizações do andamento em linguagem simples para o cliente; a enviar notificações push ao celular; a exportar a agenda para aplicativos de calendário; e a preencher os dados de uma empresa a partir do CNPJ, consultando o cadastro público da Receita Federal. O funcionamento é verificado por testes automatizados em três níveis — API, componentes de interface e ponta a ponta, este último com checagem de acessibilidade —, previstos no fluxo de integração contínua e também executados localmente, e a API é documentada no padrão OpenAPI. A auditoria final aprovou 841 casos automatizados e classificou o escopo local como apto com ressalvas, incluindo a cobertura insuficiente de testes de componentes do frontend e verificações operacionais ainda pendentes. O uso é gratuito para começar: todo escritório novo entra no plano Gratuito, sem pagamento, e os planos pagos (Básico e Profissional) ampliam os limites de usuários e processos e incluem as automações e a inteligência artificial. Ao longo do desenvolvimento, o backend foi migrado de Node.js para Python com Django e o banco de dados de MySQL para PostgreSQL (Supabase); a automação de notificações via n8n, prevista originalmente, foi adiada."),
  new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({ text: "Palavras-chave: ", bold: true, size: 22 }),
      new TextRun({ text: "advocacia; sistema web; gestão de processos; multi-tenant; LGPD; intimações eletrônicas; Django.", size: 22 }),
    ],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ============================================================
// SUMÁRIO (manual, preciso — substitui o TOC quebrado do original)
// ============================================================
function itemSumario(texto, pagina, nivel = 1) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: nivel === 2 ? 360 : 0 },
    tabStops: [{ type: TabStopType.RIGHT, position: LARGURA_UTIL, leader: "dot" }],
    children: [
      new TextRun({ text: texto, size: 22 }),
      new TextRun({ text: `\t${pagina}`, size: 22 }),
    ],
  });
}
// Páginas do sumário: lidas do PDF renderizado (ver paginar.py) e gravadas
// em paginas.json; sem o arquivo, saem como "?" na primeira passada.
let PAGINAS = {};
try { PAGINAS = require("./paginas.json"); } catch { PAGINAS = {}; }
const TITULOS_SUMARIO = [
  ["1. Introdução", 1],
  ["1.1. Contexto e Problema", 2],
  ["1.2. Descrição da Solução", 2],
  ["1.3. Objetivos", 2],
  ["1.4. Escopo do Sistema", 2],
  ["1.5. Público-Alvo", 2],
  ["1.6. Metodologia de Desenvolvimento", 2],
  ["2. Modelagem de Negócio", 1],
  ["2.1. Business Model Canvas", 2],
  ["2.2. Product Backlog Priorizado", 2],
  ["3. Requisitos e Regras de Negócio", 1],
  ["3.1. Requisitos Funcionais", 2],
  ["3.2. Requisitos Não Funcionais", 2],
  ["3.3. Regras de Negócio", 2],
  ["4. Modelagem de Sistemas", 1],
  ["4.1. Diagrama de Casos de Uso", 2],
  ["4.2. Especificação dos Casos de Uso", 2],
  ["4.3. Diagrama de Classes", 2],
  ["4.4. Diagramas de Sequência", 2],
  ["5. Modelagem de Dados", 1],
  ["6. Protótipos das Funcionalidades Principais", 1],
  ["6.1. Tela de Login", 2],
  ["6.2. Painel do Escritório (Dashboard)", 2],
  ["6.3. Contratos e Honorários", 2],
  ["6.4. Painel Mestre (Administrador do Sistema)", 2],
  ["6.5. Registro de Auditoria", 2],
  ["6.6. Cálculo de Prazo em Dias Úteis", 2],
  ["6.7. Horas Trabalhadas e Despesas Processuais", 2],
  ["6.8. Consulta Processual no DataJud", 2],
  ["6.9. Modelos de Documento", 2],
  ["6.10. Indicadores Financeiros do Escritório", 2],
  ["6.11. Tarefas do Escritório", 2],
  ["6.12. Busca Global", 2],
  ["6.13. Central de Ajuda", 2],
  ["6.14. Perfis de Acesso e Equipe", 2],
  ["6.15. Processo em Segredo de Justiça", 2],
  ["6.16. Verificação em Duas Etapas", 2],
  ["6.17. Direitos do Titular (LGPD)", 2],
  ["6.18. Intimações do DJEN", 2],
  ["6.19. Cobrança por PIX", 2],
  ["6.20. Atualização do Cliente", 2],
  ["6.21. Quadro de Tarefas", 2],
  ["6.22. Agenda no Calendário do Celular", 2],
  ["6.23. Notificações no Celular e no Navegador", 2],
  ["6.24. Documentação da API", 2],
  ["6.25. Testes de Ponta a Ponta", 2],
  ["6.26. Planos de Assinatura", 2],
  ["6.27. Feriados Locais no Cálculo de Prazos", 2],
  ["6.28. Preenchimento pelo CNPJ", 2],
  ["6.29. Cadastro por Etapas e Conferência de Prazos", 2],
  ["7. Arquitetura do Sistema", 1],
  ["7.1. Diagrama de Contexto (C4 — Nível 1)", 2],
  ["7.2. Diagrama de Containers (C4 — Nível 2)", 2],
  ["7.3. Diagrama de Componentes", 2],
  ["7.4. Integração Contínua e Qualidade", 2],
  ["7.5. Resultados da Auditoria Técnica", 2],
  ["7.6. Testes Práticos na Aplicação Publicada", 2],
  ["7.7. Avaliação e Limitações", 2],
  ["8. Trabalhos Futuros", 1],
  ["9. Conclusão", 1],
  ["10. Referências Bibliográficas", 1],
];
const sumario = [
  h1("SUMÁRIO"),
  ...TITULOS_SUMARIO.map(([titulo, nivel]) =>
    itemSumario(titulo, PAGINAS[titulo] ?? "?", nivel)
  ),
  new Paragraph({ children: [new PageBreak()] }),
];

// ============================================================
// 1. INTRODUÇÃO
// ============================================================
const introducao = [
  h1("1. Introdução"),

  h2("1.1. Contexto e Problema"),
  p("Advogados e escritórios de advocacia enfrentam dificuldades na organização de informações relacionadas a processos, clientes, prazos e contratos. Grande parte dessas informações ainda é controlada manualmente ou em planilhas e sistemas pouco integrados, o que gera perda de dados, atrasos no cumprimento de prazos processuais e falhas na comunicação com o cliente."),
  p("Diante disso, propõe-se o desenvolvimento de uma aplicação web que centralize essas informações, isolando os dados de cada escritório (arquitetura multi-tenant), facilitando o acesso remoto e a gestão do dia a dia do escritório."),

  h2("1.2. Descrição da Solução"),
  p("A solução é uma aplicação web (LexNexo) que permite a um escritório de advocacia cadastrar seus advogados, clientes e processos, controlar prazos e compromissos em uma agenda, registrar contratos e honorários com controle de pagamento, gerar relatórios e contatar clientes por e-mail ou WhatsApp. Um assistente de inteligência artificial auxilia o usuário com respostas baseadas exclusivamente nos dados do próprio escritório. A plataforma é multi-tenant: múltiplos escritórios utilizam o mesmo sistema, com seus dados completamente isolados uns dos outros, e um painel administrativo separado permite ao desenvolvedor da plataforma gerenciar os escritórios cadastrados. O modelo de negócio é freemium: qualquer escritório pode criar a conta e usar o sistema sem pagar, no plano Gratuito, e contratar um plano pago quando precisar de mais usuários, mais processos ou dos recursos avançados."),

  h2("1.3. Objetivos"),
  h3("1.3.1. Objetivo Geral"),
  p("Desenvolver uma aplicação web para auxiliar no gerenciamento de escritórios de advocacia, permitindo o controle de usuários, clientes, processos, prazos, contratos e honorários."),
  h3("1.3.2. Objetivos Específicos"),
  bullet("Implementar cadastro e login de usuários, com bloqueio de acesso após tentativas inválidas;"),
  bullet("Permitir o cadastro e a gestão de clientes e processos;"),
  bullet("Controlar prazos processuais e compromissos de agenda, sinalizando itens em atraso;"),
  bullet("Controlar contratos e honorários, com geração automática de parcelas e registro de pagamento;"),
  bullet("Gerar relatórios de clientes e processos, exportáveis em PDF e por e-mail;"),
  bullet("Fornecer um assistente de inteligência artificial para consultas contextuais;"),
  bullet("Prover um painel administrativo, restrito ao desenvolvedor, para gerenciar os escritórios da plataforma;"),
  bullet("Controlar o acesso por perfil (administrador, advogado, estagiário, financeiro e secretária) e restringir os processos em segredo de justiça;"),
  bullet("Reforçar a autenticação com verificação em duas etapas e atender aos direitos do titular de dados previstos na LGPD;"),
  bullet("Importar as intimações do Diário de Justiça Eletrônico Nacional e lançar automaticamente os prazos na agenda;"),
  bullet("Facilitar a cobrança de honorários por PIX e a comunicação do andamento ao cliente em linguagem simples;"),
  bullet("Oferecer o sistema gratuitamente no plano inicial, com planos pagos que ampliam limites e recursos, aplicados pela própria API;"),
  bullet("Comprovar o funcionamento com testes automatizados de API, de componentes e de ponta a ponta, executados em integração contínua, e documentar a API no padrão OpenAPI."),

  h2("1.4. Escopo do Sistema"),
  p("O sistema permite o cadastro e login da equipe do escritório, com perfis de acesso distintos; o cadastro e a gestão de clientes e processos, incluindo processos em segredo de justiça; o controle de agenda (compromissos e prazos, com cálculo em dias úteis que considera os feriados nacionais e os feriados locais cadastrados pelo escritório), de tarefas e de horas e despesas; o controle de contratos e honorários com parcelamento e cobrança por PIX; a importação de andamentos (DataJud) e de intimações (DJEN); a geração e o envio de relatórios; o preenchimento dos dados de empresas pelo CNPJ, a partir do cadastro público da Receita Federal; um assistente de inteligência artificial; notificações por e-mail e push; planos de assinatura (Gratuito, Básico e Profissional) com limites e recursos por plano; e um painel administrativo restrito ao desenvolvedor da plataforma para gerenciar os escritórios cadastrados."),
  p("O sistema consulta fontes públicas do Judiciário (a API do DataJud e a consulta de comunicações do DJEN), mas não peticiona nem acessa o PJe com certificado digital; não realiza assinatura digital de documentos; não é um aplicativo nativo, mas pode ser instalado no celular e no computador como aplicativo web (PWA); e não oferece login ao cliente final — o cliente é cadastrado e acompanhado pelos usuários do escritório e recebe as comunicações por WhatsApp ou e-mail. A notificação automática ao cliente a cada atualização de processo, prevista originalmente via n8n, foi adiada — ver seção 8, Trabalhos Futuros."),

  h2("1.5. Público-Alvo"),
  bullet("Administrador do escritório (dono/gestor), com acesso a tudo, inclusive equipe, auditoria e dados do escritório;"),
  bullet("Advogado (um usuário por advogado do escritório, com registro na OAB);"),
  bullet("Estagiário, que apoia nos processos e na agenda, sem excluir registros nem ver o financeiro;"),
  bullet("Financeiro, que cuida de contratos, cobranças e despesas e apenas consulta o restante;"),
  bullet("Secretária, responsável pelo atendimento, pelo cadastro de clientes e pela agenda, sem acesso ao financeiro nem à IA;"),
  bullet("Administrador do Sistema — o desenvolvedor da plataforma, com acesso a um painel próprio para gerenciar os escritórios cadastrados (ativar, inativar, definir plano), sem acesso aos dados de clientes ou processos de nenhum escritório."),

  h2("1.6. Metodologia de Desenvolvimento"),
  p("O projeto foi desenvolvido de forma incremental, com uma adaptação do método Scrum, organizando as tarefas em pequenas entregas ao longo do semestre. Parte da validação de regras de negócio (como a exigência de senha forte) foi conduzida seguindo o ciclo de Test-Driven Development (TDD): primeiro a escrita de um teste que falha (red), em seguida a implementação mínima que o faz passar (green), documentado em relatório específico do projeto."),
  p("A verificação combina testes da API em Django sobre PostgreSQL exclusivo, testes de componentes em Jest e Testing Library, análise estática, build de produção, validação OpenAPI e fluxos de ponta a ponta em Playwright, incluindo regras automáticas de acessibilidade. O GitHub Actions está configurado para essas etapas. A auditoria de 27/10/2026 executou localmente 532 testes Django, 275 Jest e 34 Playwright, após correções e retestes. A execução remota do CI não foi comprovada nesta rodada; os resultados locais identificam a base de código e as alterações ainda não commitadas, conforme a seção 7."),
];

// ============================================================
// 2. MODELAGEM DE NEGÓCIO
// ============================================================
function bmcCell(titulo, itens, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 1870, type: WidthType.DXA },
    columnSpan: opts.columnSpan,
    shading: { type: ShadingType.CLEAR, fill: "FDF6E3" },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [
      new Paragraph({ spacing: { after: 60 },
        children: [new TextRun({ text: titulo, bold: true, size: 18, color: DOURADO })] }),
      ...itens.map((i) => new Paragraph({
        spacing: { after: 40 }, bullet: { level: 0 },
        children: [new TextRun({ text: i, size: 18 })],
      })),
    ],
  });
}

const bmcTable = new Table({
  width: { size: 9350, type: WidthType.DXA },
  columnWidths: [1870, 1870, 1870, 1870, 1870],
  rows: [
    new TableRow({ children: [
      bmcCell("Parcerias-chave", ["Supabase (infraestrutura de banco de dados)", "OpenAI (assistente de IA)", "Provedor de e-mail (SMTP)"]),
      bmcCell("Atividades e Recursos-chave", ["Desenvolvimento e manutenção da plataforma", "Suporte aos escritórios cadastrados", "Equipe de desenvolvimento (dupla) e código-fonte"]),
      bmcCell("Proposta de Valor", ["Centralizar clientes, processos, prazos, contratos e comunicação de um escritório de advocacia em um único sistema, com IA e gestão multi-escritório"]),
      bmcCell("Relacionamento e Canais", ["Suporte direto do desenvolvedor via painel mestre", "Autoatendimento: cadastro gratuito pela página inicial", "Aplicação web responsiva, com acesso remoto"]),
      bmcCell("Segmentos de Clientes", ["Escritórios de advocacia de pequeno e médio porte"]),
    ] }),
    new TableRow({ children: [
      bmcCell("Estrutura de Custos", ["Hospedagem do banco de dados (Supabase)", "Uso da API da OpenAI", "Manutenção e evolução do sistema"], { width: 5610, columnSpan: 3 }),
      bmcCell("Fontes de Receita", ["Modelo freemium: plano Gratuito sem custo", "Assinaturas mensais: Básico (R$ 79) e Profissional (R$ 199)"], { width: 3740, columnSpan: 2 }),
    ] }),
  ],
});

const backlogHeaders = ["ID", "Requisito", "Prioridade", "Estim. (h)", "Status"];
const backlogWidths = [700, 4200, 1300, 1300, 1550];
const backlogRows = [
  ["RF01", "Cadastro e login de usuário, com bloqueio após tentativas inválidas", "Alta", "5", "Concluído"],
  ["RF02", "Validação de formulários (e-mail, CPF/CNPJ, telefone, OAB, senha forte)", "Alta", "6", "Concluído"],
  ["RF03", "Cadastro, edição, inativação e exclusão de clientes", "Alta", "—", "Concluído"],
  ["RF04", "Cadastro, edição e acompanhamento de processos", "Alta", "15", "Concluído"],
  ["RF05", "Registro de movimentações do processo", "Alta", "—", "Concluído"],
  ["RF06", "Upload e organização de documentos do processo", "Média", "6", "Concluído"],
  ["RF07", "Controle de prazos e compromissos (agenda)", "Alta", "8", "Concluído"],
  ["RF08", "Contratos e honorários, com geração de parcelas", "Alta", "12", "Concluído"],
  ["RF09", "Registro de pagamento de parcelas", "Alta", "—", "Concluído"],
  ["RF10", "Geração de relatórios (PDF e e-mail)", "Média", "4", "Concluído"],
  ["RF11", "Envio de contato ao cliente via WhatsApp", "Baixa", "3", "Concluído"],
  ["RF12", "Filtro e busca de clientes e processos", "Média", "6", "Concluído"],
  ["RF13", "Listagem de processos ativos e finalizados", "Alta", "—", "Concluído"],
  ["RF14", "Permissões por tipo de usuário", "Alta", "3", "Concluído"],
  ["RF15", "Cadastro e gerenciamento de advogados", "Alta", "—", "Concluído"],
  ["RF16", "Assistente de inteligência artificial contextual", "Média", "10", "Concluído"],
  ["RF17", "Painel administrativo da plataforma", "Alta", "14", "Concluído"],
  ["RF18", "Registro de auditoria (login e criação/edição/exclusão de dados)", "Alta", "10", "Concluído"],
  ["RF19", "Redefinição de senha por e-mail (\"esqueci minha senha\")", "Alta", "6", "Concluído"],
  ["RF20", "Confirmação de e-mail no auto-cadastro do escritório (produção)", "Média", "5", "Concluído"],
  ["RF21", "Revogação de sessão ao sair do sistema (logout)", "Alta", "6", "Concluído"],
  ["RF22", "Cálculo automático de prazo processual em dias úteis", "Alta", "8", "Concluído"],
  ["RF23", "Registro de dados jurídicos do processo (área, vara, comarca, valor da causa, parte contrária)", "Média", "6", "Concluído"],
  ["RF24", "Estimativa de honorários de sucumbência", "Baixa", "3", "Concluído"],
  ["RF25", "Envio automático de lembretes de prazo/compromisso e resumo semanal por e-mail", "Alta", "8", "Concluído"],
  ["RF26", "Apontamento de horas trabalhadas por processo (timesheet)", "Alta", "8", "Concluído"],
  ["RF27", "Lançamento de custas e despesas processuais reembolsáveis", "Média", "5", "Concluído"],
  ["RF28", "Medição do tempo de uso do sistema por usuário", "Baixa", "5", "Concluído"],
  ["RF29", "Consulta processual automática na API pública do DataJud (CNJ)", "Alta", "13", "Concluído"],
  ["RF30", "Modelos de documento preenchidos com os dados cadastrados", "Alta", "8", "Concluído"],
  ["RF31", "Sincronização periódica e automática dos processos com o DataJud", "Alta", "8", "Concluído"],
  ["RF32", "Relatórios de cliente e de processo com contratos, horas e despesas", "Alta", "5", "Concluído"],
  ["RF33", "Indicadores financeiros do escritório no painel inicial", "Alta", "5", "Concluído"],
  ["RF34", "Tarefas com responsável, prioridade, prazo e acompanhamento", "Alta", "13", "Concluído"],
  ["RF35", "Instalação do sistema como aplicativo (PWA), com tela de indisponibilidade", "Média", "5", "Concluído"],
  ["RF36", "Central de ajuda contextual, acessível de qualquer tela", "Média", "5", "Concluído"],
  ["RF37", "Busca global sobre todas as áreas do sistema", "Média", "5", "Concluído"],
  ["RF38", "Perfis de acesso (administrador, advogado, estagiário, financeiro, secretária)", "Alta", "13", "Concluído"],
  ["RF39", "Cadastro de membros da equipe e troca de perfil pelo administrador", "Média", "4", "Concluído"],
  ["RF40", "Processo em segredo de justiça", "Alta", "8", "Concluído"],
  ["RF41", "Verificação em duas etapas no login (TOTP)", "Alta", "8", "Concluído"],
  ["RF42", "Direitos do titular (LGPD): consentimento, exportação e anonimização", "Alta", "6", "Concluído"],
  ["RF43", "Agenda em iCalendar (.ics) e assinatura em aplicativos de agenda", "Média", "5", "Concluído"],
  ["RF44", "Quadro Kanban de tarefas", "Média", "5", "Concluído"],
  ["RF45", "Cobrança de parcela por PIX (QR code e copia e cola)", "Alta", "6", "Concluído"],
  ["RF46", "Atualização do andamento para o cliente em linguagem simples (IA)", "Média", "5", "Concluído"],
  ["RF47", "Importação de intimações do DJEN com prazo lançado na agenda", "Alta", "13", "Concluído"],
  ["RF48", "Notificações push no celular e no navegador", "Média", "8", "Concluído"],
  ["RF49", "Planos de assinatura (Gratuito, Básico e Profissional) com limites e recursos", "Alta", "10", "Concluído"],
  ["RF50", "Feriados locais e suspensões de expediente no cálculo de prazos", "Alta", "8", "Concluído"],
  ["RF51", "Preenchimento dos dados da empresa pelo CNPJ (BrasilAPI)", "Média", "3", "Concluído"],
  ["RF52", "Notificação automática ao cliente a cada atualização", "Alta", "15", "Adiado"],
  ["RF53", "Conferência rastreável de prazos importados do DJEN", "Alta", "—", "Concluído"],
];

const backlogTable = new Table({
  width: { size: 9050, type: WidthType.DXA },
  columnWidths: backlogWidths,
  rows: [
    new TableRow({ children: backlogHeaders.map((t, i) => celula(t, { bold: true, shading: "1F3864", color: "FFFFFF", center: true, width: backlogWidths[i] })) }),
    ...backlogRows.map((row) => new TableRow({ children: row.map((t, i) => celula(t, { width: backlogWidths[i], center: i !== 1 })) })),
  ],
});

const modelagemNegocio = [
  h1("2. Modelagem de Negócio"),

  h2("2.1. Business Model Canvas"),
  p("O quadro a seguir apresenta o modelo de negócio da plataforma, considerando sua viabilidade como um produto oferecido a múltiplos escritórios de advocacia (modelo multi-tenant, com planos de assinatura)."),
  bmcTable,
  new Paragraph({ text: "", spacing: { after: 240 } }),

  h2("2.2. Product Backlog Priorizado"),
  p("O backlog abaixo utiliza os mesmos identificadores da especificação da seção 3. As horas são estimativas históricas de planejamento, não medições de esforço; o traço indica ausência de estimativa registrada. A notificação automática ao cliente foi identificada como RF52 e permanece adiada, conforme a seção 8. RF05 designa exclusivamente o registro de movimentações em todas as seções."),
  backlogTable,
  new Paragraph({ text: "", spacing: { after: 200 } }),
];

// ============================================================
// 3. REQUISITOS E REGRAS DE NEGÓCIO
// ============================================================
const requisitos = [
  h1("3. Requisitos e Regras de Negócio"),

  h2("3.1. Requisitos Funcionais"),
  bullet("RF01 – Cadastro e login de usuário (administrador e advogado), com bloqueio de acesso após 3 tentativas de senha inválidas;"),
  bullet("RF02 – Validação de formulários (e-mail com checagem real de domínio, CPF/CNPJ, telefone, OAB, senha forte);"),
  bullet("RF03 – Cadastro, edição, inativação e exclusão de clientes;"),
  bullet("RF04 – Cadastro, edição e acompanhamento de processos, vinculados a um cliente e a um advogado;"),
  bullet("RF05 – Registro de movimentações (andamentos) do processo;"),
  bullet("RF06 – Upload e organização de documentos vinculados ao processo;"),
  bullet("RF07 – Agenda com compromissos e prazos, com indicação de itens em atraso e marcação de cumprimento;"),
  bullet("RF08 – Cadastro de contratos e honorários, com geração automática de parcelas (à vista ou parcelado);"),
  bullet("RF09 – Registro de pagamento de parcelas de contrato;"),
  bullet("RF10 – Geração de relatórios de cliente e de processo, exportáveis em PDF e por e-mail;"),
  bullet("RF11 – Envio de contato ao cliente via WhatsApp;"),
  bullet("RF12 – Filtro e busca de clientes e processos (por nome, status, cliente, advogado e período);"),
  bullet("RF13 – Listagem de processos ativos e finalizados;"),
  bullet("RF14 – Sistema de permissões por tipo de usuário (administrador / advogado);"),
  bullet("RF15 – Cadastro e gerenciamento de advogados pelo administrador do escritório;"),
  bullet("RF16 – Assistente de inteligência artificial para consultas contextuais sobre os dados do escritório;"),
  bullet("RF17 – Painel administrativo do desenvolvedor (painel mestre) para gerenciar os escritórios da plataforma (ativar, inativar, definir plano);"),
  bullet("RF18 – Registro de auditoria de login (sucesso, falha e bloqueio) e de toda criação, edição ou exclusão de dados, consultável pelo administrador do escritório e pelo desenvolvedor da plataforma;"),
  bullet("RF19 – Redefinição de senha por e-mail (\"esqueci minha senha\"), com link de recuperação válido por 1 hora;"),
  bullet("RF20 – Confirmação de e-mail do administrador no auto-cadastro de um novo escritório, exigida apenas em produção;"),
  bullet("RF21 – Revogação da sessão do usuário ao encerrar o login (logout), invalidando o token de acesso no servidor;"),
  bullet("RF22 – Cálculo automático da data final de um prazo processual, em dias úteis (pulando fins de semana, feriados nacionais e, desde o RF50, os feriados locais aplicáveis e a suspensão do recesso forense) ou em dias corridos;"),
  bullet("RF23 – Registro de dados jurídicos complementares do processo: área do direito, vara, comarca, valor da causa, parte contrária e advogado adverso;"),
  bullet("RF24 – Estimativa automática do valor de honorários de sucumbência, a partir do valor da causa e do percentual fixado pelo juízo;"),
  bullet("RF25 – Envio automático, por e-mail, de lembretes dos compromissos e prazos que se aproximam e de um resumo semanal da agenda, dos processos abertos e das parcelas a vencer, conforme as preferências de cada usuário;"),
  bullet("RF26 – Apontamento das horas trabalhadas em cada processo, com indicação do responsável, do que foi feito, do valor por hora e se a hora é faturável ao cliente;"),
  bullet("RF27 – Lançamento das custas e despesas processuais, com distinção entre o que é reembolsável pelo cliente e o que já foi reembolsado;"),
  bullet("RF28 – Medição do tempo de uso do sistema por usuário, consolidada por mês, visível integralmente ao administrador e restrita ao próprio tempo para os demais;"),
  bullet("RF29 – Consulta automática do andamento processual na API pública do DataJud (CNJ), com importação das movimentações ainda não registradas;"),
  bullet("RF30 – Cadastro de modelos de documento (procuração, contrato, declaração, petição) com variáveis preenchidas automaticamente a partir dos dados do cliente, do processo e do escritório."),
  bullet("RF31 – Sincronização periódica e automática dos processos em andamento e suspensos com o DataJud, com aviso por e-mail aos usuários quando um andamento novo é encontrado;"),
  bullet("RF32 – Inclusão, nos relatórios de cliente e de processo, dos contratos, das horas trabalhadas, das despesas lançadas e de um resumo financeiro consolidado;"),
  bullet("RF33 – Apresentação, no painel inicial, dos indicadores financeiros do escritório: valor a receber, recebido no mês corrente, valor e quantidade de parcelas vencidas, horas faturáveis apontadas no mês e despesas a reembolsar;"),
  bullet("RF34 – Cadastro e acompanhamento de tarefas internas do escritório, com responsável, prioridade, prazo opcional, vínculo opcional a um processo e aviso por e-mail a quem a recebe;"),
  bullet("RF35 – Instalação do sistema como aplicativo no computador ou no celular (Progressive Web App), com tela própria de indisponibilidade quando não há conexão;"),
  bullet("RF36 – Central de ajuda acessível de qualquer tela, que abre no assunto correspondente à área em uso e permite buscar por assunto ou por detalhe;"),
  bullet("RF37 – Busca global única sobre clientes, processos, tarefas, eventos de agenda, documentos, contratos, horas apontadas e modelos de documento;"),
  bullet("RF38 – Perfis de acesso — administrador, advogado, estagiário, financeiro e secretária —, com permissões por área (clientes, processos, agenda, documentos, tarefas, horas, despesas, financeiro, modelos, advogados, relatórios, exportação e IA) e por ação (ver, criar, editar e excluir), aplicadas pela API e refletidas na interface;"),
  bullet("RF39 – Cadastro, pelo administrador, de membros da equipe que não são advogados (estagiário, financeiro, secretária ou outro administrador) e troca do perfil de acesso de quem já pertence ao escritório;"),
  bullet("RF40 – Marcação de um processo como segredo de justiça, que o torna visível apenas ao administrador e ao advogado responsável, junto com tudo o que dele depende;"),
  bullet("RF41 – Verificação em duas etapas opcional por usuário, com cadastro no aplicativo autenticador por QR code, desativação mediante senha e código, e redefinição pelo administrador para quem perdeu o celular;"),
  bullet("RF42 – Registro do consentimento do cliente para o tratamento dos dados pessoais, exportação dos dados do titular em formato estruturado e anonimização do cadastro;"),
  bullet("RF43 – Exportação da agenda no formato iCalendar (.ics) e geração de um link privado de assinatura, pelo qual Google Agenda, Outlook ou o calendário do iPhone mantêm os prazos e compromissos atualizados;"),
  bullet("RF44 – Quadro Kanban das tarefas (a fazer, fazendo e concluídas), com mudança de situação por arrastar ou por botões acessíveis pelo teclado e no celular;"),
  bullet("RF45 – Cobrança de cada parcela de contrato por PIX, com QR code e código copia e cola contendo o valor da parcela, e envio ao cliente pelo WhatsApp;"),
  bullet("RF46 – Geração de uma mensagem de atualização do andamento do processo em linguagem simples, redigida pela IA ou, na sua ausência, por modelo automático, revisada pelo advogado e enviada ao cliente pelo WhatsApp;"),
  bullet("RF47 – Importação das intimações publicadas no Diário de Justiça Eletrônico Nacional (DJEN) pela OAB de cada advogado, com vínculo ao processo cadastrado, cálculo do prazo e lançamento na agenda;"),
  bullet("RF48 – Notificações push no celular e no navegador para intimação nova, tarefa atribuída e lembretes de prazo e audiência, mesmo com o sistema fechado;"),
  bullet("RF49 – Planos de assinatura: o escritório começa no plano Gratuito, sem pagamento, e pode passar aos planos Básico e Profissional, que ampliam o número de usuários e de processos ativos e incluem as intimações do DJEN, a sincronização automática do DataJud e a IA; a tela de planos mostra o plano atual e o uso de cada limite, e a página inicial apresenta os planos antes do cadastro;"),
  bullet("RF50 – Cadastro de feriados locais (municipais e estaduais) e de suspensões de expediente do tribunal, únicos ou repetidos todo ano, considerados no cálculo de prazos da agenda e das intimações do DJEN, com a indicação dos feriados que alteraram a contagem;"),
  bullet("RF51 – Preenchimento automático dos dados da empresa a partir do CNPJ, no cadastro de cliente pessoa jurídica (razão social, e-mail, telefone, CEP e endereço) e no cadastro do escritório (nome, telefone, e-mail, endereço, cidade, UF e CEP), com base no cadastro público da Receita Federal disponibilizado pelo BrasilAPI."),
  bullet("RF52 – Notificação automática ao cliente a cada atualização de processo: planejada e adiada; atualmente a mensagem depende de revisão e acionamento do usuário."),
  bullet("RF53 – Conferência de prazo importado do DJEN por advogado ou administrador, registrando vencimento, justificativa, autor e data, com atualização da agenda e nova conferência exigida após alteração manual da data."),

  h2("3.2. Requisitos Não Funcionais"),
  bullet("RNF01 – O sistema deve funcionar nos principais navegadores modernos;"),
  bullet("RNF02 – O sistema deve possuir interface responsiva (desktop e dispositivos móveis);"),
  bullet("RNF03 – O sistema deve possuir autenticação segura de usuários, via token JWT;"),
  bullet("RNF04 – O sistema deve isolar completamente os dados entre escritórios (multi-tenant);"),
  bullet("RNF05 – O sistema deve oferecer suporte a modo claro e escuro;"),
  bullet("RNF06 – O sistema deve oferecer suporte a múltiplos idiomas (português, inglês e espanhol);"),
  bullet("RNF07 – O sistema deve limitar a taxa de requisições (rate limiting) em endpoints sensíveis a abuso, como login, cadastro e redefinição de senha;"),
  bullet("RNF08 – As listagens da API devem ser paginadas, para que o tempo de resposta não cresça de forma ilimitada com o volume de dados de um escritório;"),
  bullet("RNF09 – A sessão de um usuário deve poder ser encerrada de forma efetiva no servidor (não apenas apagando o token no navegador), reduzindo o risco de uso indevido de um token copiado;"),
  bullet("RNF10 – O conteúdo de um modelo de documento, escrito pelo próprio usuário, deve ser tratado como dado e nunca interpretado como código: o preenchimento resolve apenas variáveis de um catálogo fechado, de modo que não seja possível, a partir de um modelo, alcançar dados não previstos;"),
  bullet("RNF11 – A integração com serviços externos não deve derrubar a operação: indisponibilidade de rede, credencial ausente ou resposta em formato inesperado devem resultar em mensagem específica ao usuário, e não em erro genérico."),
  bullet("RNF12 – Nenhum dado de processo, cliente ou financeiro pode ser armazenado no dispositivo do usuário pelo mecanismo de funcionamento offline: sendo o sistema multi-escritório e autenticado por token, um armazenamento local de respostas da API exibiria dados de um escritório a quem usasse o mesmo aparelho em seguida, e apresentaria informação desatualizada como se fosse o estado atual;"),
  bullet("RNF13 – As cores utilizadas para distinguir categorias em gráficos devem ser legíveis também por usuários com deficiência na percepção de cores, verificando-se a separação entre cores vizinhas sob protanopia, deuteranopia e tritanopia, além do contraste em relação ao fundo de cada tema;"),
  bullet("RNF14 – Um mesmo conceito deve receber a mesma cor em toda a interface: o estado de um processo apresentado em uma tabela e no gráfico do painel não pode ser representado por cores distintas;"),
  bullet("RNF15 – As permissões de acesso devem ser verificadas no servidor, a cada requisição; a interface apenas deixa de exibir o que a API recusaria, de modo que esconder um botão nunca seja a única proteção;"),
  bullet("RNF16 – O contexto da IA deve minimizar dados pessoais: omitir CPF/CNPJ, endereço, e-mail e telefone dos campos estruturados, abreviar nomes e mascarar identificadores reconhecidos nos textos. A minimização automática não garante a remoção de todo dado pessoal em texto livre; o usuário deve revisar o conteúdo enviado e gerado;"),
  bullet("RNF17 – As notificações push devem ser cifradas de ponta a ponta para o aparelho de destino (RFC 8291) e assinadas pelo servidor (VAPID, RFC 8292); sem as chaves configuradas, o recurso fica desligado sem afetar o restante do sistema;"),
  bullet("RNF18 – A API deve ser documentada no padrão OpenAPI 3, com o esquema gerado a partir do próprio código e validado automaticamente, de modo que a documentação não se desatualize em relação às rotas;"),
  bullet("RNF19 – Cada alteração deve passar, em integração contínua, por testes automatizados em três níveis — API, componentes de interface e ponta a ponta — e por uma checagem automática de acessibilidade WCAG 2 AA das telas principais;"),
  bullet("RNF20 – O código do backend deve ser organizado por domínio (um módulo de views e um de testes por assunto), para que uma alteração em uma área não exija percorrer arquivos de milhares de linhas;"),
  bullet("RNF21 – Consultas a serviços públicos externos feitas pelo navegador, como o BrasilAPI e o ViaCEP, devem estar autorizadas na política de segurança de conteúdo (CSP) e nunca condicionar a operação: a indisponibilidade do serviço apenas deixa de preencher os campos, sem impedir o cadastro."),

  h2("3.3. Regras de Negócio"),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN01 – Cadastro e Login de Usuário", bold: true, size: 22 })] }),
  p("O sistema deve permitir o cadastro de usuários e autenticação por e-mail e senha, bloqueando o acesso por 15 minutos após 3 tentativas de senha inválidas consecutivas."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN02 – Responsividade do Sistema", bold: true, size: 22 })] }),
  p("O sistema deve se adaptar automaticamente a diferentes tamanhos de tela, garantindo uso adequado em dispositivos móveis e desktops."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN03 – Validação de Formulários", bold: true, size: 22 })] }),
  p("Todos os campos obrigatórios devem ser preenchidos corretamente antes do envio, incluindo validação real de e-mail, quantidade de dígitos de CPF/CNPJ/telefone/OAB e senha forte (mínimo de 8 caracteres, com maiúscula, número e caractere especial)."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN04 – Controle de Prazos e Compromissos", bold: true, size: 22 })] }),
  p("O sistema deve permitir o cadastro de eventos de agenda (compromissos ou prazos) vinculados a um processo, sinalizando automaticamente como atrasado qualquer prazo cuja data já tenha passado e que não tenha sido marcado como cumprido."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN05 – Geração de Relatórios", bold: true, size: 22 })] }),
  p("O sistema deve gerar relatórios de cliente e de processo, permitindo salvá-los em PDF (via impressão do navegador) ou enviá-los diretamente por e-mail."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN06 – Contratos e Honorários", bold: true, size: 22 })] }),
  p("Cada processo pode ter no máximo um contrato vinculado. Ao ser cadastrado como parcelado, o sistema deve gerar automaticamente as parcelas com vencimento mensal, garantindo que a soma dos valores das parcelas seja exatamente igual ao valor total do contrato."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN07 – Cadastro de Processos", bold: true, size: 22 })] }),
  p("O sistema deve permitir cadastrar processos vinculados a um cliente e a um advogado já existentes, com número de processo único dentro do mesmo escritório."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN08 – Isolamento Multi-tenant", bold: true, size: 22 })] }),
  p("Nenhum dado (cliente, processo, contrato, documento ou agenda) de um escritório pode ser acessado por usuários de outro escritório, nem pelo painel administrativo da plataforma."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN09 – Painel Administrativo da Plataforma", bold: true, size: 22 })] }),
  p("O acesso ao painel administrativo da plataforma (painel mestre) é restrito a um administrador do sistema, com autenticação própria e completamente separada da autenticação dos usuários de escritório."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN10 – Registro de Auditoria", bold: true, size: 22 })] }),
  p("Todo login (bem-sucedido, malsucedido ou bloqueado) e toda criação, edição ou exclusão de um registro devem gerar uma entrada de auditoria com data/hora, autor, ação e escritório de origem. Um administrador de escritório só pode consultar os registros do próprio escritório; o painel mestre tem visão consolidada de todos os escritórios."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN11 – Redefinição de Senha", bold: true, size: 22 })] }),
  p("Ao solicitar a redefinição de senha, o sistema deve responder de forma idêntica independentemente de o e-mail informado existir ou não (para não revelar quais e-mails estão cadastrados), gerar um token de uso único válido por 1 hora e exigir que a nova senha atenda aos mesmos critérios de senha forte usados no cadastro."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN12 – Confirmação de E-mail no Auto-cadastro", bold: true, size: 22 })] }),
  p("No auto-cadastro público de um novo escritório, o administrador só pode fazer login depois de confirmar o e-mail através de um link com validade de 24 horas — exigência que só se aplica em produção, para não impedir o uso de e-mails fictícios em ambiente de desenvolvimento e teste. Advogados cadastrados por um administrador já autenticado não precisam dessa confirmação, já que o próprio administrador responde pela conta."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN13 – Revogação de Sessão", bold: true, size: 22 })] }),
  p("Ao encerrar a sessão (logout), o token de renovação (refresh token) do usuário deve ser invalidado no servidor, impedindo que uma cópia desse token continue sendo usada para obter novos acessos. O token de acesso já emitido permanece válido até sua expiração natural (até 30 minutos), já que a autenticação do sistema é stateless e não consulta essa revogação a cada requisição."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN14 – Cálculo de Prazo Processual", bold: true, size: 22 })] }),
  p("A contagem de um prazo em dias úteis deve considerar como não úteis os sábados, domingos e feriados nacionais — incluindo os feriados móveis calculados a partir da data da Páscoa (Carnaval, Sexta-feira Santa e Corpus Christi) — e os feriados locais e suspensões de expediente aplicáveis à comarca ou ao tribunal (RN36), além do recesso processual de 20 de dezembro a 20 de janeiro. Alternativamente, o sistema também permite a contagem em dias corridos, para prazos de natureza contratual ou de direito material."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN15 – Honorários de Sucumbência", bold: true, size: 22 })] }),
  p("O valor estimado de honorários de sucumbência é calculado multiplicando o valor da causa pelo percentual fixado pelo juízo. O sistema não determina esse percentual automaticamente — ele é definido por decisão judicial e apenas informado manualmente pelo usuário."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN16 – Envio de Lembretes", bold: true, size: 22 })] }),
  p("Um mesmo lembrete nunca deve ser enviado duas vezes ao mesmo usuário, canal e etapa, ainda que a rotina seja executada mais de uma vez no mesmo dia. E-mail e push são reservados e enviados de forma independente: a indisponibilidade do SMTP não impede o aviso no aparelho, e uma falha é retirada do registro para poder ser tentada novamente. Prazos fatais recebem reforços dois dias antes, um dia antes e no próprio dia; no aparelho, o aviso mais recente substitui o anterior do mesmo prazo. O resumo semanal é enviado às segundas-feiras, apenas aos usuários que o habilitaram."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN17 – Horas Faturáveis", bold: true, size: 22 })] }),
  p("Nem toda hora trabalhada é cobrada do cliente: horas de retrabalho, cortesia ou atividade interna são registradas como não faturáveis, entrando no total trabalhado mas ficando fora do valor a cobrar. O apontamento é sempre atribuído ao usuário autenticado, e não a um responsável informado manualmente, para que o registro de tempo seja rastreável a quem o lançou."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN18 – Despesas Reembolsáveis", bold: true, size: 22 })] }),
  p("Uma despesa lançada como não reembolsável não pode ser marcada como reembolsada, por ser um estado contraditório. A distinção entre despesa reembolsável e já reembolsada permite apurar quanto o escritório adiantou e ainda tem a receber do cliente."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN19 – Importação de Movimentações", bold: true, size: 22 })] }),
  p("Uma movimentação importada do DataJud é identificada pelo código do movimento em conjunto com a sua data e hora, e não apenas pelo código, porque um mesmo código se repete ao longo do processo — uma conclusão, por exemplo, ocorre diversas vezes. Consultas repetidas ao mesmo processo importam apenas o que ainda não existe, e a data registrada é a informada pelo tribunal, não a data da importação."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN20 – Preenchimento de Modelos", bold: true, size: 22 })] }),
  p("As variáveis de um modelo de documento são resolvidas exclusivamente a partir de um catálogo fechado, definido pelo sistema. Uma variável fora desse catálogo é mantida intacta no texto e sinalizada ao usuário, em vez de resolvida — o que impede que um modelo alcance dados não previstos. O sistema distingue, no retorno, a variável inexistente (erro de digitação) da variável válida cujo cadastro está em branco, e o preenchimento só utiliza clientes e processos do próprio escritório."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN21 – Sincronização Automática com o Tribunal", bold: true, size: 22 })] }),
  p("A rotina de sincronização considera apenas os processos em andamento e suspensos, por serem os que ainda recebem movimentação, e respeita um intervalo mínimo entre duas consultas ao mesmo processo, para não sobrecarregar o serviço público. A fila é ordenada pela data da última sincronização, com os processos nunca sincronizados em primeiro lugar — sem isso, um processo recém-cadastrado ficaria indefinidamente no fim da fila e poderia nunca ser alcançado pelo limite de consultas de cada execução."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN22 – Consolidação Financeira do Cliente", bold: true, size: 22 })] }),
  p("O resumo financeiro de um cliente ou processo soma o tempo trabalhado em minutos e só o converte em valor quando a hora é faturável e possui valor-hora informado: uma hora de cortesia entra no total trabalhado, mas não no que há a cobrar. O valor pendente é a diferença entre o valor contratado e a soma das parcelas efetivamente quitadas."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN23 – Apuração de Parcelas Vencidas", bold: true, size: 22 })] }),
  p("Uma parcela é considerada vencida quando a sua data de vencimento é anterior à data atual e ela ainda não foi quitada. A apuração compara a data de vencimento com o dia da consulta, e não se apoia no campo de situação da parcela: embora o modelo preveja a situação \"atrasado\", nenhuma rotina do sistema a atribui, de modo que confiar nesse campo faria toda parcela vencida passar despercebida."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN24 – Atribuição e Acompanhamento de Tarefas", bold: true, size: 22 })] }),
  p("Toda tarefa tem um responsável, que é avisado por e-mail ao recebê-la — atribuir sem avisar equivale a não atribuir —, salvo quando a própria pessoa se atribui a tarefa ou quando desabilitou esse aviso. Uma tarefa encerrada, concluída ou cancelada, nunca é contada como atrasada, ainda que o prazo já tenha passado, e reabri-la descarta a data de conclusão anterior. A ordenação da lista é por situação, prioridade e proximidade do prazo, ficando ao fim as tarefas sem prazo — a ausência de data não torna a tarefa urgente."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN25 – Funcionamento sem Conexão", bold: true, size: 22 })] }),
  p("O mecanismo de funcionamento offline armazena no dispositivo apenas os arquivos estáticos da aplicação e a tela de indisponibilidade, nunca respostas da API (RNF12). Sem conexão, uma navegação exibe a tela de indisponibilidade, e qualquer requisição de dados falha de forma explícita, em vez de retornar informação antiga armazenada localmente."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN26 – Matriz de Permissões", bold: true, size: 22 })] }),
  p("Uma única matriz — perfil × área × ação — decide o que cada pessoa pode fazer, e é a mesma usada pela API e enviada à interface. A ação exigida decorre do método da requisição (consultar, criar, editar ou excluir); operações que não seguem essa regra, como gerar um documento a partir de um modelo, declaram explicitamente a ação exigida. Nenhum usuário pode alterar o próprio perfil, e o escritório não pode ficar sem ao menos um administrador ativo. Membros que não são advogados são cadastrados sem exigência de OAB."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN27 – Segredo de Justiça", bold: true, size: 22 })] }),
  p("Um processo marcado como sigiloso, e tudo o que dele depende — movimentações, documentos, agenda, tarefas, contrato e parcelas, horas, despesas e intimações —, deixa de aparecer em listagens, buscas, relatórios, exportações, lembretes, calendário e no contexto enviado à IA para quem não seja o administrador ou o advogado responsável. Os totais do painel continuam contando o processo, pois revelam que ele existe, mas não o que contém."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN28 – Verificação em Duas Etapas", bold: true, size: 22 })] }),
  p("Com a verificação ativa, a senha correta não abre a sessão: devolve um desafio assinado, válido por 5 minutos, que só se converte em sessão com o código de 6 dígitos do aplicativo autenticador (TOTP, RFC 6238). Aceita-se uma janela de 30 segundos para diferenças de relógio, um mesmo código não é aceito duas vezes, e cinco códigos errados bloqueiam a conta por 15 minutos. Desativar a verificação exige a senha e um código válido."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN29 – Direitos do Titular (LGPD)", bold: true, size: 22 })] }),
  p("A data do consentimento do cliente é registrada pelo sistema no momento em que ele é marcado. A exportação reúne, em formato estruturado, os dados pessoais do titular e os processos e contratos ligados a ele (art. 18, II e V). A anonimização substitui de forma irreversível nome, documentos, contato, endereço e foto, preservando os processos, que o escritório tem obrigação legal de manter, e é registrada na auditoria. Só os perfis autorizados a excluir clientes atendem a esses pedidos."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN30 – Prazo de Intimação Eletrônica", bold: true, size: 22 })] }),
  p("A intimação considera-se publicada no primeiro dia útil seguinte ao da disponibilização no Diário (Lei 11.419/2006, art. 4º, § 3º), e a contagem começa no primeiro dia útil seguinte ao da publicação (art. 4º, § 4º; CPC, art. 224, § 3º). Em dias úteis, não contam sábados, domingos, feriados nacionais nem o recesso de 20 de dezembro a 20 de janeiro (CPC, arts. 219 e 220), e o prazo que termina em dia sem expediente passa para o próximo dia útil (CPC, art. 224, § 1º). O número de dias é lido do texto da intimação; sem prazo expresso, adota-se o de 5 dias úteis (CPC, art. 218, § 3º), marcado como estimado para conferência. Uma mesma comunicação nunca é importada duas vezes. Os feriados locais cadastrados pelo escritório também deixam de contar, tanto para a data de publicação quanto para a contagem e o vencimento (RN36)."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN31 – Cobrança por PIX", bold: true, size: 22 })] }),
  p("O código PIX é um BR Code estático, no padrão do Banco Central, com a chave do escritório, o valor exato da parcela e um identificador da parcela. Parcela já paga não gera PIX. A chave cadastrada é apenas ajustada ao formato exigido, sem validação de dígito de CPF ou CNPJ — a existência da chave é verificada pelo banco no pagamento. Por ser estático, o PIX não confirma o pagamento sozinho: a baixa da parcela continua sendo registrada pelo escritório."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN32 – Assinatura da Agenda", bold: true, size: 22 })] }),
  p("O link de assinatura contém um identificador aleatório de 256 bits e é pessoal. Gerar um novo link invalida o anterior, e o link deixa de responder se a conta ou o escritório forem desativados ou se o perfil perder o acesso à agenda. O calendário segue as mesmas regras da tela, inclusive o segredo de justiça, traz os eventos a partir do último mês e inclui aviso na véspera dos prazos — e também dois dias antes, nos prazos fatais."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN33 – Atualização do Cliente", bold: true, size: 22 })] }),
  p("A mensagem ao cliente nunca é enviada automaticamente: o advogado a revisa e pode editá-la antes de abri-la no WhatsApp. A IA só é usada quando o perfil tem acesso a ela e o servidor está configurado; caso contrário, ou se a IA falhar, um modelo automático traduz os termos processuais mais comuns para linguagem simples."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN34 – Notificações Push", bold: true, size: 22 })] }),
  p("Cada aparelho se inscreve separadamente e pode ser desligado a qualquer momento. As notificações seguem as mesmas preferências dos avisos por e-mail. Uma inscrição que o serviço de push informa como expirada é removida, e a falha no envio de uma notificação nunca interrompe a operação que a originou."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN35 – Planos e Limites", bold: true, size: 22 })] }),
  p("Todo escritório criado pelo cadastro público entra no plano Gratuito, sem pagamento: até 3 usuários ativos e 30 processos ativos. O Básico permite até 10 usuários e 300 processos e inclui as intimações do DJEN e a sincronização automática do DataJud; o Profissional não tem limites e inclui também a IA. Os limites são verificados pela API no momento de criar — cadastrar membro ou advogado, reativar usuário, cadastrar ou desarquivar processo —, e processos concluídos ou arquivados não contam. Atingir o limite nunca apaga nem esconde dados: apenas impede criar mais, com uma mensagem que indica os planos pagos. Um plano pago com validade vencida vale como Gratuito até ser renovado, e as rotinas agendadas só atendem os escritórios cujo plano em vigor inclui o recurso. No Gratuito, a mensagem de atualização ao cliente usa o modelo automático, sem IA."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN36 – Feriados Locais", bold: true, size: 22 })] }),
  p("Feriados municipais e estaduais e suspensões de expediente variam por comarca e são definidos por cada tribunal; por isso o sistema não traz uma lista pronta, e o escritório cadastra os dias que valem para ele. Um feriado pode valer só naquela data (uma suspensão por portaria) ou repetir todo ano no mesmo dia e mês (o aniversário da cidade). A mesma data pode ter feriados de abrangências diferentes no mesmo escritório. Quando a abrangência está preenchida, o feriado só afeta o prazo se coincidir com a comarca do processo ou com o tribunal da intimação; a abrangência vazia vale para todo o escritório. A calculadora também suspende os prazos processuais de 20 de dezembro a 20 de janeiro. Os feriados locais não afetam a contagem em dias corridos, e a calculadora informa quais deles mudaram o resultado. Excluir ou cadastrar um feriado vale para os cálculos seguintes: prazos já lançados na agenda não são recalculados."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN37 – Preenchimento pelo CNPJ", bold: true, size: 22 })] }),
  p("Ao informar um CNPJ completo (14 dígitos), o sistema consulta o cadastro público da empresa e preenche apenas os campos ainda vazios: nada do que o usuário já digitou é substituído, e todos os campos continuam editáveis. A consulta é uma ajuda e nunca uma condição — um CNPJ não encontrado, uma falha de rede ou a indisponibilidade do serviço apenas geram um aviso para preencher à mão, e o cadastro segue normalmente. Uma situação cadastral diferente de ativa (baixada, suspensa, inapta) é informada no aviso, mas não impede o cadastro, porque o escritório pode ter motivo legítimo para registrar a empresa — por exemplo, uma ação contra uma sociedade já extinta. A consulta parte do navegador e não envia ao serviço nenhum dado além do próprio CNPJ."),
];

// ============================================================
// 4. MODELAGEM DE SISTEMAS
// ============================================================
function linhaEspec(label, conteudo, opts = {}) {
  return new TableRow({ children: [
    celula(label, { bold: true, width: 2200, shading: "FDF6E3", color: DOURADO }),
    new TableCell({
      width: { size: 6850, type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: Array.isArray(conteudo)
        ? conteudo.map((linha) => new Paragraph({ spacing: { after: 40 }, alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: linha, size: 20 })] }))
        : [new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: conteudo, size: 20 })] })],
    }),
  ] });
}

function especificacaoUseCase(titulo, dados) {
  return [
    h3(titulo),
    new Table({
      width: { size: 9050, type: WidthType.DXA },
      columnWidths: [2200, 6850],
      rows: [
        linhaEspec("Ator Principal", dados.ator),
        linhaEspec("Pré-condições", dados.pre),
        linhaEspec("Fluxo Principal", dados.fluxo),
        linhaEspec("Fluxos Alternativos", dados.alt),
        linhaEspec("Pós-condições", dados.pos),
      ],
    }),
    new Paragraph({ text: "", spacing: { after: 240 } }),
  ];
}

const especAutenticar = especificacaoUseCase("4.2.1. Autenticar no Sistema", {
  ator: "Usuário do Escritório (qualquer perfil)",
  pre: "O usuário já deve estar previamente cadastrado em um escritório ativo.",
  fluxo: [
    "1. O usuário informa e-mail e senha.",
    "2. O sistema valida as credenciais no escritório correspondente.",
    "3. O sistema gera um token de acesso (JWT) e o retorna ao frontend.",
    "4. O usuário é redirecionado ao painel do escritório.",
  ],
  alt: [
    "A1. Senha inválida: o sistema informa o erro e incrementa o contador de tentativas.",
    "A2. 3ª tentativa inválida consecutiva: o sistema bloqueia o acesso por 15 minutos.",
    "A3. Escritório ou usuário inativo: o sistema recusa o login com mensagem específica.",
    "A4. Conta com verificação em duas etapas: em vez da sessão, o sistema devolve um desafio válido por 5 minutos e pede o código de 6 dígitos do aplicativo autenticador; só com o código correto a sessão é aberta (RN28).",
  ],
  pos: "Usuário autenticado, com sessão ativa e token válido.",
});

const especProcessos = especificacaoUseCase("4.2.2. Gerenciar Processos", {
  ator: "Advogado / Administrador",
  pre: "Usuário autenticado; cliente e advogado responsável já cadastrados no escritório.",
  fluxo: [
    "1. O usuário acessa a listagem de processos do escritório.",
    "2. O usuário cadastra um novo processo, vinculando-o a um cliente e a um advogado.",
    "3. O sistema valida se o número do processo já existe no escritório.",
    "4. O sistema salva o processo e o exibe na listagem.",
    "5. O usuário pode atualizar o status, registrar movimentações e anexar documentos.",
  ],
  alt: [
    "A1. Número de processo já existente no escritório: o sistema recusa o cadastro e aponta o campo com erro.",
    "A2. Usuário filtra a listagem por status, cliente, advogado ou período.",
    "A3. O escritório atingiu o limite de processos ativos do plano: o sistema recusa o cadastro, informa o limite e indica os planos pagos, sem afetar os processos existentes.",
  ],
  pos: "Processo registrado e disponível para acompanhamento pelo escritório.",
});

const especContratos = especificacaoUseCase("4.2.3. Gerenciar Contratos e Honorários", {
  ator: "Advogado / Administrador",
  pre: "Processo já cadastrado, ainda sem contrato vinculado.",
  fluxo: [
    "1. O usuário informa o valor total, o tipo de honorário e a forma de pagamento.",
    "2. Se a forma de pagamento for parcelada, o usuário informa o número de parcelas.",
    "3. O sistema gera automaticamente as parcelas, com vencimento mensal.",
    "4. O usuário registra o pagamento de cada parcela conforme recebida.",
  ],
  alt: [
    "A1. Processo já possui um contrato: o sistema recusa o novo cadastro (relação de 1 para 1 entre processo e contrato).",
    "A2. Pagamento à vista: o sistema gera uma única parcela com o valor total.",
  ],
  pos: "Contrato e parcelas registrados, com controle de valor pago e pendente.",
});

const especMestre = especificacaoUseCase("4.2.4. Gerenciar Escritórios da Plataforma", {
  ator: "Administrador do Sistema",
  pre: "Autenticado no painel mestre, com credencial própria — distinta da autenticação dos usuários de escritório.",
  fluxo: [
    "1. O administrador do sistema acessa a lista de todos os escritórios cadastrados na plataforma.",
    "2. Consulta os totais de advogados, clientes e processos de cada escritório.",
    "3. Altera o plano, a validade do plano ou o status (ativo/inativo) de um escritório.",
    "4. Pode excluir permanentemente um escritório da plataforma.",
  ],
  alt: [
    "A1. Escritório inativado: os usuários daquele escritório não conseguem mais autenticar-se.",
    "A2. Validade do plano pago vencida: o escritório volta a ter os limites do plano Gratuito até a renovação, sem perda de dados.",
  ],
  pos: "Escritório atualizado — sem que o administrador do sistema tenha acesso aos clientes ou processos de nenhum escritório, apenas aos metadados agregados.",
});

const especIntimacoes = especificacaoUseCase("4.2.5. Tratar Intimações do DJEN", {
  ator: "Advogado / Administrador (ou a rotina diária agendada)",
  pre: "Advogados do escritório com a OAB cadastrada no formato número/UF.",
  fluxo: [
    "1. O usuário aciona \"Buscar no DJEN\" (ou a rotina diária o faz automaticamente).",
    "2. O sistema consulta o DJEN pela OAB de cada advogado, nos últimos 7 dias.",
    "3. Para cada comunicação nova, o sistema a vincula ao processo cadastrado pelo número unificado.",
    "4. O sistema lê o prazo no texto e calcula o vencimento em dias úteis forenses (RN30).",
    "5. O sistema lança o prazo na agenda e notifica o advogado no celular.",
    "6. O usuário lê a intimação, confere o prazo e a marca como lida.",
  ],
  alt: [
    "A1. Texto sem prazo expresso: o sistema adota 5 dias úteis e marca o prazo como estimado.",
    "A2. Processo não cadastrado: a intimação é importada sem vínculo, identificada como \"não cadastrado\".",
    "A3. DJEN fora do ar: o sistema informa a indisponibilidade sem perder o que já foi importado.",
    "A4. Advogado sem OAB no formato número/UF: o sistema avisa quem precisa corrigir o cadastro.",
  ],
  pos: "Intimações registradas, prazos na agenda (e, com isso, nos lembretes e no calendário assinado) e advogados avisados.",
});

const modelagemSistemas = [
  h1("4. Modelagem de Sistemas"),

  h2("4.1. Diagrama de Casos de Uso"),
  p("O diagrama a seguir substitui a versão anterior, que apresentava casos de uso genéricos (como \"Cadastrar\", sem indicar o quê) e tratava \"Gerar Relatórios\" como um caso de uso independente. Os atores Administrador e Advogado agora são especializações (generalização/herança) de um ator comum, \"Usuário do Escritório\", que concentra o caso de uso de autenticação. A geração de relatórios deixou de ser um caso de uso isolado e passou a ser uma extensão (<<extend>>) das consultas de cliente e de processo, refletindo como ela é de fato utilizada no sistema. O ator Cliente foi removido, pois o portal de acesso do próprio cliente não faz parte do escopo atual; em seu lugar, foi incluído o ator Administrador do Sistema, responsável pelo painel administrativo da plataforma."),
  p("Na revisão mais recente, o ator Usuário do Escritório passou a ter cinco especializações, uma por perfil de acesso — Administrador, Advogado, Estagiário, Financeiro e Secretária —, e foram incluídos os casos de uso Gerenciar Equipe e Perfis de Acesso, Configurar Verificação em Duas Etapas, Atender Pedido do Titular (LGPD), Tratar Intimações do DJEN (que inclui Gerenciar Agenda, pois todo prazo importado é lançado nela), Cobrar Parcela com PIX (extensão de Registrar Pagamento de Parcela), Atualizar o Cliente sobre o Andamento (extensão de Consultar Processo), Acompanhar Tarefas e Sincronizar Agenda."),
  p("Com a introdução dos planos de assinatura, entraram o ator Visitante, que cria o escritório pelo cadastro público já no plano Gratuito, o caso de uso Consultar Plano e Uso dos Limites e o caso de uso Verificar Limite do Plano, incluído pelos casos que dependem do plano: Gerenciar Processos e Gerenciar Equipe e Perfis de Acesso (limites de processos e de usuários), Consultar Assistente de IA e Tratar Intimações do DJEN (recursos dos planos pagos)."),
  p("Por fim, o caso de uso Cadastrar Feriados Locais, dos perfis que gerenciam a agenda, estende Gerenciar Agenda: os dias cadastrados passam a valer no cálculo dos prazos (RF50)."),
  p("O caso de uso Preencher Dados pelo CNPJ estende Gerenciar Clientes e Cadastrar Escritório: ao informar o CNPJ, os dados da empresa vêm do cadastro público da Receita Federal, mas o cadastro continua possível sem ele (RF51/RN37)."),
  ...fig(`${DIAG}/casos_de_uso.png`, 1015, 2399, "Figura 1 – Diagrama de Casos de Uso", 360),

  h2("4.2. Especificação dos Casos de Uso"),
  p("Esta seção detalha os cinco casos de uso mais representativos do sistema, cobrindo autenticação (incluindo a verificação em duas etapas), o núcleo de gestão de processos, o módulo de contratos e honorários, o painel administrativo da plataforma e o tratamento das intimações eletrônicas."),
  ...especAutenticar,
  ...especProcessos,
  ...especContratos,
  ...especMestre,
  ...especIntimacoes,

  h2("4.3. Diagrama de Classes"),
  p("O diagrama de classes foi revisado para incluir entidades ausentes na versão anterior — Escritorio (raiz do isolamento multi-tenant), SuperAdmin (administrador do sistema), Agenda (compromissos e prazos) e Parcela (parcelamento de contratos) — e para corrigir inconsistências apontadas: o Cliente passou a incluir telefone, e-mail e endereço; a especialização ClienteUsuario foi removida, já que o cliente não é um usuário do sistema; e não existe mais uma classe Relatorio — a geração de relatórios é um método das próprias classes Processo e Cliente, e não uma entidade persistida. Foram acrescentadas as classes RegistroAuditoria, que registra a trilha de auditoria de login e de alterações de dados (RF18), TokenRedefinicaoSenha, que suporta a redefinição de senha por e-mail (RF19), e TokenVerificacaoEmail, que suporta a confirmação de e-mail no auto-cadastro (RF20). A classe Processo passou a incluir atributos jurídicos complementares — área do direito, vara, comarca, valor da causa, parte contrária e percentual de honorários de sucumbência (RF23/RF24) —, e a classe Agenda ganhou o atributo de prioridade, para distinguir um prazo fatal de um compromisso comum. Na revisão mais recente foram incluídas as classes ApontamentoHora, que registra o tempo trabalhado em cada processo (RF26), Despesa, que controla as custas e despesas processuais e o que é reembolsável pelo cliente (RF27), SessaoUso, que acumula o tempo de uso do sistema por usuário (RF28), NotificacaoEnviada, que garante que um mesmo lembrete não seja enviado duas vezes (RF25/RN16), e ModeloDocumento, que guarda os modelos preenchíveis do escritório (RF30). A classe Movimentacao passou a registrar a origem do andamento — lançado no sistema ou importado do DataJud — e o seu identificador no tribunal, o que viabiliza a importação sem duplicar (RF29/RN19). Por fim, foi acrescentada a classe Tarefa, que representa uma unidade de trabalho com responsável, prioridade e prazo, e cujo método estaAtrasada() concentra a regra de que uma tarefa já encerrada não é contada como atrasada (RF34/RN24)."),
  p("A etapa final acrescentou ao diagrama as especializações Estagiario, Financeiro e Secretaria da classe Usuario, que passou a expor o método pode(area, acao), ponto único de decisão das permissões (RF38/RN26), e os atributos da verificação em duas etapas e do link de assinatura da agenda (RF41/RF43). A classe Cliente ganhou o registro do consentimento LGPD e os métodos exportarDadosDoTitular() e anonimizar() (RF42/RN29); a classe Processo, o atributo sigiloso (RF40/RN27) e o método resumirParaCliente() (RF46); a classe Parcela, o método gerarPix() (RF45/RN31). Foram criadas as classes Intimacao, que representa uma comunicação do DJEN com o prazo calculado e o evento de agenda que ela originou (RF47/RN30), InscricaoPush, que guarda as chaves de cada aparelho inscrito nas notificações (RF48/RN34), e ConfiguracaoEscritorio, que passou a reunir a chave PIX do escritório."),
  p("Para os planos, a classe Escritorio, que já guardava o plano e a sua validade, passou a expor planoEfetivo() — o plano que vale hoje, considerando a validade —, temRecurso(recurso) e verificarLimite(limite), usados pelas operações que dependem do plano (RF49/RN35)."),
  p("A classe FeriadoLocal, composta pelo Escritorio, representa um dia sem expediente que vale só para aquele escritório; o método caiEm(data) considera a repetição anual, e o cálculo de prazos consulta os feriados aplicáveis à comarca ou ao tribunal além dos nacionais (RF50/RN36)."),
  ...fig(`${DIAG}/classes.png`, 2340, 2493, "Figura 2 – Diagrama de Classes", 470),

  h2("4.4. Diagramas de Sequência"),
  p("A versão anterior deste relatório fazia referência a um diagrama de sequência sem, de fato, apresentá-lo. O diagrama abaixo detalha o fluxo de autenticação, incluindo o bloqueio de acesso após tentativas inválidas (RN01) — uma das regras de negócio efetivamente implementadas e testadas automaticamente no sistema."),
  ...fig(`${DIAG}/sequencia.png`, 858, 866, "Figura 3 – Diagrama de Sequência: Autenticar no Sistema", 430),
  p("O segundo diagrama detalha a importação de intimações do DJEN, o fluxo que mais envolve regras de domínio: a consulta por OAB, o vínculo ao processo pelo número unificado, a leitura do prazo no texto, o cálculo do vencimento em dias úteis forenses — com publicação no dia útil seguinte à disponibilização e suspensão no recesso de fim de ano (RN30) — e o lançamento do prazo na agenda, seguido da notificação ao advogado."),
  ...fig(`${DIAG}/sequencia_djen.png`, 1306, 789, "Diagrama de Sequência: Importar intimação do DJEN e lançar o prazo", 480),
];

// ============================================================
// 5. MODELAGEM DE DADOS
// ============================================================
const modelagemDados = [
  h1("5. Modelagem de Dados"),
  p("O sistema utiliza banco de dados relacional PostgreSQL, hospedado no Supabase (substituindo o MySQL previsto na proposta original). A seguir é apresentado o modelo de dados do sistema, com suas entidades, atributos e relacionamentos."),
  p("A tabela escritorio é a raiz do isolamento multi-tenant: armazena nome, CNPJ, contato, plano de assinatura e validade, e a ela pertencem os usuários, clientes e processos. A tabela superadmin é independente do escritório e representa o administrador do sistema, responsável pelo painel mestre. A tabela usuario representa administradores e advogados (campo tipo_usuario), incluindo os campos de bloqueio de login (tentativas_login, bloqueado_ate). A tabela cliente armazena nome, CPF, e-mail, telefone e endereço. A tabela processo é a entidade central, vinculada a um cliente e a um advogado, com movimentacao e documento como entidades dependentes. A tabela agenda substitui o antigo conceito isolado de \"prazo\": um único modelo representa tanto compromissos quanto prazos, diferenciados pelo campo tipo. As tabelas contrato e parcela implementam o controle de honorários: cada processo tem no máximo um contrato, dividido em uma ou mais parcelas."),
  p("Diferentemente da versão anterior deste relatório, não existe uma tabela relatorio: os relatórios são montados sob demanda, a partir dos dados de processo, cliente, documento e agenda, e não persistidos como uma entidade própria."),
  p("A tabela registro_auditoria implementa a trilha de auditoria (RF18/RN10): cada linha representa um evento de login ou uma operação de criação, edição ou exclusão, associada opcionalmente a um escritório, um usuário ou um administrador do sistema (superadmin), conforme quem a originou. Nas edições, a coluna JSONB alteracoes guarda somente os campos efetivamente modificados, com os valores anterior e novo; senhas, tokens, chaves e segredos são descartados antes da gravação. A tabela token_redefinicao_senha suporta o fluxo de redefinição de senha (RF19/RN11), e a tabela token_verificacao_email suporta a confirmação de e-mail no auto-cadastro (RF20/RN12) — ambas armazenam um token de uso único com prazo de expiração para o usuário que o solicitou. A tabela usuario passou a registrar se o e-mail já foi confirmado (email_verificado). A tabela movimentacao passou a registrar também o usuário responsável (criado_por_id), permitindo saber quem lançou cada andamento do processo. A tabela processo ganhou colunas para os dados jurídicos complementares (área do direito, vara, comarca, valor da causa, parte contrária, advogado adverso e percentual de honorários de sucumbência — RF23/RF24), e a tabela agenda ganhou a coluna prioridade, para distinguir um prazo fatal de um evento comum. A revisão seguinte acrescentou as tabelas apontamento_hora (tempo trabalhado por processo, em minutos inteiros para evitar o arredondamento de horas decimais), despesa (custas e despesas processuais, com comprovante e controle de reembolso), sessao_uso (janelas de uso do sistema por usuário), notificacao_enviada (controle de idempotência dos lembretes) e modelo_documento (modelos preenchíveis do escritório). A tabela movimentacao ganhou as colunas origem e identificador_externo, que permitem importar andamentos do DataJud sem duplicar, e a coluna data_movimentacao deixou de ser preenchida automaticamente na inserção para poder receber a data informada pelo tribunal. A tabela processo passou a registrar a data da última sincronização com o DataJud, e a tabela advogado, o valor-hora padrão usado no apontamento de horas."),
  p("A revisão final acrescentou a tabela tarefa, que representa o trabalho interno do escritório — levantar jurisprudência, revisar uma minuta, entrar em contato com uma testemunha. Ela se distingue da tabela agenda por dois aspectos: não tem hora marcada e tem um responsável obrigatório, registrado em responsavel_id. O vínculo com o processo é opcional, porque nem todo trabalho do escritório nasce de um processo, e as colunas status, prioridade, prazo e concluida_em sustentam o acompanhamento (RF34/RN24). A tabela preferencias_usuario ganhou a coluna de aviso de tarefa atribuída, e a tabela processo já registrava a data da última sincronização com o DataJud, utilizada agora para ordenar a fila da rotina automática (RF31/RN21)."),
  p("Na etapa final, a tabela usuario ganhou as colunas da verificação em duas etapas — o segredo do autenticador (totp_segredo), o indicador de ativação (totp_ativo) e o último intervalo de tempo aceito (totp_ultimo_passo), que impede o reuso de um mesmo código — e o identificador do link de assinatura da agenda (agenda_feed_token); o perfil de acesso continua no campo tipo_usuario, que passou a admitir também estagiário, financeiro e secretária. A tabela cliente passou a registrar o consentimento LGPD e a data em que foi dado, além da data de anonimização; a tabela processo, o indicador sigiloso. Foram criadas as tabelas intimacao, com a comunicação do DJEN, o processo e o advogado a que se refere, as datas de disponibilização e publicação, o prazo calculado e o evento de agenda gerado — com unicidade por escritório e identificador externo, para que a mesma comunicação nunca seja importada duas vezes —, e inscricao_push, com o endereço e as chaves de cada aparelho inscrito. A tabela configuracao_escritorio passou a guardar a chave PIX, o nome do recebedor e a cidade usados no código de cobrança."),
  p("A tabela feriado_local guarda, por escritório, os feriados municipais e estaduais e as suspensões de expediente: data, descrição, abrangência (comarca ou tribunal usado para filtrar o cálculo) e o indicador anual, que faz a data valer todos os anos no mesmo dia e mês. Uma restrição de unicidade impede repetir a mesma data e abrangência no mesmo escritório."),
  p("A tabela intimacao ganhou conferido_em, conferido_por_id e observacao_conferencia (RF53). Leitura, conferência e cumprimento são estados distintos. A edição manual da data na agenda invalida a conferência anterior. Na anonimização de cliente, os valores pessoais do histórico de alterações e as referências estruturadas ao cliente são tratados, preservando os metadados da trilha de auditoria."),
  ...fig(`${DIAG}/er.png`, 2273, 2510, "Figura 4 – Diagrama de Banco de Dados (Modelo Entidade-Relacionamento)", 470),
];

// ============================================================
// 6. PROTÓTIPOS
// ============================================================
const prototipos = [
  h1("6. Protótipos das Funcionalidades Principais"),
  p("Diferentemente da versão anterior deste relatório — que apresentava mockups de uma \"Área do Cliente\" hoje fora do escopo do projeto, já que o cliente não possui acesso próprio ao sistema —, esta seção apresenta capturas de tela reais da aplicação em funcionamento, com dados de demonstração."),
  p("As 34 capturas da interface foram refeitas em 28/10/2026 para apresentar a marca LexNexo e os controles atuais, incluindo navegação agrupada, ajuda progressiva, cadastro por etapas e configuração de notificações. Foram usados apenas serviços locais e dados fictícios. As respostas de CNPJ e DataJud foram simuladas, e a intimação foi criada pela massa de demonstração. As imagens ilustram a interface desta revisão; os resultados quantitativos da auditoria de 27/10/2026 permanecem identificados separadamente na seção 7.5."),
  p("As telas de login e do painel inicial, assim como as das seções 6.14 a 6.25, foram capturadas sobre o escritório de demonstração criado pelo comando popular_demo, que monta um escritório completo — um usuário de cada perfil, clientes, processos (um deles em segredo de justiça), andamentos, agenda, tarefas, contrato com parcelas e chave PIX — e é o mesmo usado pelos testes de ponta a ponta."),

  h2("6.1. Tela de Login"),
  p("Layout em dois painéis: à esquerda, a apresentação do produto; à direita, o formulário de acesso (e-mail e senha). Após 3 tentativas de senha inválidas, o acesso é bloqueado por 15 minutos (RN01)."),
  ...fig(`${DIAG}/print_login.png`, 1440, 900, "Figura 5 – Tela de login", 480),

  h2("6.2. Painel do Escritório (Dashboard)"),
  p("Visão geral do escritório autenticado, reorganizada para responder primeiro ao que exige ação: os prazos que estão vencendo e as tarefas da pessoa logada aparecem no topo, seguidos dos indicadores de clientes, processos, audiências e documentos, do financeiro do escritório e dos gráficos. A tela foi verificada automaticamente quanto às regras de acessibilidade WCAG 2 AA, sem violações. Os blocos exibidos dependem do perfil: o financeiro, por exemplo, não aparece para estagiários e secretárias."),
  ...fig(`${DIAG}/print_dashboard.png`, 1440, 900, "Figura 6 – Painel do escritório (dashboard)", 480),

  h2("6.3. Contratos e Honorários"),
  p("Listagem de contratos vinculados a processos, com valores totais, pago e pendente calculados automaticamente a partir das parcelas geradas."),
  ...fig(`${DIAG}/print_contratos.png`, 1440, 460, "Figura 7 – Painel de Contratos e Honorários", 480),

  h2("6.4. Painel Mestre (Administrador do Sistema)"),
  p("Painel restrito ao desenvolvedor da plataforma, com autenticação própria, permitindo consultar e gerenciar todos os escritórios cadastrados sem acesso aos dados de clientes ou processos de nenhum deles."),
  ...fig(`${DIAG}/print_master.png`, 1440, 900, "Figura 8 – Painel Mestre", 480),

  h2("6.5. Registro de Auditoria"),
  p("Nova aba nas Configurações do escritório, visível apenas ao administrador (RF18/RN10), listando os eventos de login e de criação, edição e exclusão de registros, com data/hora, usuário responsável e descrição. O painel mestre possui uma seção equivalente, com visão consolidada de todos os escritórios da plataforma."),
  ...fig(`${DIAG}/print_auditoria.png`, 1440, 900, "Figura 9 – Registro de Auditoria", 480),

  h2("6.6. Cálculo de Prazo em Dias Úteis"),
  p("Ao cadastrar um evento do tipo prazo na agenda, uma calculadora opcional permite informar a data de início da contagem e a quantidade de dias, e preenche automaticamente a data final (RF22), contando em dias úteis — pulando fins de semana e feriados nacionais, inclusive os móveis, calculados a partir da Páscoa — ou em dias corridos, conforme a natureza do prazo."),
  ...fig(`${DIAG}/print_prazo.png`, 1440, 1250, "Figura 10 – Calculadora de Prazo em Dias Úteis", 480),

  h2("6.7. Horas Trabalhadas e Despesas Processuais"),
  p("O contrato já previa o honorário por hora trabalhada, mas não havia onde registrar as horas. O painel de Horas e Custos passou a concentrar três controles: o apontamento das horas por processo (RF26), com distinção entre o que é faturável e o que não é (RN17); o lançamento das custas e despesas processuais, separando o que é reembolsável pelo cliente do que já foi reembolsado (RF27/RN18); e o tempo de uso do sistema por usuário (RF28). Os totais de horas lançadas, de valor faturável e de despesas a reembolsar são apresentados acima de cada listagem."),
  ...fig(`${DIAG}/print_horas.png`, 1440, 900, "Figura 11 – Apontamento de horas trabalhadas", 480),

  h2("6.8. Consulta Processual no DataJud"),
  p("A partir do número unificado do processo, o sistema identifica o tribunal competente pelos dígitos de segmento e tribunal previstos na Resolução CNJ 65/2008 e consulta a API pública do DataJud (Resolução CNJ 331/2020), importando as movimentações ainda não registradas (RF29). Consultas repetidas trazem apenas o que é novo, porque cada movimentação é identificada pelo código em conjunto com a data e hora informadas pelo tribunal (RN19). Cabe registrar o limite da fonte: o DataJud disponibiliza a capa e as movimentações do processo, e não o texto das publicações do Diário da Justiça — lacuna tratada pela importação de intimações do DJEN, descrita na seção 6.18."),
  ...fig(`${DIAG}/print_datajud.png`, 1440, 900, "Figura 12 – Retorno da consulta ao DataJud", 480),

  h2("6.9. Modelos de Documento"),
  p("O escritório cadastra uma vez o texto de uma procuração, contrato ou declaração, marcando com variáveis os pontos em que os dados devem entrar, e o sistema os preenche a partir do cadastro do cliente, do processo e do próprio escritório (RF30). As variáveis são resolvidas a partir de um catálogo fechado (RN20/RNF10), e o sistema distingue, ao gerar, a variável inexistente daquela cujo cadastro está em branco. O recurso aproveita campos do cliente que já eram coletados e pouco utilizados — RG, estado civil e nacionalidade —, exatamente os exigidos em uma procuração."),
  ...fig(`${DIAG}/print_modelos.png`, 1440, 900, "Figura 13 – Procuração gerada a partir de um modelo", 480),

  h2("6.10. Indicadores Financeiros do Escritório"),
  p("O painel inicial apresentava apenas contagens — clientes, processos, audiências e documentos — sem nenhum valor monetário, embora contratos, parcelas, horas e despesas já estivessem registrados no banco. Para saber quanto havia a receber era preciso abrir contrato por contrato. A faixa de indicadores (RF33) responde essa pergunta na abertura do sistema: valor a receber, recebido no mês corrente, valor vencido com a quantidade de parcelas em atraso, horas faturáveis apontadas no mês e despesas adiantadas pelo escritório ainda não cobradas. O cartão de valor vencido é destacado quando há parcela em atraso, apurada pela comparação entre o vencimento e a data da consulta (RN23)."),
  ...fig(`${DIAG}/print_financeiro.png`, 1440, 900, "Figura 14 – Indicadores financeiros do escritório", 480),

  h2("6.11. Tarefas do Escritório"),
  p("A agenda registra o que tem hora marcada — audiência, prazo, reunião. O trabalho interno do escritório não tinha onde ser registrado nem a quem ser atribuído. O painel de Tarefas (RF34) trata dessa unidade de trabalho: cada tarefa tem um responsável, que é avisado por e-mail ao recebê-la, além de prioridade, prazo opcional e vínculo opcional a um processo. As abas separam o que está em aberto para o usuário, o que está em aberto para o escritório e o histórico completo. A ordenação segue situação, prioridade e proximidade do prazo (RN24)."),
  ...fig(`${DIAG}/print_tarefas.png`, 1440, 900, "Figura 15 – Painel de tarefas do escritório", 480),

  h2("6.12. Busca Global"),
  p("A busca do topo alcançava três das oito áreas do sistema. Ampliada (RF37), ela passou a consultar também tarefas, eventos de agenda, contratos, horas apontadas e modelos de documento, agrupando os resultados por área. Digitar o número de um processo reúne, em uma única lista, o processo e tudo o que está vinculado a ele."),
  ...fig(`${DIAG}/print_busca.png`, 1440, 900, "Figura 16 – Busca global agrupada por área", 480),

  h2("6.13. Central de Ajuda"),
  p("O sistema reúne catorze áreas e não trazia nenhuma explicação sobre o próprio funcionamento. A central de ajuda (RF36) é acessível de qualquer tela e abre no assunto correspondente à área em uso: quem a aciona de dentro do painel de tarefas encontra a explicação de tarefas, e não uma visão geral. A busca interna distingue duas intenções — procurar pelo nome de um assunto devolve o assunto inteiro, procurar por um detalhe devolve apenas os tópicos que tratam dele."),
  ...fig(`${DIAG}/print_ajuda.png`, 1440, 900, "Figura 17 – Central de ajuda aberta no assunto em uso", 480),

  h2("6.14. Perfis de Acesso e Equipe"),
  p("Em Configurações › Escritório, o administrador vê a equipe com o perfil de cada pessoa, troca o perfil pela própria lista e inclui membros que não são advogados — estagiário, financeiro, secretária ou outro administrador —, com a descrição do que cada perfil pode fazer (RF38/RF39). As permissões são aplicadas pela API e a interface apenas deixa de mostrar o que seria recusado (RNF15): o menu, os atalhos, os botões de cada lista e os blocos do painel acompanham o perfil. Na segunda figura, o mesmo painel de processos visto por um estagiário: sem o processo sigiloso, sem o botão de exclusão e sem o item Contratos no menu."),
  ...fig(`${DIAG}/print_equipe.png`, 1440, 900, "Equipe e perfis de acesso do escritório", 480),
  ...fig(`${DIAG}/print_perfil_estagiario.png`, 1440, 900, "Painel de processos visto pelo perfil Estagiário", 480),

  h2("6.15. Processo em Segredo de Justiça"),
  p("Um processo marcado como segredo de justiça recebe um selo na listagem e na ficha e passa a ser visto apenas pelo administrador e pelo advogado responsável (RF40/RN27). Para os demais, ele e tudo o que dele depende desaparecem de listas, buscas, relatórios, calendário, intimações e do contexto enviado à IA."),
  ...fig(`${DIAG}/print_sigilo.png`, 1440, 900, "Processo em segredo de justiça, visto pelo administrador", 480),

  h2("6.16. Verificação em Duas Etapas"),
  p("Em Configurações › Conta, cada pessoa pode ativar a verificação em duas etapas lendo o QR code com um aplicativo autenticador (Google Authenticator, Microsoft Authenticator, Authy) ou digitando a chave exibida, e confirmando com o primeiro código gerado (RF41). A partir daí, o login pede o código de 6 dígitos depois da senha (RN28). Quem perde o celular tem a verificação redefinida pelo administrador."),
  ...fig(`${DIAG}/print_2fa.png`, 1440, 900, "Configuração da verificação em duas etapas, sem exibição de segredo", 480),
  ...fig(`${DIAG}/print_login_2fa.png`, 390, 844, "Segunda etapa do login, no celular", 200),

  h2("6.17. Direitos do Titular (LGPD)"),
  p("O cadastro do cliente registra se ele autorizou o tratamento dos dados pessoais e a data em que o consentimento foi registrado. Na listagem, os perfis autorizados encontram duas ações por cliente: exportar os dados do titular em formato estruturado e anonimizar o cadastro, esta precedida de uma confirmação que explica que a operação é irreversível e que os processos são mantidos (RF42/RN29)."),
  ...fig(`${DIAG}/print_lgpd.png`, 1440, 900, "Clientes, com as ações de exportação e anonimização", 480),

  h2("6.18. Intimações do DJEN"),
  p("A aba Intimações do painel de processos reúne as comunicações publicadas no Diário de Justiça Eletrônico Nacional em nome dos advogados do escritório (RF47). Cada intimação mostra o tribunal, o órgão, o processo — com atalho para a ficha, quando cadastrado —, a data de publicação e o prazo calculado, destacado como estimado quando o texto não traz o número de dias (RN30). O texto pode ser lido por inteiro e a intimação, marcada como lida; o prazo já está na agenda. A captura usa a intimação fictícia do escritório de demonstração, identificada como exemplo na própria tela. Não representa uma publicação real nem comprova consulta ao serviço do CNJ."),
  ...fig(`${DIAG}/print_intimacoes.png`, 1440, 900, "Intimações importadas do DJEN com o prazo calculado", 480),

  h2("6.19. Cobrança por PIX"),
  p("Com a chave PIX do escritório cadastrada, cada parcela pendente ganha o botão Cobrar com PIX, que abre o QR code e o código copia e cola com o valor exato da parcela, além do envio pronto pelo WhatsApp com valor, vencimento e código (RF45/RN31). O código de uma cobrança real segue o padrão BR Code do Banco Central e foi conferido contra o exemplo do manual oficial nos testes automatizados. A captura apresenta o modo de teste atual do LexNexo, identificado como sem movimentação de dinheiro, e não uma cobrança bancária real."),
  ...fig(`${DIAG}/print_pix.png`, 1440, 900, "Modo de teste do PIX de honorários, sem movimentação de dinheiro", 480),

  h2("6.20. Atualização do Cliente"),
  p("Na ficha do processo, Atualizar o cliente gera uma mensagem em linguagem simples com os últimos andamentos e os próximos compromissos (RF46). Os termos do tribunal são traduzidos — \"conclusos para decisão\" vira \"o processo foi para o juiz analisar\" —, o texto pode ser editado e é aberto no WhatsApp do cliente apenas depois da revisão do advogado (RN33). Quando a IA está disponível, é ela quem redige, recebendo somente o primeiro nome do cliente e os andamentos (RNF16)."),
  ...fig(`${DIAG}/print_resumo.png`, 1440, 900, "Mensagem de atualização do andamento para o cliente", 480),

  h2("6.21. Quadro de Tarefas"),
  p("Além das listas, as tarefas podem ser acompanhadas em um quadro com as colunas A fazer, Fazendo e Concluídas (RF44). O cartão muda de coluna ao ser arrastado e também pelas setas do próprio cartão, que funcionam no teclado e no celular, onde arrastar não é prático. A mudança aparece na hora e é desfeita, com aviso, se a API a recusar."),
  ...fig(`${DIAG}/print_kanban.png`, 1440, 900, "Quadro Kanban de tarefas", 480),

  h2("6.22. Agenda no Calendário do Celular"),
  p("A aba Sincronizar da agenda permite baixar os eventos em um arquivo .ics ou criar um link privado de assinatura, com as instruções para Google Agenda, Outlook e iPhone (RF43). Assinado, o calendário do aparelho passa a mostrar prazos e audiências atualizados, com aviso na véspera dos prazos (RN32)."),
  ...fig(`${DIAG}/print_ics.png`, 1440, 900, "Exportação e assinatura da agenda", 480),

  h2("6.23. Notificações no Celular e no Navegador"),
  p("Em Configurações › Notificações, cada aparelho pode ser inscrito para receber avisos na hora, mesmo com o sistema fechado: intimação nova, tarefa atribuída e lembretes de prazo e audiência (RF48). As mensagens são cifradas para o aparelho de destino (RNF17); no iPhone, o recurso exige o sistema instalado na tela de início. Dentro do sistema, o sino funciona como central de alertas independente desses canais: reúne itens vencidos e os próximos sete dias, identifica prazo fatal, vencimento, horário e processo relacionado e permanece operável por teclado."),
  ...fig(`${DIAG}/print_push.png`, 1440, 900, "Configuração de notificações no ambiente local sem chaves VAPID", 480),

  h2("6.24. Documentação da API"),
  p("A API passou a ter documentação interativa no padrão OpenAPI 3, gerada a partir das próprias views e serializers e publicada em /api/docs (RNF18). As rotas são agrupadas por assunto, com a explicação da autenticação, do escopo por escritório e dos perfis de acesso, e podem ser chamadas pela própria página após informar o token de acesso. A integração contínua valida o esquema a cada alteração e falha se alguma rota ficar sem documentação."),
  ...fig(`${DIAG}/print_swagger.png`, 1440, 900, "Documentação interativa da API (Swagger UI)", 480),

  h2("6.25. Testes de Ponta a Ponta"),
  p("Os testes de ponta a ponta usam o sistema como uma pessoa usaria, em um navegador de verdade, sobre o escritório de demonstração: login com senha errada e certa, cadastro de cliente, ficha do processo e mensagem ao cliente, perfis de acesso e sigilo, quadro de tarefas, PIX, exportação da agenda e uso no celular, além da checagem automática de acessibilidade WCAG 2 AA no login e no painel. O workflow prevê sua execução junto aos testes da API e de componentes (RNF19). Na auditoria final local, passaram 34 cenários Playwright, 532 testes Django e 275 Jest; esses resultados não comprovam uma execução remota do workflow."),
  new Table({
    width: { size: LARGURA_UTIL, type: WidthType.DXA },
    columnWidths: [5600, 3471],
    rows: [
      new TableRow({ tableHeader: true, children: [celula("Playwright na auditoria de 27/10/2026", { width: 5600, bold: true, shading: AZUL, color: "FFFFFF" }), celula("Resultado local", { width: 3471, bold: true, shading: AZUL, color: "FFFFFF" })] }),
      ...[["Cenários aprovados", "34"], ["Falhas / ignorados / instáveis", "0 / 0 / 0"], ["Duração do reteste após dependências", "74,821 s"]].map((r) => new TableRow({ cantSplit: true, children: [celula(r[0], { width: 5600 }), celula(r[1], { width: 3471, center: true })] })),
    ],
  }),
  p("Fonte: docs/testes/evidencias/execucoes.json. A revisão visual de 28/10 não constitui nova execução integral dessa suíte.", { italics: true }),

  h2("6.26. Planos de Assinatura"),
  p("A página inicial apresenta os três planos antes do cadastro, com o Gratuito em primeiro lugar e o convite para começar sem pagar (RF49). Os valores e as vantagens exibidos vêm da própria API, a mesma que aplica os limites, de modo que a página e o sistema nunca divergem."),
  ...fig(`${DIAG}/print_planos_site.png`, 1440, 900, "Planos na página inicial", 480),
  p("Dentro do sistema, a tela de planos mostra o plano do escritório e quanto ele usa de cada limite, com a barra em vermelho quando o limite foi atingido, e os planos superiores com o botão de contratação, que abre um e-mail para a equipe comercial. A captura atual usa o escritório de demonstração no plano Profissional, com cinco usuários e quatro processos. A interface também oferece uma simulação de PIX dos planos, identificada como teste e sem alteração da assinatura real. Quando um recurso pago é usado no Gratuito — por exemplo, o assistente de IA —, a API recusa a operação e a tela exibe a mensagem indicando o plano que o inclui (RN35)."),
  ...fig(`${DIAG}/print_planos.png`, 1440, 900, "Plano atual, uso dos limites e planos pagos", 480),

  h2("6.27. Feriados Locais no Cálculo de Prazos"),
  p("A aba Feriados locais da agenda reúne os feriados da comarca e as suspensões de expediente do tribunal, com a indicação dos que se repetem todo ano (RF50). O texto da própria tela lembra que os feriados nacionais e o recesso forense já entram no cálculo."),
  ...fig(`${DIAG}/print_feriados.png`, 1440, 900, "Feriados locais do escritório", 480),
  p("Na calculadora de prazos, o feriado local passa a contar: um prazo de um dia útil iniciado em 01/12/2026 vence em 03/12, e não em 02/12, aniversário de Araçatuba. A tela informa qual feriado local mudou o resultado, para que o advogado confira a data antes de lançá-la (RN36)."),
  ...fig(`${DIAG}/print_feriados_calculo.png`, 1440, 1250, "Calculadora de prazos considerando um feriado local", 480),

  h2("6.28. Preenchimento pelo CNPJ"),
  p("No cadastro de cliente pessoa jurídica, ao sair do campo de CNPJ o sistema consulta o cadastro da empresa e preenche razão social, e-mail, telefone, CEP e endereço; o aviso abaixo do campo lembra de conferir os dados antes de salvar (RF51). Os nomes chegam da Receita Federal em maiúsculas e são ajustados para a forma usual, preservando siglas como LTDA e numerais romanos, como em \"Rua XV de Novembro\"."),
  ...fig(`${DIAG}/print_cnpj_cliente.png`, 1440, 900, "Cadastro de cliente preenchido a partir do CNPJ", 480),
  p("O mesmo acontece na criação de um escritório pela página pública, que preenche nome, telefone, e-mail, CEP, cidade, endereço e UF. Só os campos vazios são preenchidos, e um CNPJ não encontrado apenas gera um aviso, sem impedir o cadastro (RN37). Nas capturas desta revisão, a resposta do BrasilAPI foi simulada com dados fictícios; isso ilustra o preenchimento e não comprova disponibilidade ou situação cadastral de uma empresa real."),
  ...fig(`${DIAG}/print_cnpj_cadastro.png`, 1440, 900, "Criação de escritório preenchida a partir do CNPJ", 480),

  h2("6.29. Cadastro por Etapas e Conferência de Prazos"),
  p("A revisão de 27/10/2026 adotou divulgação progressiva: o cadastro público foi dividido em escritório, localização, administrador e revisão; voltar conserva os dados e a conta só é enviada após a confirmação final. A máscara e a API passaram a aceitar os 12 primeiros caracteres alfanuméricos e os dois últimos dígitos numéricos do CNPJ, sem descartar letras. Os registros numéricos anteriores continuam aceitos. Essa validação verifica a estrutura, não comprova inscrição ou situação cadastral na Receita Federal."),
  p("O menu lateral foi agrupado por tarefa e pode ser recolhido, com nomes acessíveis nos ícones. A densidade das listas é ajustável e apenas preferências visuais ficam salvas no aparelho. A ajuda contextual começa resumida, o checklist de um escritório já preenchido destaca o próximo passo e a busca global abre o registro selecionado. O indicador de atualização apresenta o horário da última consulta concluída e permite atualizar, em vez de afirmar sincronização em tempo real."),
  ...fig(`${DIAG}/print_evolucao_dashboard.png`, 1440, 900, "Painel com navegação agrupada e ajuda progressiva, sobre dados fictícios", 480),
  p("A conferência de intimação (RF53) é uma ação distinta de leitura. Administrador ou advogado informa a data conferida, descreve a verificação e confirma a leitura da publicação e do calendário aplicável. A API registra autor e horário, mantém o evento associado na mesma data e rejeita uma revisão enviada com prazo de referência desatualizado. Alterar a data diretamente na agenda invalida a conferência anterior. O cálculo automático continua sendo apoio, sem substituir a interpretação jurídica do profissional."),
  ...fig(`${DIAG}/print_evolucao_conferencia.png`, 1440, 900, "Conferência de prazo de publicação fictícia, distinta da marcação de leitura", 480),
];

// ============================================================
// 7. ARQUITETURA
// ============================================================
const arquitetura = [
  h1("7. Arquitetura do Sistema"),
  p("Esta seção apresenta a arquitetura do sistema, atualizada para refletir a stack tecnológica efetivamente utilizada no desenvolvimento."),

  h2("7.1. Diagrama de Contexto (C4 — Nível 1)"),
  p("Os atores do sistema são os usuários do escritório, em cinco perfis de acesso, e o Administrador do Sistema (desenvolvedor, via painel mestre); o cliente do escritório não acessa o sistema, mas recebe por WhatsApp as mensagens que os usuários preparam nele. O sistema integra-se com a API da OpenAI (assistente e resumo para o cliente), com um servidor de e-mail (lembretes e relatórios), com duas fontes públicas do CNJ — o DataJud, para andamentos, e o DJEN, para intimações —, com os serviços de notificação push dos navegadores, com os aplicativos de agenda, que assinam o calendário do escritório, e com o BrasilAPI e o ViaCEP, fontes públicas consultadas pelo navegador para preencher os dados da empresa pelo CNPJ e o endereço pelo CEP. A automação via n8n, prevista originalmente, permanece adiada."),
  ...fig(`${DIAG}/c4_contexto.png`, 1440, 587, "Diagrama de Contexto (C4 – Nível 1)", 480),

  h2("7.2. Diagrama de Containers (C4 — Nível 2)"),
  p("O frontend é desenvolvido em Next.js/React, em JavaScript (a proposta original previa TypeScript), e é instalável como aplicativo (PWA): um service worker garante a tela de indisponibilidade sem conexão e recebe as notificações push. O backend é uma API REST em Django e Django REST Framework (substituindo a proposta original de Node.js), autenticada via JWT, com documentação OpenAPI publicada em /api/docs. Rotinas agendadas, executadas como comandos do próprio Django, enviam os lembretes, sincronizam o DataJud e buscam as intimações do DJEN. O banco de dados é PostgreSQL, hospedado no Supabase (substituindo o MySQL local previsto originalmente)."),
  ...fig(`${DIAG}/c4_containers.png`, 1545, 567, "Figura 19 – Diagrama de Containers (C4 – Nível 2)", 480),

  h2("7.3. Diagrama de Componentes"),
  p("O backend recebe as requisições em views organizadas em um módulo por assunto — sessão, equipe, clientes, processos, intimações, agenda, financeiro, tarefas, entre outros —, que antes formavam um único arquivo de 3.700 linhas. Cada requisição passa pela checagem de permissões (uma matriz perfil × área × ação) e pelo escopo por escritório, que também aplica o segredo de justiça; os serializers validam a entrada; e as regras específicas de cada domínio ficam em serviços próprios — cálculo de prazos e feriados, DJEN, DataJud, PIX, calendário, resumo para o cliente, verificação em duas etapas, notificações push, planos e IA. Os modelos do Django ORM fazem a comunicação com o PostgreSQL. Os testes do backend seguem a mesma divisão por assunto."),
  ...fig(`${DIAG}/componentes.png`, 1521, 712, "Diagrama de Componentes – Backend (Django)", 480),

  h2("7.4. Integração Contínua e Qualidade"),
  p("O workflow inspecionado do GitHub Actions define trabalhos de backend, frontend, imagem Docker/HTTP da atividade de laboratório e ponta a ponta. Prevê banco efêmero, verificações Django, OpenAPI, lint, build e navegador com dados fictícios. O arquivo de CI já continha alterações locais antes desta auditoria; não se atribui a esta rodada sua autoria nem uma execução remota. As verificações relatadas a seguir foram executadas localmente. Não houve commit, push ou deploy das correções, e sucesso local não comprova proteção de branch ou saúde da versão publicada."),
  h2("7.5. Resultados da Auditoria Técnica"),
  p("A auditoria de 27/10/2026 examinou o repositório LexNexo na branch main, com base no commit 8b41a295e0d7be677600295eb56537bb2c0f871e e nas alterações locais de correção. Foram inventariados 27 modelos, 37 migrações, 13 páginas e 166 operações em 102 caminhos canônicos da API. A descoberta, a execução inicial, a reprodução dos defeitos, as correções e os retestes foram registrados em docs/testes. Os resultados se referem a esse estado local e não a uma versão comprovadamente implantada."),
  p("Na linha de base, passaram 519 testes Django, 268 Jest e 26 Playwright. Após as correções, a rodada final aprovou os 841 casos automatizados da tabela a seguir, sem falhas ou casos ignorados. A proteção de 155 operações contra acesso sem autenticação foi exercitada como subtestes de um método Django; esses subtestes não foram somados como casos adicionais."),
  new Table({
    width: { size: LARGURA_UTIL, type: WidthType.DXA },
    columnWidths: [3400, 1600, 1900, 2171],
    rows: [
      new TableRow({ tableHeader: true, children: ["Camada", "Casos", "Linhas", "Ramos"].map((t, i) => celula(t, { bold: true, shading: AZUL, color: "FFFFFF", width: [3400,1600,1900,2171][i] })) }),
      ...[
        ["Backend Django", "532", "91,47%", "79,04%"],
        ["Componentes Jest", "275", "35,55%", "31,85%"],
        ["Fluxos Playwright", "34", "Não medida", "Não medida"],
        ["Total de casos", "841", "Não se soma", "Não se soma"],
      ].map((r, n) => new TableRow({ cantSplit: true, children: r.map((t, i) => celula(t, { width: [3400,1600,1900,2171][i], center: i > 0, shading: n % 2 ? "F2F5FA" : "FFFFFF" })) })),
    ],
  }),
  p("Casos aprovados e cobertura da rodada final local. Fonte: evidências da auditoria, 2026.", { italics: true }),
  p("A cobertura do backend corresponde a 4.420 de 4.832 linhas do pacote advocacia, excluindo testes e migrações; core, configurações e armazenamento ficam fora desse denominador. A do frontend corresponde a 1.621 de 4.559 linhas JS/JSX de src, sem CSS e arquivos públicos. A cobertura do Playwright não foi adicionada à do Jest. O backend superou a referência de 80% de linhas; o frontend não atingiu a meta de 70%, devendo ampliar os cenários de componentes e estados da interface."),
  p("Passaram também lint sem avisos, build de produção, verificações Django, detecção de migrações pendentes e validação OpenAPI sem avisos. A checagem de configuração de produção simulada passou com o aviso de HSTS preload deliberadamente silenciado pela configuração existente. O ambiente local usou Python 3.14.7, Django 6.0.8, PostgreSQL 18.6, Node.js 22.23.2 e Next.js 16.4.2; o CI declara Python 3.12 e PostgreSQL 16, combinação cuja execução remota não foi verificada nesta rodada."),
  p("As correções abrangeram permissões de acesso a contratos e horas na ficha de processo; restrição dos destinos de notificações push a provedores permitidos, com revalidação, limite de espera e bloqueio de redirecionamentos; tratamento de chaves push e token mestre malformados; atomicidade ao alterar o escritório; filtros de identificadores e datas; validação de extensão, assinatura e tamanho de uploads em fluxos antes descobertos; e ajuste do código HTTP de logout no OpenAPI."),
  p("Na interface e nas regras de data, foram corrigidas disputas entre gravações de rascunho, preservando a digitação e aguardando gravações pendentes antes do descarte, além do uso indevido do dia UTC em datas locais. Formulários de credenciais passaram a declarar método POST, inclusive para a condição de JavaScript indisponível. A infraestrutura de testes recebeu ajustes de aliases, porta da API, carregamento de preferências e isolamento de rascunhos. Os defeitos e suas regressões estão identificados em docs/testes/DEFEITOS_E_RISCOS.md."),
  p("A análise de dependências distinguiu a resolução nova dos requisitos do ambiente Python instalado, que ainda continha versões antigas com alertas. Depois das atualizações e da revisão dos mínimos, pip-audit não apontou alertas nesse ambiente. No npm, a atualização do zod eliminou o alerta alto; a auditoria de produção ficou sem alertas e a auditoria completa manteve cinco pacotes de baixa gravidade na cadeia Jest/deepmerge, ligados a um alerta raiz. São resultados da data da execução e exigem monitoramento posterior."),
  p("Uma medição exploratória local, com 12 amostras por operação, encontrou medianas de 9,75 ms para clientes, 16,46 ms para processos com página de cinco itens, 18,10 ms para página de 25 itens, 47,49 ms para o painel e 12,07 ms para agenda. Foram observadas, respectivamente, 3, 4, 4, 24 e 3 consultas ao banco. Esses valores descrevem a massa sintética local; não constituem ensaio de carga nem medição da produção."),

  h2("7.6. Testes Práticos na Aplicação Publicada"),
  p("Com autorização do responsável pela conta e pelos avisos automáticos decorrentes das operações, foram executadas ações pela interface publicada com dados fictícios identificados como AUDITORIA TCC. Dos 22 casos práticos, 21 foram aprovados e um ficou bloqueado: o anexo foi cadastrado, mas a abertura ou o download não apresentou resultado observável no navegador integrado. A entrega das notificações aos destinatários não foi comprovada."),
  p("Foram mantidos 19 registros de negócio, conforme solicitado: dois clientes, dois processos, quatro eventos de agenda, duas tarefas, um contrato, três parcelas automáticas, um anexo, um apontamento de horas, uma despesa, uma movimentação e um modelo de documento. Os processos foram identificados como AUDITORIA-TCC-20261027-01 e AUDITORIA-TCC-20261027-02, o segundo em segredo de justiça. Nenhum registro criado foi excluído."),
  p("Os eventos compreenderam dois prazos, para 04/11/2026 às 18h e 12/11/2026 às 16h, e duas audiências, para 10/11/2026 às 14h30 e 18/11/2026 às 9h. O cálculo de cinco dias úteis a partir de 27/10 resultou em 04/11, considerando o feriado de 02/11. Os quatro eventos foram reencontrados após encerrar a sessão e entrar novamente. Um evento duplicado durante a disputa de rascunho foi editado para o segundo prazo planejado, preservando o registro."),
  p("O contrato fictício de R$ 120,00 gerou três parcelas de R$ 40,00; o apontamento de 90 minutos a R$ 200,00 por hora totalizou R$ 300,00; a despesa reembolsável foi de R$ 15,50. O preview do modelo substituiu as variáveis do cliente e do processo. A prática também evidenciou os problemas de rascunho e de data local, corrigidos e retestados apenas no código local, sem alterar retroativamente os registros publicados. O inventário e as evidências estão em docs/testes/TESTES_PRATICOS.md."),

  h2("7.7. Avaliação e Limitações"),
  p("O parecer é APTO COM RESSALVAS, no escopo local validado. Permanecem pendentes a cobertura mínima do frontend, a comprovação remota do CI e da versão publicada, as verificações administrativas de ACL/RLS e bucket do Supabase, backup e restauração, agendadores e entrega por provedores. Não foram feitas chamadas pagas de IA, testes de carga remotos ou confirmação de pagamento real. As correções permanecem locais, sem deploy."),
  p("A rodada local utilizou um PostgreSQL temporário separado da produção, dados de demonstração, navegador Chromium em perfis de computador e celular, testes Django e Jest. As chamadas externas de IA e de consulta cadastral são simuladas nos testes específicos. A massa de testes não contém informações de clientes reais. Os testes de navegação incluem compromisso para assistente, cadastro por etapas, busca que abre o registro, persistência da aparência e conferência de publicação fictícia."),
  p("As verificações automáticas de acessibilidade executam regras WCAG 2 A/AA do axe nas telas cobertas; não constituem certificação nem substituem inspeção por teclado e leitor de tela. Não foram realizados, nesta rodada, teste formal com três a cinco profissionais independentes, avaliação SUS, medição de ganho de produtividade, ensaio de carga representativo ou auditoria externa de segurança. Portanto, não se afirma eficácia comprovada no uso jurídico real, conformidade integral com a LGPD ou ausência de vulnerabilidades."),
  p("Para a avaliação com usuários, propõe-se observar cinco tarefas: cadastrar cliente, criar processo, lançar e conferir prazo, localizar documento e preparar mensagem ao cliente. Devem ser registrados tempo, erros, pedidos de ajuda e conclusão sem intervenção, com questionário SUS ao final. O teste deve usar dados fictícios e consentimento dos participantes; seus resultados só poderão ser apresentados depois da execução."),
  p("A minimização do contexto enviado à IA remove campos estruturados e padrões reconhecidos de identificação e contato, mas não garante anonimização semântica de texto livre. O usuário precisa revisar o conteúdo antes do envio. A anonimização de um cliente também limpa os campos pessoais conhecidos do histórico de alterações, preservando autoria, datas e mudanças não pessoais; a política de retenção precisa considerar os demais registros relacionados e as obrigações aplicáveis ao escritório."),
];

// ============================================================
// 8. TRABALHOS FUTUROS
// ============================================================
const trabalhosFuturos = [
  h1("8. Trabalhos Futuros"),
  p("Os itens a seguir foram identificados como relevantes para a evolução do sistema, mas não foram implementados no escopo atual deste TCC:"),
  bullet("Notificação automática ao cliente (WhatsApp/e-mail) a cada atualização de processo, via automação com n8n — adiada porque o ambiente de testes utiliza contatos fictícios, o que impede validar a integração de ponta a ponta; hoje a mensagem é preparada pelo sistema e enviada pelo advogado;"),
  bullet("Importação automática do calendário forense publicado por cada tribunal, hoje cadastrado manualmente pelo escritório na aba de feriados locais;"),
  bullet("Confirmação automática do pagamento por PIX, que exige o PIX dinâmico de uma conta com API de cobrança bancária — o PIX estático atual depende da baixa manual da parcela;"),
  bullet("Cobrança automática das assinaturas por um meio de pagamento online (cartão, boleto ou PIX recorrente), com troca de plano pelo próprio escritório — hoje a mudança de plano é feita pelo administrador da plataforma no painel mestre;"),
  bullet("Marcação da hora já faturada, distinguindo o tempo apontado do tempo efetivamente cobrado;"),
  bullet("Portal de acesso do próprio cliente, para que ele acompanhe o processo sem depender de mensagens;"),
  bullet("Fluxos configuráveis por tipo de processo e versionamento de documentos, com revisão e comparação antes da aprovação;"),
  bullet("Avaliação de usabilidade com profissionais independentes, leitor de tela e indicadores de desempenho e carga;"),
  bullet("Peticionamento e acesso autenticado ao PJe com certificado digital — o sistema já consulta as fontes públicas do DataJud e do DJEN;"),
  bullet("Assinatura eletrônica de documentos e contratos;"),
  bullet("Publicação nas lojas de aplicativos — hoje o sistema é instalável como aplicativo web e recebe notificações push."),
];

// ============================================================
// 9. CONCLUSÃO
// ============================================================
const conclusao = [
  h1("9. Conclusão"),
  p("O LexNexo reúne cadastros, processos, agenda, documentos, tarefas e controle financeiro em uma aplicação multi-escritório. A implementação final usa Next.js/React, Django REST Framework e PostgreSQL, substituindo escolhas da proposta inicial. As integrações públicas com DataJud, DJEN, BrasilAPI e ViaCEP reduzem tarefas de consulta e preenchimento; o assistente de IA e o resumo para o cliente apoiam a redação, mantendo a revisão humana."),
  p("A revisão do projeto mostrou que ampliar funcionalidades não é suficiente: também é necessário verificar se o comportamento corresponde ao que a interface promete. Foram encontrados e tratados problemas de renovação e revogação de sessão, indicadores financeiros, permissões, navegação e integração entre módulos. Os requisitos e o backlog passaram a compartilhar identificadores consistentes, diferenciando o que está implementado do que permanece adiado."),
  p("A rodada mais recente priorizou três aspectos: organização visual com menos informação simultânea, segurança de dados e conferência de ações sensíveis. O cadastro por etapas conserva valores e inclui revisão antes do envio; o menu agrupado e recolhível, a ajuda progressiva e a busca direta favorecem a orientação. O suporte ao CNPJ alfanumérico preserva a compatibilidade com registros anteriores. A conferência de intimações registra autor e horário e é invalidada quando o vencimento muda, sem confundir leitura com validação do prazo."),
  p("Na camada de privacidade, o contexto enviado à IA passou a minimizar informações pessoais estruturadas e padrões reconhecidos; o histórico de auditoria também foi considerado na anonimização de clientes. Essas medidas reduzem exposição, mas não eliminam o risco de dados sensíveis em texto livre nem equivalem a uma declaração de conformidade integral. O sistema não armazena respostas autenticadas da API para uso offline, evitando apresentar dados antigos como atuais."),
  p("A auditoria final aprovou 532 testes Django, 275 Jest e 34 Playwright, totalizando 841 casos automatizados, além de análise estática, build, validação OpenAPI e auditoria de dependências. A cobertura de linhas foi de 91,47% no escopo medido do backend e de 35,55% no frontend; este último permaneceu abaixo da meta de 70%. Na aplicação publicada, 21 verificações práticas foram aprovadas, uma ficou bloqueada e os 19 registros criados foram preservados. O parecer é apto com ressalvas no escopo local validado, sem publicação das correções. Os resultados e limitações estão descritos na seção 7. A evidência automatizada sustenta o comportamento dos cenários cobertos, mas não demonstra, por si só, ganho de produtividade ou usabilidade para todos os perfis."),
  p("O próximo passo de avaliação é realizar sessões observadas com profissionais de escritórios, usando dados fictícios, registrando erros, tempo, conclusão de tarefas e percepção de usabilidade. Portal do cliente, fluxos configuráveis, versionamento de documentos e integrações de cobrança permanecem evoluções propostas. A principal contribuição do trabalho é uma solução integrada com mecanismos verificáveis de controle e orientação, acompanhada da explicitação de seus limites e das condições para sua continuidade."),
];

// ============================================================
// 10. REFERÊNCIAS BIBLIOGRÁFICAS
// ============================================================
const referencias = [
  h1("10. Referências Bibliográficas"),
  p("DJANGO SOFTWARE FOUNDATION. Django Documentation. Disponível em: https://docs.djangoproject.com. Acesso em: 2026."),
  p("ENCODE. Django REST Framework Documentation. Disponível em: https://www.django-rest-framework.org. Acesso em: 2026."),
  p("VERCEL. Next.js Documentation. Disponível em: https://nextjs.org/docs. Acesso em: 2026."),
  p("SUPABASE. Supabase Documentation. Disponível em: https://supabase.com/docs. Acesso em: 2026."),
  p("OPENAI. OpenAI API Documentation. Disponível em: https://platform.openai.com/docs. Acesso em: 2026."),
  p("OSHEROVE, R. The Art of Unit Testing. 2. ed. Shelter Island: Manning, 2013."),
  p("PRESSMAN, R. S.; MAXIM, B. R. Engenharia de Software: uma abordagem profissional. 8. ed. Porto Alegre: AMGH, 2016."),
  p("BANCO CENTRAL DO BRASIL. Manual de Padrões para Iniciação do Pix. Brasília: BCB. Disponível em: https://www.bcb.gov.br/estabilidadefinanceira/pix. Acesso em: 2026."),
  p("BRASIL. Lei nº 11.419, de 19 de dezembro de 2006. Dispõe sobre a informatização do processo judicial. Diário Oficial da União, Brasília, 2006."),
  p("BRASIL. Lei nº 13.105, de 16 de março de 2015. Código de Processo Civil. Diário Oficial da União, Brasília, 2015."),
  p("BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). Diário Oficial da União, Brasília, 2018."),
  p("CONSELHO NACIONAL DE JUSTIÇA. Resolução nº 455, de 27 de abril de 2022. Institui o Portal de Serviços do Poder Judiciário e o Diário de Justiça Eletrônico Nacional (DJEN). Brasília: CNJ, 2022."),
  p("CONSELHO NACIONAL DE JUSTIÇA. Resolução nº 331, de 20 de agosto de 2020. Institui a Base Nacional de Dados do Poder Judiciário (DataJud). Brasília: CNJ, 2020."),
  p("DESRUISSEAUX, B. RFC 5545: Internet Calendaring and Scheduling Core Object Specification (iCalendar). IETF, 2009."),
  p("M'RAIHI, D. et al. RFC 6238: TOTP — Time-Based One-Time Password Algorithm. IETF, 2011."),
  p("THOMSON, M. RFC 8291: Message Encryption for Web Push. IETF, 2017."),
  p("THOMSON, M.; BEVERLOO, P. RFC 8292: Voluntary Application Server Identification (VAPID) for Web Push. IETF, 2017."),
  p("W3C. Web Content Accessibility Guidelines (WCAG) 2.1. 2018. Disponível em: https://www.w3.org/TR/WCAG21/. Acesso em: 2026."),
  p("OPENAPI INITIATIVE. OpenAPI Specification 3.0. Disponível em: https://spec.openapis.org/oas/v3.0.3. Acesso em: 2026."),
  p("MICROSOFT. Playwright Documentation. Disponível em: https://playwright.dev. Acesso em: 2026."),
  p("BRASILAPI. BrasilAPI: vamos transformar o Brasil em uma API. Disponível em: https://brasilapi.com.br/docs. Acesso em: 2026."),
  p("RECEITA FEDERAL DO BRASIL. Dados Abertos do CNPJ. Disponível em: https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj. Acesso em: 2026."),
  p("RECEITA FEDERAL DO BRASIL. CNPJ Alfanumérico. Disponível em: https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico. Acesso em: 27 out. 2026."),
];

module.exports = {
  capa, resumo, sumario, introducao, modelagemNegocio, requisitos, modelagemSistemas,
  modelagemDados, prototipos, arquitetura, trabalhosFuturos, conclusao, referencias,
};

module.exports.TITULOS_SUMARIO = TITULOS_SUMARIO;
