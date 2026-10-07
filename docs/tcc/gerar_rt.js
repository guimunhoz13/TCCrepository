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
  p("O presente trabalho apresenta o desenvolvimento de uma aplicação web para o gerenciamento de escritórios de advocacia, com isolamento completo de dados entre escritórios (arquitetura multi-tenant). O sistema centraliza clientes, processos, prazos e compromissos, tarefas, contratos e honorários, horas e despesas, relatórios e a comunicação com o cliente por e-mail e WhatsApp, além de um assistente de inteligência artificial que responde com base apenas nos dados do próprio escritório. Na etapa mais recente, o acesso passou a ser controlado por perfis (administrador, advogado, estagiário, financeiro e secretária), processos em segredo de justiça ficaram restritos ao administrador e ao advogado responsável, o login ganhou verificação em duas etapas e foram implementados os direitos do titular previstos na Lei Geral de Proteção de Dados (consentimento, portabilidade e anonimização). O sistema passou a importar as intimações publicadas no Diário de Justiça Eletrônico Nacional (DJEN), calculando o prazo em dias úteis forenses e lançando-o na agenda; a gerar cobranças por PIX para cada parcela de honorários; a redigir, com apoio da IA, atualizações do andamento em linguagem simples para o cliente; a enviar notificações push ao celular; e a exportar a agenda para aplicativos de calendário. O funcionamento é verificado por testes automatizados em três níveis — API, componentes de interface e ponta a ponta, este último com checagem de acessibilidade —, executados a cada alteração em integração contínua, e a API é documentada no padrão OpenAPI. Ao longo do desenvolvimento, o backend foi migrado de Node.js para Python com Django e o banco de dados de MySQL para PostgreSQL (Supabase); a automação de notificações via n8n, prevista originalmente, foi adiada."),
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
  ["7. Arquitetura do Sistema", 1],
  ["7.1. Diagrama de Contexto (C4 — Nível 1)", 2],
  ["7.2. Diagrama de Containers (C4 — Nível 2)", 2],
  ["7.3. Diagrama de Componentes", 2],
  ["7.4. Integração Contínua e Qualidade", 2],
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
  p("A solução é uma aplicação web (LexOffice) que permite a um escritório de advocacia cadastrar seus advogados, clientes e processos, controlar prazos e compromissos em uma agenda, registrar contratos e honorários com controle de pagamento, gerar relatórios e contatar clientes por e-mail ou WhatsApp. Um assistente de inteligência artificial auxilia o usuário com respostas baseadas exclusivamente nos dados do próprio escritório. A plataforma é multi-tenant: múltiplos escritórios utilizam o mesmo sistema, com seus dados completamente isolados uns dos outros, e um painel administrativo separado permite ao desenvolvedor da plataforma gerenciar os escritórios cadastrados."),

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
  bullet("Comprovar o funcionamento com testes automatizados de API, de componentes e de ponta a ponta, executados em integração contínua, e documentar a API no padrão OpenAPI."),

  h2("1.4. Escopo do Sistema"),
  p("O sistema permite o cadastro e login da equipe do escritório, com perfis de acesso distintos; o cadastro e a gestão de clientes e processos, incluindo processos em segredo de justiça; o controle de agenda (compromissos e prazos), de tarefas e de horas e despesas; o controle de contratos e honorários com parcelamento e cobrança por PIX; a importação de andamentos (DataJud) e de intimações (DJEN); a geração e o envio de relatórios; um assistente de inteligência artificial; notificações por e-mail e push; e um painel administrativo restrito ao desenvolvedor da plataforma para gerenciar os escritórios cadastrados."),
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
  p("Na etapa final, a verificação passou a ser contínua: a cada alteração enviada ao repositório, um fluxo de integração contínua (GitHub Actions) executa os testes da API (423 testes em Django, sobre um banco PostgreSQL efêmero), os testes de componentes da interface (193 testes em Jest e Testing Library), a análise estática do código, o build de produção, a validação da documentação OpenAPI e os testes de ponta a ponta (11 cenários em Playwright, com um navegador de verdade usando o sistema sobre um escritório de demonstração e checagem automática de acessibilidade WCAG 2 AA). Uma alteração só é incorporada à versão principal quando todas essas etapas passam."),
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
      bmcCell("Relacionamento e Canais", ["Suporte direto do desenvolvedor via painel mestre", "Autoatendimento pelos usuários do escritório", "Aplicação web responsiva, com acesso remoto"]),
      bmcCell("Segmentos de Clientes", ["Escritórios de advocacia de pequeno e médio porte"]),
    ] }),
    new TableRow({ children: [
      bmcCell("Estrutura de Custos", ["Hospedagem do banco de dados (Supabase)", "Uso da API da OpenAI", "Manutenção e evolução do sistema"], { width: 5610, columnSpan: 3 }),
      bmcCell("Fontes de Receita", ["Planos de assinatura por escritório (gratuito, básico, profissional)"], { width: 3740, columnSpan: 2 }),
    ] }),
  ],
});

const backlogHeaders = ["ID", "Requisito", "Prioridade", "Estim. (h)", "Status"];
const backlogWidths = [700, 4200, 1300, 1300, 1550];
const backlogRows = [
  ["RF01", "Cadastro e login de usuário, com bloqueio após tentativas inválidas", "Alta", "5", "Concluído"],
  ["RF02", "Validação de formulários (e-mail, CPF/CNPJ, telefone, OAB, senha forte)", "Alta", "6", "Concluído"],
  ["RF03", "Controle de prazos e compromissos (agenda)", "Alta", "8", "Concluído"],
  ["RF04", "Geração de relatórios (PDF, e-mail)", "Média", "4", "Concluído"],
  ["RF05", "Envio de notificação automática (WhatsApp/e-mail a cada atualização)", "Alta", "15", "Adiado"],
  ["RF06", "Cadastro e listagem de processos", "Alta", "15", "Concluído"],
  ["RF07", "Listagem de clientes", "Alta", "8", "Concluído"],
  ["RF08", "Filtro e busca (clientes, processos, agenda)", "Baixa", "6", "Concluído"],
  ["RF09", "Controle de contratos e honorários, com parcelamento", "Alta", "12", "Concluído"],
  ["RF10", "Sistema de permissões por tipo de usuário", "Alta", "3", "Concluído"],
  ["RF11", "Assistente de inteligência artificial (IA)", "Média", "10", "Concluído"],
  ["RF12", "Painel administrativo da plataforma (painel mestre)", "Alta", "14", "Concluído"],
  ["RF13", "Upload e organização de documentos do processo", "Média", "6", "Concluído"],
  ["RF14", "Envio de contato ao cliente via WhatsApp", "Baixa", "3", "Concluído"],
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
  p("O backlog abaixo consolida os requisitos funcionais priorizados ao longo do projeto, com sua estimativa de horas e o status atual de implementação. A maior parte dos itens planejados foi concluída; o único item adiado (RF05, notificação automática) está detalhado na seção 8 — Trabalhos Futuros."),
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
  bullet("RF22 – Cálculo automático da data final de um prazo processual, em dias úteis (pulando fins de semana e feriados nacionais) ou em dias corridos;"),
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
  bullet("RF48 – Notificações push no celular e no navegador para intimação nova, tarefa atribuída e lembretes de prazo e audiência, mesmo com o sistema fechado."),

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
  bullet("RNF16 – Os dados pessoais enviados a serviços externos devem ser os mínimos necessários (LGPD, art. 6º, III): a IA recebe o primeiro nome do cliente e os andamentos do processo, nunca CPF, endereço ou contato;"),
  bullet("RNF17 – As notificações push devem ser cifradas de ponta a ponta para o aparelho de destino (RFC 8291) e assinadas pelo servidor (VAPID, RFC 8292); sem as chaves configuradas, o recurso fica desligado sem afetar o restante do sistema;"),
  bullet("RNF18 – A API deve ser documentada no padrão OpenAPI 3, com o esquema gerado a partir do próprio código e validado automaticamente, de modo que a documentação não se desatualize em relação às rotas;"),
  bullet("RNF19 – Cada alteração deve passar, em integração contínua, por testes automatizados em três níveis — API, componentes de interface e ponta a ponta — e por uma checagem automática de acessibilidade WCAG 2 AA das telas principais;"),
  bullet("RNF20 – O código do backend deve ser organizado por domínio (um módulo de views e um de testes por assunto), para que uma alteração em uma área não exija percorrer arquivos de milhares de linhas."),

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
  p("A contagem de um prazo em dias úteis deve considerar como não úteis os sábados, domingos e feriados nacionais — incluindo os feriados móveis calculados a partir da data da Páscoa (Carnaval, Sexta-feira Santa e Corpus Christi). Alternativamente, o sistema também permite a contagem em dias corridos, para prazos de natureza contratual ou de direito material."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN15 – Honorários de Sucumbência", bold: true, size: 22 })] }),
  p("O valor estimado de honorários de sucumbência é calculado multiplicando o valor da causa pelo percentual fixado pelo juízo. O sistema não determina esse percentual automaticamente — ele é definido por decisão judicial e apenas informado manualmente pelo usuário."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN16 – Envio de Lembretes", bold: true, size: 22 })] }),
  p("Um mesmo lembrete nunca deve ser enviado duas vezes ao mesmo usuário, ainda que a rotina de envio seja executada mais de uma vez no mesmo dia. O registro do envio é gravado antes do disparo, para que duas execuções simultâneas não dupliquem o aviso, e é desfeito caso o envio falhe, para que uma indisponibilidade do servidor de e-mail não faça o lembrete ser perdido em silêncio. O resumo semanal é enviado às segundas-feiras, apenas aos usuários que o habilitaram."),
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
  p("A intimação considera-se publicada no primeiro dia útil seguinte ao da disponibilização no Diário (Lei 11.419/2006, art. 4º, § 3º), e a contagem começa no primeiro dia útil seguinte ao da publicação (art. 4º, § 4º; CPC, art. 224, § 3º). Em dias úteis, não contam sábados, domingos, feriados nacionais nem o recesso de 20 de dezembro a 20 de janeiro (CPC, arts. 219 e 220), e o prazo que termina em dia sem expediente passa para o próximo dia útil (CPC, art. 224, § 1º). O número de dias é lido do texto da intimação; sem prazo expresso, adota-se o de 5 dias úteis (CPC, art. 218, § 3º), marcado como estimado para conferência. Uma mesma comunicação nunca é importada duas vezes. Feriados estaduais e municipais não entram no cálculo, o que é informado na tela."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN31 – Cobrança por PIX", bold: true, size: 22 })] }),
  p("O código PIX é um BR Code estático, no padrão do Banco Central, com a chave do escritório, o valor exato da parcela e um identificador da parcela. Parcela já paga não gera PIX. A chave cadastrada é apenas ajustada ao formato exigido, sem validação de dígito de CPF ou CNPJ — a existência da chave é verificada pelo banco no pagamento. Por ser estático, o PIX não confirma o pagamento sozinho: a baixa da parcela continua sendo registrada pelo escritório."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN32 – Assinatura da Agenda", bold: true, size: 22 })] }),
  p("O link de assinatura contém um identificador aleatório de 256 bits e é pessoal. Gerar um novo link invalida o anterior, e o link deixa de responder se a conta ou o escritório forem desativados ou se o perfil perder o acesso à agenda. O calendário segue as mesmas regras da tela, inclusive o segredo de justiça, traz os eventos a partir do último mês e inclui aviso na véspera dos prazos — e também dois dias antes, nos prazos fatais."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN33 – Atualização do Cliente", bold: true, size: 22 })] }),
  p("A mensagem ao cliente nunca é enviada automaticamente: o advogado a revisa e pode editá-la antes de abri-la no WhatsApp. A IA só é usada quando o perfil tem acesso a ela e o servidor está configurado; caso contrário, ou se a IA falhar, um modelo automático traduz os termos processuais mais comuns para linguagem simples."),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "RN34 – Notificações Push", bold: true, size: 22 })] }),
  p("Cada aparelho se inscreve separadamente e pode ser desligado a qualquer momento. As notificações seguem as mesmas preferências dos avisos por e-mail. Uma inscrição que o serviço de push informa como expirada é removida, e a falha no envio de uma notificação nunca interrompe a operação que a originou."),
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
  ...fig(`${DIAG}/casos_de_uso.png`, 1015, 2001, "Figura 1 – Diagrama de Casos de Uso", 480),

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
  ...fig(`${DIAG}/classes.png`, 3210, 2267, "Figura 2 – Diagrama de Classes", 470),

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
  p("A tabela registro_auditoria implementa a trilha de auditoria (RF18/RN10): cada linha representa um evento de login ou uma operação de criação, edição ou exclusão, associada opcionalmente a um escritório, um usuário ou um administrador do sistema (superadmin), conforme quem a originou. A tabela token_redefinicao_senha suporta o fluxo de redefinição de senha (RF19/RN11), e a tabela token_verificacao_email suporta a confirmação de e-mail no auto-cadastro (RF20/RN12) — ambas armazenam um token de uso único com prazo de expiração para o usuário que o solicitou. A tabela usuario passou a registrar se o e-mail já foi confirmado (email_verificado). A tabela movimentacao passou a registrar também o usuário responsável (criado_por_id), permitindo saber quem lançou cada andamento do processo. A tabela processo ganhou colunas para os dados jurídicos complementares (área do direito, vara, comarca, valor da causa, parte contrária, advogado adverso e percentual de honorários de sucumbência — RF23/RF24), e a tabela agenda ganhou a coluna prioridade, para distinguir um prazo fatal de um evento comum. A revisão seguinte acrescentou as tabelas apontamento_hora (tempo trabalhado por processo, em minutos inteiros para evitar o arredondamento de horas decimais), despesa (custas e despesas processuais, com comprovante e controle de reembolso), sessao_uso (janelas de uso do sistema por usuário), notificacao_enviada (controle de idempotência dos lembretes) e modelo_documento (modelos preenchíveis do escritório). A tabela movimentacao ganhou as colunas origem e identificador_externo, que permitem importar andamentos do DataJud sem duplicar, e a coluna data_movimentacao deixou de ser preenchida automaticamente na inserção para poder receber a data informada pelo tribunal. A tabela processo passou a registrar a data da última sincronização com o DataJud, e a tabela advogado, o valor-hora padrão usado no apontamento de horas."),
  p("A revisão final acrescentou a tabela tarefa, que representa o trabalho interno do escritório — levantar jurisprudência, revisar uma minuta, entrar em contato com uma testemunha. Ela se distingue da tabela agenda por dois aspectos: não tem hora marcada e tem um responsável obrigatório, registrado em responsavel_id. O vínculo com o processo é opcional, porque nem todo trabalho do escritório nasce de um processo, e as colunas status, prioridade, prazo e concluida_em sustentam o acompanhamento (RF34/RN24). A tabela preferencias_usuario ganhou a coluna de aviso de tarefa atribuída, e a tabela processo já registrava a data da última sincronização com o DataJud, utilizada agora para ordenar a fila da rotina automática (RF31/RN21)."),
  p("Na etapa final, a tabela usuario ganhou as colunas da verificação em duas etapas — o segredo do autenticador (totp_segredo), o indicador de ativação (totp_ativo) e o último intervalo de tempo aceito (totp_ultimo_passo), que impede o reuso de um mesmo código — e o identificador do link de assinatura da agenda (agenda_feed_token); o perfil de acesso continua no campo tipo_usuario, que passou a admitir também estagiário, financeiro e secretária. A tabela cliente passou a registrar o consentimento LGPD e a data em que foi dado, além da data de anonimização; a tabela processo, o indicador sigiloso. Foram criadas as tabelas intimacao, com a comunicação do DJEN, o processo e o advogado a que se refere, as datas de disponibilização e publicação, o prazo calculado e o evento de agenda gerado — com unicidade por escritório e identificador externo, para que a mesma comunicação nunca seja importada duas vezes —, e inscricao_push, com o endereço e as chaves de cada aparelho inscrito. A tabela configuracao_escritorio passou a guardar a chave PIX, o nome do recebedor e a cidade usados no código de cobrança."),
  ...fig(`${DIAG}/er.png`, 2537, 2316, "Figura 4 – Diagrama de Banco de Dados (Modelo Entidade-Relacionamento)", 470),
];

// ============================================================
// 6. PROTÓTIPOS
// ============================================================
const prototipos = [
  h1("6. Protótipos das Funcionalidades Principais"),
  p("Diferentemente da versão anterior deste relatório — que apresentava mockups de uma \"Área do Cliente\" hoje fora do escopo do projeto, já que o cliente não possui acesso próprio ao sistema —, esta seção apresenta capturas de tela reais da aplicação em funcionamento, com dados de demonstração."),
  p("As capturas foram refeitas após uma revisão de identidade visual da interface, na qual o sistema recebeu uma marca própria (em substituição a um ícone de biblioteca), a cor de destaque passou a sinalizar exclusivamente as ações primárias — e não mais elementos informativos —, os selos de situação passaram a diferenciar cada estado por cor, e as ações repetidas nas listagens foram convertidas em botões de ícone, reduzindo o peso visual da coluna de ações diante dos dados de cada registro."),
  p("As telas de login e do painel inicial, assim como as das seções 6.14 a 6.25, foram capturadas sobre o escritório de demonstração criado pelo comando popular_demo, que monta um escritório completo — um usuário de cada perfil, clientes, processos (um deles em segredo de justiça), andamentos, agenda, tarefas, contrato com parcelas e chave PIX — e é o mesmo usado pelos testes de ponta a ponta."),

  h2("6.1. Tela de Login"),
  p("Layout em dois painéis: à esquerda, a apresentação do produto; à direita, o formulário de acesso (e-mail e senha). Após 3 tentativas de senha inválidas, o acesso é bloqueado por 15 minutos (RN01)."),
  ...fig(`${DIAG}/print_login.png`, 1440, 900, "Figura 5 – Tela de login", 480),

  h2("6.2. Painel do Escritório (Dashboard)"),
  p("Visão geral do escritório autenticado, reorganizada para responder primeiro ao que exige ação: os prazos que estão vencendo e as tarefas da pessoa logada aparecem no topo, seguidos dos indicadores de clientes, processos, audiências e documentos, do financeiro do escritório e dos gráficos. A tela foi verificada automaticamente quanto às regras de acessibilidade WCAG 2 AA, sem violações. Os blocos exibidos dependem do perfil: o financeiro, por exemplo, não aparece para estagiários e secretárias."),
  ...fig(`${DIAG}/print_dashboard.png`, 1440, 900, "Figura 6 – Painel do escritório (dashboard)", 480),

  h2("6.3. Contratos e Honorários"),
  p("Listagem de contratos vinculados a processos, com valores totais, pago e pendente calculados automaticamente a partir das parcelas geradas."),
  ...fig(`${DIAG}/print_contratos.png`, 1440, 300, "Figura 7 – Painel de Contratos e Honorários", 480),

  h2("6.4. Painel Mestre (Administrador do Sistema)"),
  p("Painel restrito ao desenvolvedor da plataforma, com autenticação própria, permitindo consultar e gerenciar todos os escritórios cadastrados sem acesso aos dados de clientes ou processos de nenhum deles."),
  ...fig(`${DIAG}/print_master.png`, 1440, 400, "Figura 8 – Painel Mestre", 480),

  h2("6.5. Registro de Auditoria"),
  p("Nova aba nas Configurações do escritório, visível apenas ao administrador (RF18/RN10), listando os eventos de login e de criação, edição e exclusão de registros, com data/hora, usuário responsável e descrição. O painel mestre possui uma seção equivalente, com visão consolidada de todos os escritórios da plataforma."),
  ...fig(`${DIAG}/print_auditoria.png`, 1440, 900, "Figura 9 – Registro de Auditoria", 480),

  h2("6.6. Cálculo de Prazo em Dias Úteis"),
  p("Ao cadastrar um evento do tipo prazo na agenda, uma calculadora opcional permite informar a data de início da contagem e a quantidade de dias, e preenche automaticamente a data final (RF22), contando em dias úteis — pulando fins de semana e feriados nacionais, inclusive os móveis, calculados a partir da Páscoa — ou em dias corridos, conforme a natureza do prazo."),
  ...fig(`${DIAG}/print_prazo.png`, 1440, 900, "Figura 10 – Calculadora de Prazo em Dias Úteis", 480),

  h2("6.7. Horas Trabalhadas e Despesas Processuais"),
  p("O contrato já previa o honorário por hora trabalhada, mas não havia onde registrar as horas. O painel de Horas e Custos passou a concentrar três controles: o apontamento das horas por processo (RF26), com distinção entre o que é faturável e o que não é (RN17); o lançamento das custas e despesas processuais, separando o que é reembolsável pelo cliente do que já foi reembolsado (RF27/RN18); e o tempo de uso do sistema por usuário (RF28). Os totais de horas lançadas, de valor faturável e de despesas a reembolsar são apresentados acima de cada listagem."),
  ...fig(`${DIAG}/print_horas.png`, 1440, 500, "Figura 11 – Apontamento de horas trabalhadas", 480),

  h2("6.8. Consulta Processual no DataJud"),
  p("A partir do número unificado do processo, o sistema identifica o tribunal competente pelos dígitos de segmento e tribunal previstos na Resolução CNJ 65/2008 e consulta a API pública do DataJud (Resolução CNJ 331/2020), importando as movimentações ainda não registradas (RF29). Consultas repetidas trazem apenas o que é novo, porque cada movimentação é identificada pelo código em conjunto com a data e hora informadas pelo tribunal (RN19). Cabe registrar o limite da fonte: o DataJud disponibiliza a capa e as movimentações do processo, e não o texto das publicações do Diário da Justiça — lacuna tratada pela importação de intimações do DJEN, descrita na seção 6.18."),
  ...fig(`${DIAG}/print_datajud.png`, 1440, 400, "Figura 12 – Retorno da consulta ao DataJud", 480),

  h2("6.9. Modelos de Documento"),
  p("O escritório cadastra uma vez o texto de uma procuração, contrato ou declaração, marcando com variáveis os pontos em que os dados devem entrar, e o sistema os preenche a partir do cadastro do cliente, do processo e do próprio escritório (RF30). As variáveis são resolvidas a partir de um catálogo fechado (RN20/RNF10), e o sistema distingue, ao gerar, a variável inexistente daquela cujo cadastro está em branco. O recurso aproveita campos do cliente que já eram coletados e pouco utilizados — RG, estado civil e nacionalidade —, exatamente os exigidos em uma procuração."),
  ...fig(`${DIAG}/print_modelos.png`, 1440, 640, "Figura 13 – Procuração gerada a partir de um modelo", 480),

  h2("6.10. Indicadores Financeiros do Escritório"),
  p("O painel inicial apresentava apenas contagens — clientes, processos, audiências e documentos — sem nenhum valor monetário, embora contratos, parcelas, horas e despesas já estivessem registrados no banco. Para saber quanto havia a receber era preciso abrir contrato por contrato. A faixa de indicadores (RF33) responde essa pergunta na abertura do sistema: valor a receber, recebido no mês corrente, valor vencido com a quantidade de parcelas em atraso, horas faturáveis apontadas no mês e despesas adiantadas pelo escritório ainda não cobradas. O cartão de valor vencido é destacado quando há parcela em atraso, apurada pela comparação entre o vencimento e a data da consulta (RN23)."),
  ...fig(`${DIAG}/print_financeiro.png`, 1092, 263, "Figura 14 – Indicadores financeiros do escritório", 480),

  h2("6.11. Tarefas do Escritório"),
  p("A agenda registra o que tem hora marcada — audiência, prazo, reunião. O trabalho interno do escritório não tinha onde ser registrado nem a quem ser atribuído. O painel de Tarefas (RF34) trata dessa unidade de trabalho: cada tarefa tem um responsável, que é avisado por e-mail ao recebê-la, além de prioridade, prazo opcional e vínculo opcional a um processo. As abas separam o que está em aberto para o usuário, o que está em aberto para o escritório e o histórico completo. A ordenação segue situação, prioridade e proximidade do prazo (RN24)."),
  ...fig(`${DIAG}/print_tarefas.png`, 1440, 900, "Figura 15 – Painel de tarefas do escritório", 480),

  h2("6.12. Busca Global"),
  p("A busca do topo alcançava três das oito áreas do sistema. Ampliada (RF37), ela passou a consultar também tarefas, eventos de agenda, contratos, horas apontadas e modelos de documento, agrupando os resultados por área. Digitar o número de um processo reúne, em uma única lista, o processo e tudo o que está vinculado a ele."),
  ...fig(`${DIAG}/print_busca.png`, 640, 520, "Figura 16 – Busca global agrupada por área", 330),

  h2("6.13. Central de Ajuda"),
  p("O sistema reúne catorze áreas e não trazia nenhuma explicação sobre o próprio funcionamento. A central de ajuda (RF36) é acessível de qualquer tela e abre no assunto correspondente à área em uso: quem a aciona de dentro do painel de tarefas encontra a explicação de tarefas, e não uma visão geral. A busca interna distingue duas intenções — procurar pelo nome de um assunto devolve o assunto inteiro, procurar por um detalhe devolve apenas os tópicos que tratam dele."),
  ...fig(`${DIAG}/print_ajuda.png`, 960, 680, "Figura 17 – Central de ajuda aberta no assunto em uso", 400),

  h2("6.14. Perfis de Acesso e Equipe"),
  p("Em Configurações › Escritório, o administrador vê a equipe com o perfil de cada pessoa, troca o perfil pela própria lista e inclui membros que não são advogados — estagiário, financeiro, secretária ou outro administrador —, com a descrição do que cada perfil pode fazer (RF38/RF39). As permissões são aplicadas pela API e a interface apenas deixa de mostrar o que seria recusado (RNF15): o menu, os atalhos, os botões de cada lista e os blocos do painel acompanham o perfil. Na segunda figura, o mesmo painel de processos visto por um estagiário: sem o processo sigiloso, sem o botão de exclusão e sem o item Contratos no menu."),
  ...fig(`${DIAG}/print_equipe.png`, 1440, 900, "Equipe e perfis de acesso do escritório", 480),
  ...fig(`${DIAG}/print_perfil_estagiario.png`, 1440, 900, "Painel de processos visto pelo perfil Estagiário", 480),

  h2("6.15. Processo em Segredo de Justiça"),
  p("Um processo marcado como segredo de justiça recebe um selo na listagem e na ficha e passa a ser visto apenas pelo administrador e pelo advogado responsável (RF40/RN27). Para os demais, ele e tudo o que dele depende desaparecem de listas, buscas, relatórios, calendário, intimações e do contexto enviado à IA."),
  ...fig(`${DIAG}/print_sigilo.png`, 1440, 900, "Processo em segredo de justiça, visto pelo administrador", 480),

  h2("6.16. Verificação em Duas Etapas"),
  p("Em Configurações › Conta, cada pessoa pode ativar a verificação em duas etapas lendo o QR code com um aplicativo autenticador (Google Authenticator, Microsoft Authenticator, Authy) ou digitando a chave exibida, e confirmando com o primeiro código gerado (RF41). A partir daí, o login pede o código de 6 dígitos depois da senha (RN28). Quem perde o celular tem a verificação redefinida pelo administrador."),
  ...fig(`${DIAG}/print_2fa.png`, 1440, 900, "Ativação da verificação em duas etapas", 480),
  ...fig(`${DIAG}/print_login_2fa.png`, 390, 844, "Segunda etapa do login, no celular", 200),

  h2("6.17. Direitos do Titular (LGPD)"),
  p("O cadastro do cliente registra se ele autorizou o tratamento dos dados pessoais e a data em que o consentimento foi registrado. Na listagem, os perfis autorizados encontram duas ações por cliente: exportar os dados do titular em formato estruturado e anonimizar o cadastro, esta precedida de uma confirmação que explica que a operação é irreversível e que os processos são mantidos (RF42/RN29)."),
  ...fig(`${DIAG}/print_lgpd.png`, 1440, 900, "Clientes, com as ações de exportação e anonimização", 480),

  h2("6.18. Intimações do DJEN"),
  p("A aba Intimações do painel de processos reúne as comunicações publicadas no Diário de Justiça Eletrônico Nacional em nome dos advogados do escritório (RF47). Cada intimação mostra o tribunal, o órgão, o processo — com atalho para a ficha, quando cadastrado —, a data de publicação e o prazo calculado, destacado como estimado quando o texto não traz o número de dias (RN30). O texto pode ser lido por inteiro e a intimação, marcada como lida; o prazo já está na agenda. A captura foi feita contra um servidor que reproduz o formato de resposta da consulta pública do DJEN, já que o ambiente de desenvolvimento não alcança o serviço do CNJ."),
  ...fig(`${DIAG}/print_intimacoes.png`, 1440, 900, "Intimações importadas do DJEN com o prazo calculado", 480),

  h2("6.19. Cobrança por PIX"),
  p("Com a chave PIX do escritório cadastrada, cada parcela pendente ganha o botão Cobrar com PIX, que abre o QR code e o código copia e cola com o valor exato da parcela, além do envio pronto pelo WhatsApp com valor, vencimento e código (RF45/RN31). O código segue o padrão BR Code do Banco Central e foi conferido contra o exemplo do manual oficial nos testes automatizados."),
  ...fig(`${DIAG}/print_pix.png`, 1440, 900, "PIX de uma parcela de honorários", 480),

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
  p("Em Configurações › Notificações, cada aparelho pode ser inscrito para receber avisos na hora, mesmo com o sistema fechado: intimação nova, tarefa atribuída e lembretes de prazo e audiência (RF48). As mensagens são cifradas para o aparelho de destino (RNF17); no iPhone, o recurso exige o sistema instalado na tela de início."),
  ...fig(`${DIAG}/print_push.png`, 1440, 900, "Ativação das notificações push", 480),

  h2("6.24. Documentação da API"),
  p("A API passou a ter documentação interativa no padrão OpenAPI 3, gerada a partir das próprias views e serializers e publicada em /api/docs (RNF18). As rotas são agrupadas por assunto, com a explicação da autenticação, do escopo por escritório e dos perfis de acesso, e podem ser chamadas pela própria página após informar o token de acesso. A integração contínua valida o esquema a cada alteração e falha se alguma rota ficar sem documentação."),
  ...fig(`${DIAG}/print_swagger.png`, 1440, 900, "Documentação interativa da API (Swagger UI)", 480),

  h2("6.25. Testes de Ponta a Ponta"),
  p("Os testes de ponta a ponta usam o sistema como uma pessoa usaria, em um navegador de verdade, sobre o escritório de demonstração: login com senha errada e certa, cadastro de cliente, ficha do processo e mensagem ao cliente, perfis de acesso e sigilo, quadro de tarefas, PIX, exportação da agenda e uso no celular, além da checagem automática de acessibilidade WCAG 2 AA no login e no painel. Eles rodam na integração contínua a cada alteração, junto com os 423 testes da API e os 193 testes de componentes (RNF19)."),
  ...fig(`${DIAG}/print_e2e.png`, 1000, 820, "Relatório dos testes de ponta a ponta (Playwright)", 420),
];

// ============================================================
// 7. ARQUITETURA
// ============================================================
const arquitetura = [
  h1("7. Arquitetura do Sistema"),
  p("Esta seção apresenta a arquitetura do sistema, atualizada para refletir a stack tecnológica efetivamente utilizada no desenvolvimento."),

  h2("7.1. Diagrama de Contexto (C4 — Nível 1)"),
  p("Os atores do sistema são os usuários do escritório, em cinco perfis de acesso, e o Administrador do Sistema (desenvolvedor, via painel mestre); o cliente do escritório não acessa o sistema, mas recebe por WhatsApp as mensagens que os usuários preparam nele. O sistema integra-se com a API da OpenAI (assistente e resumo para o cliente), com um servidor de e-mail (lembretes e relatórios), com duas fontes públicas do CNJ — o DataJud, para andamentos, e o DJEN, para intimações —, com os serviços de notificação push dos navegadores e com os aplicativos de agenda, que assinam o calendário do escritório. A automação via n8n, prevista originalmente, permanece adiada."),
  ...fig(`${DIAG}/c4_contexto.png`, 1365, 587, "Diagrama de Contexto (C4 – Nível 1)", 480),

  h2("7.2. Diagrama de Containers (C4 — Nível 2)"),
  p("O frontend é desenvolvido em Next.js/React, em JavaScript (a proposta original previa TypeScript), e é instalável como aplicativo (PWA): um service worker garante a tela de indisponibilidade sem conexão e recebe as notificações push. O backend é uma API REST em Django e Django REST Framework (substituindo a proposta original de Node.js), autenticada via JWT, com documentação OpenAPI publicada em /api/docs. Rotinas agendadas, executadas como comandos do próprio Django, enviam os lembretes, sincronizam o DataJud e buscam as intimações do DJEN. O banco de dados é PostgreSQL, hospedado no Supabase (substituindo o MySQL local previsto originalmente)."),
  ...fig(`${DIAG}/c4_containers.png`, 1545, 567, "Figura 19 – Diagrama de Containers (C4 – Nível 2)", 480),

  h2("7.3. Diagrama de Componentes"),
  p("O backend recebe as requisições em views organizadas em um módulo por assunto — sessão, equipe, clientes, processos, intimações, agenda, financeiro, tarefas, entre outros —, que antes formavam um único arquivo de 3.700 linhas. Cada requisição passa pela checagem de permissões (uma matriz perfil × área × ação) e pelo escopo por escritório, que também aplica o segredo de justiça; os serializers validam a entrada; e as regras específicas de cada domínio ficam em serviços próprios — cálculo de prazos e feriados, DJEN, DataJud, PIX, calendário, resumo para o cliente, verificação em duas etapas, notificações push e IA. Os modelos do Django ORM fazem a comunicação com o PostgreSQL. Os testes do backend seguem a mesma divisão por assunto."),
  ...fig(`${DIAG}/componentes.png`, 1521, 712, "Diagrama de Componentes – Backend (Django)", 480),

  h2("7.4. Integração Contínua e Qualidade"),
  p("Cada alteração enviada ao repositório dispara três trabalhos em paralelo no GitHub Actions. O do backend sobe um PostgreSQL efêmero e executa os 423 testes da API, a checagem de integridade do projeto, a validação da documentação OpenAPI, a checagem de segurança da configuração de produção e a auditoria de dependências. O do frontend executa a análise estática do código sem nenhum aviso tolerado, os 193 testes de componentes e o build de produção. O de ponta a ponta sobe o sistema inteiro — banco, API e frontend — sobre o escritório de demonstração e executa os 11 cenários do Playwright, publicando o relatório e os registros em caso de falha. A versão principal só recebe alterações com os três trabalhos aprovados."),
];

// ============================================================
// 8. TRABALHOS FUTUROS
// ============================================================
const trabalhosFuturos = [
  h1("8. Trabalhos Futuros"),
  p("Os itens a seguir foram identificados como relevantes para a evolução do sistema, mas não foram implementados no escopo atual deste TCC:"),
  bullet("Notificação automática ao cliente (WhatsApp/e-mail) a cada atualização de processo, via automação com n8n — adiada porque o ambiente de testes utiliza contatos fictícios, o que impede validar a integração de ponta a ponta; hoje a mensagem é preparada pelo sistema e enviada pelo advogado;"),
  bullet("Calendário de feriados estaduais e municipais por comarca no cálculo de prazos, hoje restrito aos feriados nacionais e ao recesso forense;"),
  bullet("Confirmação automática do pagamento por PIX, que exige o PIX dinâmico de uma conta com API de cobrança bancária — o PIX estático atual depende da baixa manual da parcela;"),
  bullet("Marcação da hora já faturada, distinguindo o tempo apontado do tempo efetivamente cobrado;"),
  bullet("Portal de acesso do próprio cliente, para que ele acompanhe o processo sem depender de mensagens;"),
  bullet("Peticionamento e acesso autenticado ao PJe com certificado digital — o sistema já consulta as fontes públicas do DataJud e do DJEN;"),
  bullet("Assinatura eletrônica de documentos e contratos;"),
  bullet("Publicação nas lojas de aplicativos — hoje o sistema é instalável como aplicativo web e recebe notificações push."),
];

// ============================================================
// 9. CONCLUSÃO
// ============================================================
const conclusao = [
  h1("9. Conclusão"),
  p("O projeto evoluiu significativamente desde a proposta inicial: além da migração da stack tecnológica (Django/Python no lugar de Node.js, PostgreSQL/Supabase no lugar de MySQL), foram incorporadas funcionalidades que se mostraram necessárias durante o desenvolvimento — controle de contratos e honorários, bloqueio de login por tentativas inválidas, filtros de busca, agenda com diferenciação entre compromissos e prazos, e um painel administrativo da plataforma. Essas mudanças, discutidas e aprovadas internamente pela dupla, também motivaram a revisão dos diagramas de casos de uso, de classes e de banco de dados apresentados neste relatório, corrigindo inconsistências identificadas na avaliação anterior (uso de casos de uso genéricos, ausência de herança entre atores, e o tratamento indevido de \"Relatório\" como uma entidade em vez de um comportamento das classes de domínio)."),
  p("Em uma revisão final, o sistema recebeu um conjunto de melhorias de segurança e de completude do domínio: um registro de auditoria (RF18) que documenta quem acessou o sistema e quem criou, editou ou excluiu cada dado, redefinição de senha por e-mail (RF19), limitação de taxa de requisições em endpoints sensíveis a abuso, validação de tamanho e extensão de arquivos enviados, paginação das listagens da API e a parametrização de configurações sensíveis (chave secreta, modo de depuração e hosts permitidos) por variável de ambiente — itens tratados como requisitos não funcionais de segurança (RNF07, RNF08) e regras de negócio (RN10, RN11) deste relatório."),
  p("Duas rodadas adicionais de ajustes trataram, respectivamente, do reforço da camada de autenticação e da completude do domínio jurídico. Na primeira, foram corrigidos dois defeitos identificados no uso real do sistema: a sessão do usuário caía sozinha poucos minutos depois do login (o token de acesso expirava e não era renovado automaticamente) e o logout não encerrava a sessão de fato no servidor. Além disso, o auto-cadastro de um novo escritório passou a exigir confirmação de e-mail em produção (RF20, RN12). Na segunda, o sistema passou a calcular automaticamente a data final de um prazo processual em dias úteis, considerando os feriados nacionais — inclusive os móveis, calculados a partir da Páscoa (RF22, RN14) —, e o cadastro de processo passou a registrar dados jurídicos até então ausentes: área do direito, vara, comarca, valor da causa, parte contrária e uma estimativa de honorários de sucumbência (RF23, RF24, RN15)."),
  p("Uma última rodada partiu de um estudo comparativo com os sistemas de gestão jurídica em uso no mercado brasileiro — entre eles Astrea, Projuris ADV, ADVBOX, SAJ ADV e Legal One —, com o objetivo de identificar lacunas relevantes para a rotina de um escritório. Quatro delas foram tratadas. A primeira foi a de que as preferências de notificação eram armazenadas mas nunca lidas: o sistema passou a enviar de fato os lembretes de prazo e o resumo semanal (RF25), com controle de idempotência para não duplicar avisos (RN16). A segunda tratou do módulo financeiro, que oferecia o honorário por hora sem oferecer onde registrar horas: entraram o apontamento de horas trabalhadas, o lançamento de custas e despesas reembolsáveis e a medição do tempo de uso do sistema (RF26 a RF28). A terceira incorporou a consulta processual automática à API pública do DataJud, do Conselho Nacional de Justiça (RF29), recurso central nos sistemas comparados e viabilizado por ser uma base pública e gratuita. A quarta introduziu os modelos de documento preenchidos automaticamente a partir do cadastro (RF30), aproveitando dados do cliente que já eram coletados e pouco utilizados."),
  p("Vale registrar um aprendizado de método. Três das quatro lacunas acima não eram funcionalidades ausentes, e sim promessas em aberto: a tela de preferências oferecia lembretes que nunca eram enviados, o contrato oferecia honorário por hora sem permitir registrar horas, e o encerramento de sessão não encerrava a sessão no servidor. Revisar criticamente o que já havia sido construído revelou-se tão produtivo quanto acrescentar funcionalidades novas, e sugere que a verificação do que o sistema promete ao usuário deveria integrar o próprio ciclo de desenvolvimento, e não apenas a etapa final de testes. A etapa seguinte confirmou o padrão e ampliou o aprendizado: os relatórios não mostravam contratos, horas e despesas porque haviam sido escritos antes desses módulos existirem, e o campo de situação \"atrasado\" de uma parcela nunca era atribuído por rotina alguma. Em ambos os casos, o defeito não estava em código incorreto, e sim em código correto que deixou de acompanhar o crescimento do sistema — algo que nenhum teste automatizado existente acusaria, porque cada parte, isoladamente, funcionava como esperado."),
  p("Uma etapa final partiu de uma revisão crítica do sistema já construído, e não de comparação com o mercado. Cinco melhorias foram implementadas. A sincronização com o DataJud, que dependia de acionamento manual processo a processo, passou a ser periódica e automática, restrita aos processos que ainda recebem movimentação e com aviso por e-mail quando surge andamento novo (RF31/RN21). Os relatórios de cliente e de processo, escritos antes da existência dos módulos de contrato, horas e despesas, passaram a apresentá-los, com um resumo financeiro consolidado (RF32/RN22). O painel inicial, que exibia apenas contagens, ganhou os indicadores financeiros do escritório (RF33/RN23). Foi criada a entidade Tarefa, para o trabalho interno que não tem hora marcada e que a agenda não comportava (RF34/RN24). E o sistema passou a ser instalável como aplicativo, com tela própria de indisponibilidade (RF35/RN25)."),
  p("Duas decisões dessa etapa merecem registro por envolverem escolhas de projeto, e não apenas implementação. A primeira é que o mecanismo de funcionamento offline não armazena nenhuma resposta da API no dispositivo (RNF12): sendo o sistema multi-escritório e autenticado por token, um armazenamento local exibiria dados de um escritório a quem usasse o mesmo aparelho em seguida e, em um sistema de prazos, apresentar informação desatualizada como se fosse atual é pior do que não apresentar informação alguma. A segunda é que a apuração de parcelas vencidas compara a data de vencimento com o dia da consulta, em vez de confiar no campo de situação da parcela: o modelo prevê a situação \"atrasado\", mas nenhuma rotina do sistema a atribui, de modo que o indicador apoiado nesse campo exibiria sempre zero (RN23)."),
  p("Na sequência, o sistema recebeu uma revisão de interface orientada ao uso. Verificou-se que um mesmo estado de processo era representado por cores diferentes conforme a tela — verde no indicador de uma tabela e azul no gráfico do painel —, e que a cor das fatias do gráfico derivava da posição na lista, e não da identidade do estado, de modo que um escritório sem processos suspensos fazia um estado herdar a cor de outro. A correção centralizou a definição de rótulo, indicador e cor em um único ponto do código e adotou uma paleta por tema, verificada quanto à separação sob protanopia, deuteranopia e tritanopia e quanto ao contraste em relação ao fundo (RNF13/RNF14). Somaram-se a isso uma central de ajuda contextual (RF36) e a ampliação da busca global para todas as áreas do sistema (RF37)."),
  p("A etapa final concentrou-se em três frentes. A primeira foi a segurança e a privacidade: o acesso passou a ser controlado por perfis — administrador, advogado, estagiário, financeiro e secretária —, com uma única matriz de permissões aplicada pela API e refletida na interface (RF38/RN26); processos em segredo de justiça ficaram restritos ao administrador e ao advogado responsável em todas as partes do sistema (RF40/RN27); o login ganhou verificação em duas etapas (RF41/RN28); e os direitos do titular previstos na LGPD — consentimento, portabilidade e anonimização — foram implementados (RF42/RN29). Antes disso, a configuração de produção havia sido endurecida, a sessão passou a renovar e revogar tokens a cada uso, a interface foi adaptada ao celular e as telas principais passaram a cumprir as regras de acessibilidade WCAG 2 AA."),
  p("A segunda frente trouxe funcionalidades ligadas à rotina do escritório. A mais relevante é a importação das intimações do DJEN com o prazo lançado na agenda (RF47): ela fecha a lacuna registrada na etapa anterior, quando se constatou que o DataJud não traz o texto das publicações, e exigiu codificar regras processuais precisas — publicação no dia útil seguinte à disponibilização, contagem a partir do dia útil seguinte, suspensão no recesso de fim de ano e prorrogação do vencimento que cai em dia sem expediente (RN30). Somaram-se a cobrança por PIX de cada parcela (RF45), a atualização do andamento em linguagem simples para o cliente (RF46), o quadro de tarefas (RF44), a agenda no calendário do celular (RF43) e as notificações push (RF48). Em todas, a decisão de projeto foi manter o advogado no controle: a mensagem ao cliente é revisada antes do envio, o prazo sem número expresso aparece como estimado e o PIX estático não pretende confirmar o pagamento sozinho."),
  p("A terceira frente foi a de evidências. O sistema passou a ser verificado a cada alteração por testes em três níveis — 423 testes da API, 193 testes de componentes e 11 cenários de ponta a ponta com checagem de acessibilidade —, a API ganhou documentação OpenAPI validada automaticamente, e os dois maiores arquivos do backend, com 3.700 e 6.000 linhas, foram divididos por assunto sem alteração de comportamento. A integração contínua mostrou o seu valor de imediato: um teste que passava no ambiente de desenvolvimento, sem acesso à rede, falhou na primeira execução no servidor, porque lá o validador de e-mail consultava o domínio de verdade. O defeito estava no teste, e não no sistema, mas só foi encontrado porque a verificação passou a rodar em um ambiente diferente do de quem escreveu o código."),
  p("O principal desafio permanece sendo o gerenciamento do tempo e a integração entre as tecnologias escolhidas, especialmente diante da entrada de novas funcionalidades ao longo do semestre. Os itens listados na seção 8 indicam os próximos passos naturais do projeto, caso seu desenvolvimento continue além do TCC."),
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
];

module.exports = {
  capa, resumo, sumario, introducao, modelagemNegocio, requisitos, modelagemSistemas,
  modelagemDados, prototipos, arquitetura, trabalhosFuturos, conclusao, referencias,
};

module.exports.TITULOS_SUMARIO = TITULOS_SUMARIO;
