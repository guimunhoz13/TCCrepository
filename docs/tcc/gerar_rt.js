const {
  img, figura, h1, h2, h3, p, bullet, celula, AZUL, DOURADO, CINZA, DIAG, ORIG,
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ImageRun, Header, Footer, PageNumber, ShadingType, VerticalAlign, HeadingLevel, PageBreak,
} = require("./build_rt.js");
const { TabStopType } = require("docx");

// Largura útil da página A4 com as margens de main.js (11906 − 1701 − 1134).
const LARGURA_UTIL = 9071;
const metricasAtuais = require("../testes/evidencias/metricas-atuais.json");
const praticosAtuais = require('../testes/evidencias/2026-11-09/praticos.json');
const praticosAprovados = praticosAtuais.casos.filter(c => c.status === 'APROVADO').length;

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
    children: [new TextRun({ text: "Guilherme Rossato Munhoz", size: 24 })] }),
  new Paragraph({ style: "Title", alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({ text: "Sistema Web para Gerenciamento de Escritório de Advocacia", bold: true, size: 30 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: "TDS-2026-038 | Revisão 1.12 | 9 de novembro de 2026", size: 18, color: "000000" })] }),
  new Paragraph({ text: "", spacing: { after: 400 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({ text: "Relatório técnico apresentado como requisito parcial para obtenção de aprovação na disciplina de Projeto Final de Curso, no Curso de Tecnologia em Desenvolvimento de Sistemas, no Centro Universitário Católico Salesiano Auxilium.", size: 21 })] }),
  new Paragraph({ text: "", spacing: { after: 400 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({ text: "Orientador: Sérgio Luiz Tonsig", size: 21 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: "Coorientador: Francisco Antônio de Souza", size: 21 })] }),
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
  p(`Este trabalho apresenta o LexNexo, sistema web de gestão de escritórios de advocacia com frontend Next.js/React, API Django REST Framework e PostgreSQL no Supabase. A solução reúne clientes, processos, agenda, documentos, tarefas, contratos, horas, despesas e relatórios, com permissões por perfil e escritório e restrição de processos sigilosos. A auditoria final de 09/11/2026 aprovou ${metricasAtuais.rodadas.at(-1).total} casos automatizados: ${metricasAtuais.rodadas.at(-1).django} Django, ${metricasAtuais.rodadas.at(-1).jest} Jest e ${metricasAtuais.rodadas.at(-1).playwright} Playwright. As execuções local e do CI têm evidências próprias e não são somadas. A cobertura de linhas foi ${metricasAtuais.cobertura.backend_linhas} no backend e ${metricasAtuais.cobertura.frontend_linhas} no frontend, mantendo a interface abaixo da meta de 70%. Sete achados adicionais foram corrigidos: edição de contratos divergente das parcelas, estorno sem atualização completa, entradas inválidas, cálculo de prazo, vínculo de modelos, feedback de baixa e navegação por teclado em Configurações. Na conta publicada, ${praticosAprovados} de ${praticosAtuais.casos.length} verificações práticas foram aprovadas; 15 registros principais fictícios foram mantidos. A aplicação foi publicada na Vercel e no Render, e os cinco anexos privados conferidos conservaram seus bytes. O parecer é apto com ressalvas: vídeo, cobertura frontend, validação integral das integrações, recuperação em nuvem e estudo com profissionais continuam com limites explícitos. RF52 permanece no backlog. As métricas históricas e atuais compartilham a mesma fonte neste relatório e no guia.`),
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
  ["7.8. Publicação e Verificação da Versão", 2],
  ["7.9. Nova Auditoria e Revisão da Entrega", 2],
  ["7.10. Implantação e Contingência", 2],
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
  p("A solução é uma aplicação web denominada LexNexo, que permite cadastrar a equipe, clientes e processos, controlar prazos e compromissos, registrar contratos e honorários, gerar relatórios e preparar comunicações por e-mail e WhatsApp. O assistente de IA utiliza o contexto do escritório e exige revisão humana do conteúdo gerado. A arquitetura multi-tenant aplica filtros de escritório e permissões por perfil, enquanto o painel mestre possui autenticação própria para a administração da plataforma. O modelo é freemium: novas contas começam no plano Gratuito, e os planos Básico e Profissional ampliam limites e recursos. A contratação real dos planos ainda depende da equipe responsável; a simulação de PIX não altera a assinatura."),

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
  p("O trabalho combina implementação incremental, revisão do código e testes de regras de negócio, permissões, sessão, formulários e navegação. A auditoria local de 27/10/2026 aprovou 841 casos após reproduções, correções e retestes. Em 28/10, dois casos E2E adicionais elevaram a suíte para 843 casos aprovados no GitHub Actions, e o sistema corrigido foi publicado. A revisão de 02/11 conferiu o estado versionado, a documentação e as evidências dos serviços, sem apresentar os testes anteriores como uma nova execução. A seção 7 distingue essas etapas e seus limites."),
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
    new TableRow({ cantSplit: true, children: [
      bmcCell("Parcerias-chave", ["Supabase (infraestrutura de banco de dados)", "OpenAI (assistente de IA)", "Provedor de e-mail (SMTP)"]),
      bmcCell("Atividades e Recursos-chave", ["Desenvolvimento e manutenção da plataforma", "Suporte aos escritórios cadastrados", "Equipe de desenvolvimento (dupla) e código-fonte"]),
      bmcCell("Proposta de Valor", ["Centralizar clientes, processos, prazos, contratos e comunicação de um escritório de advocacia em um único sistema, com IA e gestão multi-escritório"]),
      bmcCell("Relacionamento e Canais", ["Suporte direto do desenvolvedor via painel mestre", "Autoatendimento: cadastro gratuito pela página inicial", "Aplicação web responsiva, com acesso remoto"]),
      bmcCell("Segmentos de Clientes", ["Escritórios de advocacia de pequeno e médio porte"]),
    ] }),
    new TableRow({ cantSplit: true, children: [
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
  ["RF21", "Encerramento da sessão e revogação do refresh no logout", "Alta", "6", "Concluído"],
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
    new TableRow({ tableHeader: true, cantSplit: true, children: backlogHeaders.map((t, i) => celula(t, { bold: true, shading: "1F3864", color: "FFFFFF", center: true, width: backlogWidths[i] })) }),
    ...backlogRows.map((row) => new TableRow({ cantSplit: true, children: row.map((t, i) => celula(t, { width: backlogWidths[i], center: i !== 1 })) })),
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
  bullet("RF21 – Encerramento da sessão no frontend e revogação do token de renovação (refresh) no servidor ao sair; o token de acesso já emitido expira naturalmente em até 30 minutos;"),
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
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN01 – Cadastro e Login de Usuário", bold: true, size: 22 })] }),
  p("O sistema deve permitir o cadastro de usuários e autenticação por e-mail e senha, bloqueando o acesso por 15 minutos após 3 tentativas de senha inválidas consecutivas."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN02 – Responsividade do Sistema", bold: true, size: 22 })] }),
  p("O sistema deve se adaptar automaticamente a diferentes tamanhos de tela, garantindo uso adequado em dispositivos móveis e desktops."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN03 – Validação de Formulários", bold: true, size: 22 })] }),
  p("Todos os campos obrigatórios devem ser preenchidos corretamente antes do envio, incluindo validação real de e-mail, quantidade de dígitos de CPF/CNPJ/telefone/OAB e senha forte (mínimo de 8 caracteres, com maiúscula, número e caractere especial)."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN04 – Controle de Prazos e Compromissos", bold: true, size: 22 })] }),
  p("O sistema deve permitir o cadastro de eventos de agenda (compromissos ou prazos) vinculados a um processo, sinalizando automaticamente como atrasado qualquer prazo cuja data já tenha passado e que não tenha sido marcado como cumprido."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN05 – Geração de Relatórios", bold: true, size: 22 })] }),
  p("O sistema deve gerar relatórios de cliente e de processo, permitindo salvá-los em PDF (via impressão do navegador) ou enviá-los diretamente por e-mail."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN06 – Contratos e Honorários", bold: true, size: 22 })] }),
  p("Cada processo pode ter no máximo um contrato vinculado. Ao ser cadastrado como parcelado, o sistema deve gerar automaticamente as parcelas com vencimento mensal, garantindo que a soma dos valores das parcelas seja exatamente igual ao valor total do contrato."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN07 – Cadastro de Processos", bold: true, size: 22 })] }),
  p("O sistema deve permitir cadastrar processos vinculados a um cliente e a um advogado já existentes, com número de processo único dentro do mesmo escritório."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN08 – Isolamento Multi-tenant", bold: true, size: 22 })] }),
  p("Nenhum dado (cliente, processo, contrato, documento ou agenda) de um escritório pode ser acessado por usuários de outro escritório, nem pelo painel administrativo da plataforma."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN09 – Painel Administrativo da Plataforma", bold: true, size: 22 })] }),
  p("O acesso ao painel administrativo da plataforma (painel mestre) é restrito a um administrador do sistema, com autenticação própria e completamente separada da autenticação dos usuários de escritório."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN10 – Registro de Auditoria", bold: true, size: 22 })] }),
  p("Todo login (bem-sucedido, malsucedido ou bloqueado) e toda criação, edição ou exclusão de um registro devem gerar uma entrada de auditoria com data/hora, autor, ação e escritório de origem. Um administrador de escritório só pode consultar os registros do próprio escritório; o painel mestre tem visão consolidada de todos os escritórios."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN11 – Redefinição de Senha", bold: true, size: 22 })] }),
  p("Ao solicitar a redefinição de senha, o sistema deve responder de forma idêntica independentemente de o e-mail informado existir ou não (para não revelar quais e-mails estão cadastrados), gerar um token de uso único válido por 1 hora e exigir que a nova senha atenda aos mesmos critérios de senha forte usados no cadastro."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN12 – Confirmação de E-mail no Auto-cadastro", bold: true, size: 22 })] }),
  p("No auto-cadastro público de um novo escritório, o administrador só pode fazer login depois de confirmar o e-mail através de um link com validade de 24 horas — exigência que só se aplica em produção, para não impedir o uso de e-mails fictícios em ambiente de desenvolvimento e teste. Advogados cadastrados por um administrador já autenticado não precisam dessa confirmação, já que o próprio administrador responde pela conta."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN13 – Revogação de Sessão", bold: true, size: 22 })] }),
  p("Ao encerrar a sessão (logout), o token de renovação (refresh token) do usuário deve ser invalidado no servidor, impedindo que uma cópia desse token continue sendo usada para obter novos acessos. O token de acesso já emitido permanece válido até sua expiração natural (até 30 minutos), já que a autenticação do sistema é stateless e não consulta essa revogação a cada requisição."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN14 – Cálculo de Prazo Processual", bold: true, size: 22 })] }),
  p("A contagem de um prazo em dias úteis deve considerar como não úteis os sábados, domingos e feriados nacionais — incluindo os feriados móveis calculados a partir da data da Páscoa (Carnaval, Sexta-feira Santa e Corpus Christi) — e os feriados locais e suspensões de expediente aplicáveis à comarca ou ao tribunal (RN36), além do recesso processual de 20 de dezembro a 20 de janeiro. Alternativamente, o sistema também permite a contagem em dias corridos, para prazos de natureza contratual ou de direito material."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN15 – Honorários de Sucumbência", bold: true, size: 22 })] }),
  p("O valor estimado de honorários de sucumbência é calculado multiplicando o valor da causa pelo percentual fixado pelo juízo. O sistema não determina esse percentual automaticamente — ele é definido por decisão judicial e apenas informado manualmente pelo usuário."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN16 – Envio de Lembretes", bold: true, size: 22 })] }),
  p("Um mesmo lembrete nunca deve ser enviado duas vezes ao mesmo usuário, canal e etapa, ainda que a rotina seja executada mais de uma vez no mesmo dia. E-mail e push são reservados e enviados de forma independente: a indisponibilidade do SMTP não impede o aviso no aparelho, e uma falha é retirada do registro para poder ser tentada novamente. Prazos fatais recebem reforços dois dias antes, um dia antes e no próprio dia; no aparelho, o aviso mais recente substitui o anterior do mesmo prazo. O resumo semanal é enviado às segundas-feiras, apenas aos usuários que o habilitaram."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN17 – Horas Faturáveis", bold: true, size: 22 })] }),
  p("Nem toda hora trabalhada é cobrada do cliente: horas de retrabalho, cortesia ou atividade interna são registradas como não faturáveis, entrando no total trabalhado mas ficando fora do valor a cobrar. O apontamento é sempre atribuído ao usuário autenticado, e não a um responsável informado manualmente, para que o registro de tempo seja rastreável a quem o lançou."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN18 – Despesas Reembolsáveis", bold: true, size: 22 })] }),
  p("Uma despesa lançada como não reembolsável não pode ser marcada como reembolsada, por ser um estado contraditório. A distinção entre despesa reembolsável e já reembolsada permite apurar quanto o escritório adiantou e ainda tem a receber do cliente."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN19 – Importação de Movimentações", bold: true, size: 22 })] }),
  p("Uma movimentação importada do DataJud é identificada pelo código do movimento em conjunto com a sua data e hora, e não apenas pelo código, porque um mesmo código se repete ao longo do processo — uma conclusão, por exemplo, ocorre diversas vezes. Consultas repetidas ao mesmo processo importam apenas o que ainda não existe, e a data registrada é a informada pelo tribunal, não a data da importação."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN20 – Preenchimento de Modelos", bold: true, size: 22 })] }),
  p("As variáveis de um modelo de documento são resolvidas exclusivamente a partir de um catálogo fechado, definido pelo sistema. Uma variável fora desse catálogo é mantida intacta no texto e sinalizada ao usuário, em vez de resolvida — o que impede que um modelo alcance dados não previstos. O sistema distingue, no retorno, a variável inexistente (erro de digitação) da variável válida cujo cadastro está em branco, e o preenchimento só utiliza clientes e processos do próprio escritório."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN21 – Sincronização Automática com o Tribunal", bold: true, size: 22 })] }),
  p("A rotina de sincronização considera apenas os processos em andamento e suspensos, por serem os que ainda recebem movimentação, e respeita um intervalo mínimo entre duas consultas ao mesmo processo, para não sobrecarregar o serviço público. A fila é ordenada pela data da última sincronização, com os processos nunca sincronizados em primeiro lugar — sem isso, um processo recém-cadastrado ficaria indefinidamente no fim da fila e poderia nunca ser alcançado pelo limite de consultas de cada execução."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN22 – Consolidação Financeira do Cliente", bold: true, size: 22 })] }),
  p("O resumo financeiro de um cliente ou processo soma o tempo trabalhado em minutos e só o converte em valor quando a hora é faturável e possui valor-hora informado: uma hora de cortesia entra no total trabalhado, mas não no que há a cobrar. O valor pendente é a diferença entre o valor contratado e a soma das parcelas efetivamente quitadas."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN23 – Apuração de Parcelas Vencidas", bold: true, size: 22 })] }),
  p("Uma parcela é considerada vencida quando a sua data de vencimento é anterior à data atual e ela ainda não foi quitada. A apuração compara a data de vencimento com o dia da consulta, e não se apoia no campo de situação da parcela: embora o modelo preveja a situação \"atrasado\", nenhuma rotina do sistema a atribui, de modo que confiar nesse campo faria toda parcela vencida passar despercebida."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN24 – Atribuição e Acompanhamento de Tarefas", bold: true, size: 22 })] }),
  p("Toda tarefa tem um responsável, que é avisado por e-mail ao recebê-la — atribuir sem avisar equivale a não atribuir —, salvo quando a própria pessoa se atribui a tarefa ou quando desabilitou esse aviso. Uma tarefa encerrada, concluída ou cancelada, nunca é contada como atrasada, ainda que o prazo já tenha passado, e reabri-la descarta a data de conclusão anterior. A ordenação da lista é por situação, prioridade e proximidade do prazo, ficando ao fim as tarefas sem prazo — a ausência de data não torna a tarefa urgente."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN25 – Funcionamento sem Conexão", bold: true, size: 22 })] }),
  p("O mecanismo de funcionamento offline armazena no dispositivo apenas os arquivos estáticos da aplicação e a tela de indisponibilidade, nunca respostas da API (RNF12). Sem conexão, uma navegação exibe a tela de indisponibilidade, e qualquer requisição de dados falha de forma explícita, em vez de retornar informação antiga armazenada localmente."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN26 – Matriz de Permissões", bold: true, size: 22 })] }),
  p("Uma única matriz — perfil × área × ação — decide o que cada pessoa pode fazer, e é a mesma usada pela API e enviada à interface. A ação exigida decorre do método da requisição (consultar, criar, editar ou excluir); operações que não seguem essa regra, como gerar um documento a partir de um modelo, declaram explicitamente a ação exigida. Nenhum usuário pode alterar o próprio perfil, e o escritório não pode ficar sem ao menos um administrador ativo. Membros que não são advogados são cadastrados sem exigência de OAB."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN27 – Segredo de Justiça", bold: true, size: 22 })] }),
  p("Um processo marcado como sigiloso, e tudo o que dele depende — movimentações, documentos, agenda, tarefas, contrato e parcelas, horas, despesas e intimações —, deixa de aparecer em listagens, buscas, relatórios, exportações, lembretes, calendário e no contexto enviado à IA para quem não seja o administrador ou o advogado responsável. Os totais do painel continuam contando o processo, pois revelam que ele existe, mas não o que contém."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN28 – Verificação em Duas Etapas", bold: true, size: 22 })] }),
  p("Com a verificação ativa, a senha correta não abre a sessão: devolve um desafio assinado, válido por 5 minutos, que só se converte em sessão com o código de 6 dígitos do aplicativo autenticador (TOTP, RFC 6238). Aceita-se uma janela de 30 segundos para diferenças de relógio, um mesmo código não é aceito duas vezes, e cinco códigos errados bloqueiam a conta por 15 minutos. Desativar a verificação exige a senha e um código válido."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN29 – Direitos do Titular (LGPD)", bold: true, size: 22 })] }),
  p("A data do consentimento do cliente é registrada pelo sistema no momento em que ele é marcado. A exportação reúne, em formato estruturado, os dados pessoais do titular e os processos e contratos ligados a ele (art. 18, II e V). A anonimização substitui de forma irreversível nome, documentos, contato, endereço e foto, preservando os processos, que o escritório tem obrigação legal de manter, e é registrada na auditoria. Só os perfis autorizados a excluir clientes atendem a esses pedidos."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN30 – Prazo de Intimação Eletrônica", bold: true, size: 22 })] }),
  p("A intimação considera-se publicada no primeiro dia útil seguinte ao da disponibilização no Diário (Lei 11.419/2006, art. 4º, § 3º), e a contagem começa no primeiro dia útil seguinte ao da publicação (art. 4º, § 4º; CPC, art. 224, § 3º). Em dias úteis, não contam sábados, domingos, feriados nacionais nem o recesso de 20 de dezembro a 20 de janeiro (CPC, arts. 219 e 220), e o prazo que termina em dia sem expediente passa para o próximo dia útil (CPC, art. 224, § 1º). O número de dias é lido do texto da intimação; sem prazo expresso, adota-se o de 5 dias úteis (CPC, art. 218, § 3º), marcado como estimado para conferência. Uma mesma comunicação nunca é importada duas vezes. Os feriados locais cadastrados pelo escritório também deixam de contar, tanto para a data de publicação quanto para a contagem e o vencimento (RN36)."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN31 – Cobrança por PIX", bold: true, size: 22 })] }),
  p("O código PIX é um BR Code estático, no padrão do Banco Central, com a chave do escritório, o valor exato da parcela e um identificador da parcela. Parcela já paga não gera PIX. A chave cadastrada é apenas ajustada ao formato exigido, sem validação de dígito de CPF ou CNPJ — a existência da chave é verificada pelo banco no pagamento. Por ser estático, o PIX não confirma o pagamento sozinho: a baixa da parcela continua sendo registrada pelo escritório."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN32 – Assinatura da Agenda", bold: true, size: 22 })] }),
  p("O link de assinatura contém um identificador aleatório de 256 bits e é pessoal. Gerar um novo link invalida o anterior, e o link deixa de responder se a conta ou o escritório forem desativados ou se o perfil perder o acesso à agenda. O calendário segue as mesmas regras da tela, inclusive o segredo de justiça, traz os eventos a partir do último mês e inclui aviso na véspera dos prazos — e também dois dias antes, nos prazos fatais."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN33 – Atualização do Cliente", bold: true, size: 22 })] }),
  p("A mensagem ao cliente nunca é enviada automaticamente: o advogado a revisa e pode editá-la antes de abri-la no WhatsApp. A IA só é usada quando o perfil tem acesso a ela e o servidor está configurado; caso contrário, ou se a IA falhar, um modelo automático traduz os termos processuais mais comuns para linguagem simples."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN34 – Notificações Push", bold: true, size: 22 })] }),
  p("Cada aparelho se inscreve separadamente e pode ser desligado a qualquer momento. As notificações seguem as mesmas preferências dos avisos por e-mail. Uma inscrição que o serviço de push informa como expirada é removida, e a falha no envio de uma notificação nunca interrompe a operação que a originou."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN35 – Planos e Limites", bold: true, size: 22 })] }),
  p("Todo escritório criado pelo cadastro público entra no plano Gratuito, sem pagamento: até 3 usuários ativos e 30 processos ativos. O Básico permite até 10 usuários e 300 processos e inclui as intimações do DJEN e a sincronização automática do DataJud; o Profissional não tem limites e inclui também a IA. Os limites são verificados pela API no momento de criar — cadastrar membro ou advogado, reativar usuário, cadastrar ou desarquivar processo —, e processos concluídos ou arquivados não contam. Atingir o limite nunca apaga nem esconde dados: apenas impede criar mais, com uma mensagem que indica os planos pagos. Um plano pago com validade vencida vale como Gratuito até ser renovado, e as rotinas agendadas só atendem os escritórios cujo plano em vigor inclui o recurso. No Gratuito, a mensagem de atualização ao cliente usa o modelo automático, sem IA."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN36 – Feriados Locais", bold: true, size: 22 })] }),
  p("Feriados municipais e estaduais e suspensões de expediente variam por comarca e são definidos por cada tribunal; por isso o sistema não traz uma lista pronta, e o escritório cadastra os dias que valem para ele. Um feriado pode valer só naquela data (uma suspensão por portaria) ou repetir todo ano no mesmo dia e mês (o aniversário da cidade). A mesma data pode ter feriados de abrangências diferentes no mesmo escritório. Quando a abrangência está preenchida, o feriado só afeta o prazo se coincidir com a comarca do processo ou com o tribunal da intimação; a abrangência vazia vale para todo o escritório. A calculadora também suspende os prazos processuais de 20 de dezembro a 20 de janeiro. Os feriados locais não afetam a contagem em dias corridos, e a calculadora informa quais deles mudaram o resultado. Excluir ou cadastrar um feriado vale para os cálculos seguintes: prazos já lançados na agenda não são recalculados."),
  new Paragraph({ keepNext: true, spacing: { after: 120 }, children: [new TextRun({ text: "RN37 – Preenchimento pelo CNPJ", bold: true, size: 22 })] }),
  p("Ao informar um CNPJ com 14 posições (12 caracteres alfanuméricos e dois dígitos finais), o sistema consulta o cadastro público da empresa e preenche apenas os campos ainda vazios: nada do que o usuário já digitou é substituído, e todos os campos continuam editáveis. A consulta é uma ajuda e nunca uma condição — um CNPJ não encontrado, uma falha de rede ou a indisponibilidade do serviço apenas geram um aviso para preencher à mão, e o cadastro segue normalmente. Uma situação cadastral diferente de ativa (baixada, suspensa, inapta) é informada no aviso, mas não impede o cadastro, porque o escritório pode ter motivo legítimo para registrar a empresa — por exemplo, uma ação contra uma sociedade já extinta. A consulta parte do navegador e não envia ao serviço nenhum dado além do próprio CNPJ."),
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
  ...fig(`${DIAG}/sequencia_autenticacao.png`, 1023, 775, "Sequência de autenticação com TOTP opcional", 460),
  ...fig(`${DIAG}/sequencia_agenda.png`, 1018, 688, "Sequência de cálculo e cadastro de prazo", 460),
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
  p("As fotos pequenas de usuários e clientes são persistidas no PostgreSQL pelo modelo FotoPersistente, criado na migração 0037. O armazenamento corrige a orientação, limita as dimensões a 512 × 512 pixels e converte a imagem para WebP; o acesso continua pela API autenticada, com verificação do escritório. Documentos e arquivos de identidade seguem o armazenamento configurado, distinto dos avatares. A leitura de imagens antigas mantém compatibilidade com o armazenamento anterior; não recupera arquivos já perdidos no disco efêmero."),
  p("A tabela intimacao ganhou conferido_em, conferido_por_id e observacao_conferencia (RF53). Leitura, conferência e cumprimento são estados distintos. A edição manual da data na agenda invalida a conferência anterior. Na anonimização de cliente, os valores pessoais do histórico de alterações e as referências estruturadas ao cliente são tratados, preservando os metadados da trilha de auditoria."),
  ...fig(`${DIAG}/er.png`, 2273, 2510, "Figura 4 – Diagrama de Banco de Dados (Modelo Entidade-Relacionamento)", 470),
];

// ============================================================
// 6. PROTÓTIPOS
// ============================================================
const prototipos = [
  h1("6. Protótipos das Funcionalidades Principais"),
  p("Diferentemente da versão anterior deste relatório — que apresentava mockups de uma \"Área do Cliente\" hoje fora do escopo do projeto, já que o cliente não possui acesso próprio ao sistema —, esta seção apresenta capturas de tela reais da aplicação em funcionamento, com dados de demonstração."),
  p("As 34 capturas da interface foram refeitas em 28/10/2026 para apresentar a marca LexNexo e os controles atuais, incluindo navegação agrupada, ajuda progressiva, cadastro por etapas e configuração de notificações. Foram utilizados serviços locais e dados fictícios; respostas de CNPJ e DataJud foram simuladas, e a intimação foi criada pela massa de demonstração. As imagens conservam essa data de captura na revisão de 02/11/2026. Os resultados locais e do CI remoto são separados na seção 7.5, e a publicação é descrita na seção 7.8."),
  p("As telas de login e do painel inicial, assim como as das seções 6.14 a 6.25, foram capturadas sobre o escritório de demonstração criado pelo comando popular_demo, que monta um escritório completo — um usuário de cada perfil, clientes, processos (um deles em segredo de justiça), andamentos, agenda, tarefas, contrato com parcelas e chave PIX — e é o mesmo usado pelos testes de ponta a ponta."),

  h2("6.1. Tela de Login"),
  p("Layout em dois painéis: à esquerda, a apresentação do produto; à direita, o formulário de acesso (e-mail e senha). Após 3 tentativas de senha inválidas, o acesso é bloqueado por 15 minutos (RN01)."),
  ...fig(`${DIAG}/print_login.png`, 1440, 900, "Figura 5 – Tela de login", 480),

  h2("6.2. Painel do Escritório (Dashboard)"),
  p("Visão geral do escritório autenticado, reorganizada para responder primeiro ao que exige ação: os prazos que estão vencendo e as tarefas da pessoa logada aparecem no topo, seguidos dos indicadores de clientes, processos, audiências e documentos, do financeiro do escritório e dos gráficos. A tela foi verificada automaticamente quanto às regras de acessibilidade WCAG 2 AA, sem violações. Os blocos exibidos dependem do perfil: o financeiro, por exemplo, não aparece para estagiários e secretárias."),
  p("A navegação entre Dashboard e Compromissos preserva a preferência de densidade no layout compartilhado. O provider deixou de ser recriado a cada troca de rota, eliminando a aplicação temporária do modo padrão antes de recuperar a escolha salva. Dois testes E2E acrescentados em 28/10 observam a transição inteira nos modos compacto e confortável, o menu, voltar e avançar no navegador e a abertura da Agenda. Essa regressão foi corrigida em A13 e conferida após a publicação."),
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
  p("Com a chave PIX do escritório cadastrada, a parcela pendente oferece a geração de QR code e código copia e cola com seu valor, além da preparação de mensagem para WhatsApp (RF45/RN31). A cobrança real utiliza código estático no padrão BR Code e depende de confirmação e baixa manual. A interface inicia no modo de teste, identificado como sem movimentação de dinheiro: a simulação não quita a parcela, não registra pagamento real e não equivale ao ambiente de testes de um banco. A simulação dos planos também preserva o plano e os limites existentes. O formato do código real foi verificado contra o exemplo do manual oficial nos testes automatizados. A captura abaixo apresenta somente o modo de teste."),
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
  p("A API dispõe de documentação interativa no padrão OpenAPI 3, gerada a partir das views e serializers (RNF18). As rotas são agrupadas por assunto e descrevem autenticação, escopo por escritório e perfis. O caminho /api/docs/ fica disponível conforme a configuração API_DOCS_PUBLICAS; a captura corresponde ao ambiente local e não indica que a documentação esteja aberta na aplicação publicada. O CI executa a validação do esquema e falha em avisos encontrados pelo gerador."),
  ...fig(`${DIAG}/print_swagger.png`, 1440, 900, "Documentação interativa da API (Swagger UI)", 480),

  h2("6.25. Testes de Ponta a Ponta"),
  p("Os testes de ponta a ponta utilizam Chromium com uma API real e dados de demonstração para verificar login, clientes, processos, perfis e sigilo, tarefas, PIX de teste, agenda, aparência e uso no celular. Os casos de acessibilidade usam axe nas telas de login e dashboard. A execução remota 40785092492 do GitHub Actions, em 28/10/2026, aprovou 36 cenários Playwright, 532 testes Django e 275 Jest. Dois cenários novos observam a transição completa entre Dashboard e Compromissos, incluindo densidade, estado do menu, histórico do navegador e abertura da Agenda. A rodada local de 27/10 havia aprovado 34 E2E; a diferença corresponde a esses dois casos adicionais."),
  new Table({
    width: { size: LARGURA_UTIL, type: WidthType.DXA },
    columnWidths: [5600, 3471],
    rows: [
      new TableRow({ tableHeader: true, children: [celula("Playwright no reteste de 28/10/2026", { width: 5600, bold: true, shading: AZUL, color: "FFFFFF" }), celula("Resultado confirmado", { width: 3471, bold: true, shading: AZUL, color: "FFFFFF" })] }),
      ...[["Cenários aprovados", "36"], ["Computador / celular", "33 / 3"], ["Falhas / ignorados / instáveis", "0 / 0 / 0"], ["Duração do reteste local", "78,289 s"]].map((r) => new TableRow({ cantSplit: true, children: [celula(r[0], { width: 5600 }), celula(r[1], { width: 3471, center: true })] })),
    ],
  }),
  p("Fontes: regressao-dashboard-2026-10-28.json e publicacao-2026-10-28.json, em docs/testes/evidencias. Os 36 cenários passaram no ambiente local e no CI; a duração acima pertence ao reteste local.", { italics: true }),

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
  p("O frontend é desenvolvido em Next.js/React, em JavaScript (a proposta original previa TypeScript), e é instalável como aplicativo (PWA): um service worker garante a tela de indisponibilidade sem conexão e recebe as notificações push. O backend é uma API REST em Django e Django REST Framework (substituindo a proposta original de Node.js), autenticada via JWT, com documentação OpenAPI em /api/docs/ quando habilitada por API_DOCS_PUBLICAS. Rotinas agendadas, executadas como comandos do próprio Django, enviam os lembretes, sincronizam o DataJud e buscam as intimações do DJEN. O banco de dados é PostgreSQL, hospedado no Supabase (substituindo o MySQL local previsto originalmente)."),
  ...fig(`${DIAG}/c4_containers.png`, 1545, 567, "Figura 19 – Diagrama de Containers (C4 – Nível 2)", 480),

  h2("7.3. Diagrama de Componentes"),
  p("O backend recebe as requisições em views organizadas em um módulo por assunto — sessão, equipe, clientes, processos, intimações, agenda, financeiro, tarefas, entre outros —, que antes formavam um único arquivo de 3.700 linhas. Cada requisição passa pela checagem de permissões (uma matriz perfil × área × ação) e pelo escopo por escritório, que também aplica o segredo de justiça; os serializers validam a entrada; e as regras específicas de cada domínio ficam em serviços próprios — cálculo de prazos e feriados, DJEN, DataJud, PIX, calendário, resumo para o cliente, verificação em duas etapas, notificações push, planos e IA. Os modelos do Django ORM fazem a comunicação com o PostgreSQL. Os testes do backend seguem a mesma divisão por assunto."),
  ...fig(`${DIAG}/componentes.png`, 1521, 712, "Diagrama de Componentes – Backend (Django)", 480),

  h2("7.4. Integração Contínua e Qualidade"),
  p("O workflow versionado do GitHub Actions foi executado e aprovado em 28/10/2026 no commit 89b675f, na execução 40785092492. Os quatro trabalhos concluídos foram Backend (Django), Frontend (Next.js), E2E (Playwright) e Imagem Docker Compose (HTTP). O CI utiliza banco efêmero e dados fictícios, executa testes, checagens Django e OpenAPI, lint e build. Os logs confirmam 532 testes da API, 275 de componentes e 36 de navegador; o trabalho Docker é adicional e não aumenta essa contagem. A versão publicada mantém o workflow versionado; alterações locais de outro trabalho nesse arquivo não foram incluídas na publicação."),
  h2("7.5. Resultados da Auditoria Técnica"),
  p("A auditoria de 27/10/2026 examinou a branch main do LexNexo a partir do commit 8b41a29 e das correções locais posteriormente registradas em 89b675f. Foram inventariados 27 modelos, 37 migrações, 13 páginas e 166 operações em 102 caminhos canônicos da API. A descoberta, a reprodução dos defeitos, as correções e os retestes estão em docs/testes. Em 28/10, a rodada de regressão acrescentou dois casos E2E, o CI remoto passou e o código corrigido foi publicado. A tabela compara as contagens, mantendo a cobertura vinculada apenas à medição local original."),
  p("Na linha de base, passaram 519 testes Django, 268 Jest e 26 Playwright. Após as correções, a auditoria local de 27/10 aprovou 841 casos; o CI remoto de 28/10 aprovou 843 após os dois cenários adicionais de navegação. Não houve falhas ou casos ignorados nessas rodadas finais. A proteção de 155 operações contra acesso sem autenticação foi exercitada como subtestes de um método Django, sem somá-los como casos independentes."),
  new Table({
    width: { size: LARGURA_UTIL, type: WidthType.DXA },
    columnWidths: [2500, 1300, 1300, 1900, 2071],
    rows: [
      new TableRow({ tableHeader: true, children: ["Camada", "Casos 27/10", "CI 28/10", "Linhas 27/10", "Ramos 27/10"].map((t, i) => celula(t, { bold: true, shading: AZUL, color: "FFFFFF", width: [2500,1300,1300,1900,2071][i] })) }),
      ...[
        ["Backend Django", "532", "532", "91,47%", "79,04%"],
        ["Componentes Jest", "275", "275", "35,55%", "31,85%"],
        ["Fluxos Playwright", "34", "36", "Não medida", "Não medida"],
        ["Total de casos", "841", "843", "Não se soma", "Não se soma"],
      ].map((r, n) => new TableRow({ cantSplit: true, children: r.map((t, i) => celula(t, { width: [2500,1300,1300,1900,2071][i], center: i > 0, shading: n % 2 ? "F2F5FA" : "FFFFFF" })) })),
    ],
  }),
  p("Contagens de casos por rodada e cobertura da medição local de 27/10/2026. A cobertura não foi recalculada no CI nem nesta revisão documental. Fontes: docs/testes/evidencias.", { italics: true }),
  p("A cobertura do backend corresponde a 4.420 de 4.832 linhas do pacote advocacia, excluindo testes e migrações; core, configurações e armazenamento ficam fora desse denominador. A do frontend corresponde a 1.621 de 4.559 linhas JS/JSX de src, sem CSS e arquivos públicos. A cobertura do Playwright não foi adicionada à do Jest. O backend superou a referência de 80% de linhas; o frontend não atingiu a meta de 70%, devendo ampliar os cenários de componentes e estados da interface."),
  p("Passaram também lint sem avisos, build de produção, verificações Django, detecção de migrações faltantes e validação OpenAPI sem avisos. A checagem de configuração de produção simulada passou com o aviso de HSTS preload silenciado pela configuração existente. O ambiente local da auditoria usou Python 3.14.7, Django 6.0.8, PostgreSQL 18.6, Node.js 22.23.2 e Next.js 16.4.2. O CI remoto aprovado utilizou Python 3.12 e PostgreSQL 16. A consulta documental de 02/11 não executou novamente as suítes nem atualizou as medidas de cobertura."),
  p("As correções abrangeram permissões de acesso a contratos e horas na ficha de processo; restrição dos destinos de notificações push a provedores permitidos, com revalidação, limite de espera e bloqueio de redirecionamentos; tratamento de chaves push e token mestre malformados; atomicidade ao alterar o escritório; filtros de identificadores e datas; validação de extensão, assinatura e tamanho de uploads em fluxos antes descobertos; e ajuste do código HTTP de logout no OpenAPI."),
  p("Na interface e nas regras de data, foram corrigidas disputas entre gravações de rascunho, preservando a digitação e aguardando gravações pendentes antes do descarte, além do uso indevido do dia UTC em datas locais. Formulários de credenciais passaram a declarar método POST, inclusive para a condição de JavaScript indisponível. A infraestrutura de testes recebeu ajustes de aliases, porta da API, carregamento de preferências e isolamento de rascunhos. Os defeitos e suas regressões estão identificados em docs/testes/DEFEITOS_E_RISCOS.md."),
  p("A análise de dependências distinguiu a resolução nova dos requisitos do ambiente Python instalado, que ainda continha versões antigas com alertas. Depois das atualizações e da revisão dos mínimos, pip-audit não apontou alertas nesse ambiente. No npm, a atualização do zod eliminou o alerta alto; a auditoria de produção ficou sem alertas e a auditoria completa manteve cinco pacotes de baixa gravidade na cadeia Jest/deepmerge, ligados a um alerta raiz. São resultados da data da execução e exigem monitoramento posterior."),
  p("Uma medição exploratória local, com 12 amostras por operação, encontrou medianas de 9,75 ms para clientes, 16,46 ms para processos com página de cinco itens, 18,10 ms para página de 25 itens, 47,49 ms para o painel e 12,07 ms para agenda. Foram observadas, respectivamente, 3, 4, 4, 24 e 3 consultas ao banco. Esses valores descrevem a massa sintética local; não constituem ensaio de carga nem medição da produção."),

  h2("7.6. Testes Práticos na Aplicação Publicada"),
  p("Com autorização do responsável pela conta e pelos avisos automáticos decorrentes das operações, foram executadas ações pela interface publicada com dados fictícios identificados como AUDITORIA TCC. Dos 22 casos práticos, 21 foram aprovados e um ficou bloqueado: o anexo foi cadastrado, mas a abertura ou o download não apresentou resultado observável no navegador integrado. A entrega das notificações aos destinatários não foi comprovada."),
  p("Foram mantidos 19 registros de negócio, conforme solicitado: dois clientes, dois processos, quatro eventos de agenda, duas tarefas, um contrato, três parcelas automáticas, um anexo, um apontamento de horas, uma despesa, uma movimentação e um modelo de documento. Os processos foram identificados como AUDITORIA-TCC-20261027-01 e AUDITORIA-TCC-20261027-02, o segundo em segredo de justiça. Nenhum registro criado foi excluído."),
  p("Os eventos compreenderam dois prazos, para 04/11/2026 às 18h e 12/11/2026 às 16h, e duas audiências, para 10/11/2026 às 14h30 e 18/11/2026 às 9h. O cálculo de cinco dias úteis a partir de 27/10 resultou em 04/11, considerando o feriado de 02/11. Os quatro eventos foram reencontrados após encerrar a sessão e entrar novamente. Um evento duplicado durante a disputa de rascunho foi editado para o segundo prazo planejado, preservando o registro."),
  p("O contrato fictício de R$ 120,00 gerou três parcelas de R$ 40,00; o apontamento de 90 minutos a R$ 200,00 por hora totalizou R$ 300,00; a despesa reembolsável foi de R$ 15,50. O preview do modelo substituiu variáveis do cliente e do processo. Os problemas práticos de rascunho e de data local foram corrigidos, retestados e incluídos na publicação de 28/10, sem alterar retroativamente os registros já criados. O inventário histórico permanece em docs/testes/TESTES_PRATICOS.md. A publicação não equivale a repetir, em produção, todos os casos de segurança executados no ambiente isolado."),

  p("Após publicar, a conferência de 28/10 verificou oito estados da interface: Compromissos, voltar à Dashboard, avançar pelo histórico, abrir a Agenda, usar densidade confortável com menu recolhido e restaurar a aparência original. As preferências permaneceram coerentes nos estados observados. Esse teste manual não é somado aos 22 casos práticos anteriores nem aos 843 automatizados; a observação de todas as mutações transitórias pertence aos E2E. Não houve inclusão ou exclusão de registros de negócio nesse reteste."),

  h2("7.7. Avaliação e Limitações"),
  p("O parecer é APTO COM RESSALVAS, no escopo dos testes locais, do CI remoto e da conferência prática publicada. A execução remota do CI e a revisão implantada foram comprovadas em 28/10 e consultadas novamente em 02/11. Permanecem pendentes a meta de cobertura do frontend, a inspeção administrativa completa de ACL/RLS e do bucket, backup e restauração, agendadores e entrega efetiva por SMTP e push. Não foram executadas chamadas pagas de IA, carga remota ou pagamento real. O bloqueio histórico de abertura ou download do anexo não foi encerrado pelo teste de navegação."),
  p("A rodada local utilizou um PostgreSQL temporário separado da produção, dados de demonstração, navegador Chromium em perfis de computador e celular, testes Django e Jest. As chamadas externas de IA e de consulta cadastral são simuladas nos testes específicos. A massa de testes não contém informações de clientes reais. Os testes de navegação incluem compromisso para assistente, cadastro por etapas, busca que abre o registro, persistência da aparência e conferência de publicação fictícia."),
  p("As verificações automáticas de acessibilidade executam regras WCAG 2 A/AA do axe nas telas cobertas; não constituem certificação nem substituem inspeção por teclado e leitor de tela. Não foram realizados, nesta rodada, teste formal com três a cinco profissionais independentes, avaliação SUS, medição de ganho de produtividade, ensaio de carga representativo ou auditoria externa de segurança. Portanto, não se afirma eficácia comprovada no uso jurídico real, conformidade integral com a LGPD ou ausência de vulnerabilidades."),
  p("Para a avaliação com usuários, propõe-se observar cinco tarefas: cadastrar cliente, criar processo, lançar e conferir prazo, localizar documento e preparar mensagem ao cliente. Devem ser registrados tempo, erros, pedidos de ajuda e conclusão sem intervenção, com questionário SUS ao final. O teste deve usar dados fictícios e consentimento dos participantes; seus resultados só poderão ser apresentados depois da execução."),
  p("A minimização do contexto enviado à IA remove campos estruturados e padrões reconhecidos de identificação e contato, mas não garante anonimização semântica de texto livre. O usuário precisa revisar o conteúdo antes do envio. A anonimização de um cliente também limpa os campos pessoais conhecidos do histórico de alterações, preservando autoria, datas e mudanças não pessoais; a política de retenção precisa considerar os demais registros relacionados e as obrigações aplicáveis ao escritório."),
  h2("7.8. Publicação e Verificação da Versão"),
  p("O código das correções foi registrado em 89b675f, publicado na branch main e validado no GitHub Actions em 28/10/2026. O commit documental 0702332 acrescentou o registro dos deploys, os testes remotos e os arquivos de entrega, preservando o código da aplicação. O histórico anterior foi mantido; os commits novos foram escritos em português com a identidade do proprietário. Nenhuma migração nova foi acrescentada para essa publicação."),
  new Table({
    width: { size: LARGURA_UTIL, type: WidthType.DXA },
    columnWidths: [2700, 6371],
    rows: [
      new TableRow({ tableHeader: true, children: [celula("Registro", { width: 2700, bold: true, shading: AZUL, color: "FFFFFF" }), celula("Identificação verificada", { width: 6371, bold: true, shading: AZUL, color: "FFFFFF" })] }),
      ...[
        ["Aplicação e testes", "89b675f — execução CI 40785092492 aprovada"],
        ["Documentação versionada", "0702332 — branch main consultada em 02/11/2026"],
        ["Frontend Vercel", "dpl_CVF9FccKnuBsXu3ehMCZNPhdnZ3H — READY"],
        ["API Render", "dep-dbh8223bc2fs73frc6i0 — live; commit 89b675f"],
        ["Endereço público", "https://lexnexo.vercel.app"],
      ].map((r, n) => new TableRow({ cantSplit: true, children: r.map((t, i) => celula(t, { width: [2700,6371][i], shading: n % 2 ? "F2F5FA" : "FFFFFF" })) })),
    ],
  }),
  p("Na publicação, o domínio principal da Vercel ainda apontava ao deploy anterior, embora o build novo estivesse pronto. A comparação dos scripts e a inspeção dos aliases confirmaram o problema A14. O alias foi atualizado e o domínio foi registrado como verificado no mesmo projeto, sem branch específica, passando a acompanhar a publicação de produção. A consulta de 02/11 confirmou o deploy documental 0702332 nesse endereço."),
  p("O Render permaneceu com o deploy anterior após o push e a conclusão do CI, apesar da configuração de autoDeploy habilitada. Foi iniciada uma única publicação manual, acompanhada até live. O motivo da ausência de acionamento automático não foi determinado. O serviço e sua URL técnica foram preservados, sem criação de outra API nem alteração de variáveis remotas nessa execução."),
  p("Em 02/11/2026, o repositório continuava em 0702332, sem commit de aplicação posterior. A consulta administrativa confirmou READY na Vercel e live no Render. O site e as duas consultas a /api/health/, pela origem da Vercel e diretamente na API, responderam HTTP 200; a saúde informou status ok e serviço LexNexo. Essas consultas comprovam disponibilidade pontual e identificação dos deploys, sem substituir monitoramento contínuo, ensaio de carga, backup ou avaliação com usuários. Não foram criados ou removidos dados de negócio nessa revisão documental."),
  p("O registro da publicação está em docs/testes/PUBLICACAO-2026-10-28.md e em seu JSON de evidências. A revisão 1.9 foi consolidada em 02/11/2026; as capturas preservam a data de 28/10 e os testes preservam suas respectivas datas de execução. O sumário foi recalculado sobre a versão renderizada, mantendo os títulos em preto."),


  h2("7.9. Nova Auditoria e Revisão da Entrega"),
  p("A execução iniciada em 03/11/2026 partiu de 0702332, preservando as alterações documentais locais. A linha de base aprovou 532 testes Django, 275 Jest e 36 Playwright, total 843. As regressões demonstraram gravação parcial de contrato e parcelas de valor zero/negativo em valores-limite. Foram corrigidas atomicidade e divisão de centavos, sem modificar contratos antigos. A interface também passou a respeitar visualmente o plano no assistente e a não tratar buscas como cadastros não salvos. O teste publicado de foto identificou diferença entre acesso direto à API e proxy da interface; sua situação está nas evidências de publicação da rodada."),
  new Table({ width: { size: LARGURA_UTIL, type: WidthType.DXA }, columnWidths: [2100,1600,1600,1600,2171], rows: [
    new TableRow({tableHeader:true,children:["Data e ambiente","Django","Jest","Playwright","Total"].map((t,i)=>celula(t,{bold:true,shading:AZUL,color:"FFFFFF",width:[2100,1600,1600,1600,2171][i]}))}),
    ...metricasAtuais.rodadas.map(r=>new TableRow({cantSplit:true,children:[r.data+" "+r.ambiente,String(r.django),String(r.jest),String(r.playwright),String(r.total)].map((t,i)=>celula(t,{width:[2100,1600,1600,1600,2171][i],center:i>0}))}))
  ]}),
  p(`Cobertura de linhas: backend ${metricasAtuais.cobertura.backend_linhas}, pacote advocacia sem testes/migrations; frontend ${metricasAtuais.cobertura.frontend_linhas}, JS/JSX de src inteiro. Playwright inclui 38 cenários de navegador e um de integração HTTP do proxy, sem UI. Coberturas não são somadas; a meta frontend de 70% não foi atingida. Fonte comum ao relatório e ao guia: docs/testes/evidencias/metricas-atuais.json.`),
  p("Na conta publicada foram criados e mantidos 18 registros de negócio com prefixo AUDITORIA TCC 20261103: cliente Gama, dois processos, quatro eventos, tarefa, contrato e três parcelas, horas, despesa, documento, movimentação, modelo e feriado de abrangência fictícia. Uma foto sintética foi também persistida. O download do PDF retornou 200 e conteúdo idêntico ao original. A visualização de PDF/relatório em nova aba ficou bloqueada em 03–04/11; o complemento de 05/11 abaixo documenta a correção local e sua situação de publicação. O apontamento de horas conserva 27/10 por restauração de rascunho; não é apresentado como um lançamento datado de 03/11."),
  p("O parecer fornecido em 04/11 analisou uma entrega identificada como TDS-2026-038_RT_v1.pdf e apontou ausência de vídeo e métricas antigas no guia. Os fontes v1.9 já possuíam C1, C2, sequência de autenticação e menção à OpenAI; esta revisão os mantém separados, acrescenta a segunda etapa TOTP e a sequência de prazo e distingue implantação física de componentes lógicos. A divergência de 478/223/11 no guia foi corrigida com a mesma tabela datada deste relatório. As versões anteriores conservam seu valor histórico. O proprietário confirmou em 05/11/2026 a identificação oficial TDS-2026-038, aplicada à nova entrega. Os arquivos antigos que usam 39 são registros históricos e não devem ser usados na submissão final."),
  p("A conferência final de 05/11/2026 corrigiu a abertura de documentos e relatórios após uma resposta assíncrona. A janela é reservada no clique e recebe o conteúdo autenticado posteriormente; quando o navegador bloqueia a nova aba, o sistema oferece o download. Erros fecham a aba vazia e a janela não conserva acesso ao opener. Um segundo ajuste determina o Content-Type pelo arquivo armazenado, preservando application/pdf quando o título informado não tem extensão. Seis regressões Jest falhavam antes e passaram depois; a regressão de MIME do Django e dois novos fluxos de navegador também foram aprovados. O visualizador nativo de PDF pode ser substituído por download no Chromium headless; a comparação confirma os bytes, sem afirmar leitura visual nesse caso."),
  p("Em 09/11/2026, uma nova baseline aprovou 863 casos antes das mudanças. A revisão encontrou sete achados adicionais, A24 a A30, e os corrigiu com regressões: o contrato com parcelas emitidas recusa mudanças de processo, total, modalidade de pagamento e quantidade de parcelas; o estorno limpa a data de pagamento e registra auditoria; entradas JSON, IDs, limites de texto, fusos e cálculo de prazo são validados; o modelo recusa cliente incompatível com o processo; a baixa apresenta falhas e impede repetição pendente; Configurações mantém o foco e fecha por Escape. Metadados e observações de contratos continuam editáveis. Nenhuma parcela antiga foi recalculada."),
  p(`A referência atual é ${metricasAtuais.rodadas.at(-1).total} casos, com cobertura de linhas de ${metricasAtuais.cobertura.backend_linhas}/${metricasAtuais.cobertura.frontend_linhas}. No backend, são 4497 de 4896 linhas; no frontend, 1756 de 4617. A interface permanece 31,97 pontos abaixo da meta. O catálogo inclui casos de perfis, segregação, autenticação, arquivos, calendário, financeiro, formulários, acessibilidade e testes com falhas simuladas, identificados como tais. Os testes de rotas simuladas isolam o service worker; o cenário específico de PWA permite seu uso real. Não se soma cobertura de E2E à de Jest.`),
  p(`A rodada publicada de 09/11 aprovou ${praticosAprovados} de ${praticosAtuais.casos.length} verificações. Cliente e processo Ômega foram criados pela interface; os demais lançamentos e regressões incluem conferências autenticadas da API e confirmação visual dos vínculos. Foram mantidos 15 registros principais: cliente, processo, feriado restrito à comarca sintética, dois eventos, tarefa, movimentação, modelo, documento, horas, despesa, contrato e três parcelas. Não houve exclusão, anonimização, inativação, mudança de credenciais ou pagamento real na conta publicada. A simulação PIX não dá baixa nem representa integração bancária. A inspeção visual da nova aba PDF ficou bloqueada pela política de URL blob da ferramenta; a verificação binária autenticada da API foi aprovada separadamente e não encerra esse bloqueio.`),
  p("A versão de aplicação 98ff6bf foi enviada ao GitHub em 09/11. O CI 42616807545 aprovou 884 casos e os quatro jobs; o complemento 1600b28 acrescentou o cenário PWA e o CI 42620912216 aprovou 885 casos nos quatro jobs. O complemento altera apenas testes. A Vercel publicou a aplicação. O Render não iniciou nova implantação automaticamente na janela observada; uma publicação manual no painel terminou live em dep-dbornn9srm7s73ctj3k0. O modo S3 foi confirmado no painel sem revelar credenciais, e cinco anexos privados foram comparados antes e depois, com bytes e hashes idênticos. Os IDs anteriores das 13 famílias conferidas permaneceram presentes. Isso não comprova ACL completa do bucket, restauração integral em nuvem nem disponibilidade contínua."),
  p("A medição leve local coletou 12 amostras por endpoint: medianas de 3,21 a 25,65 ms em APIClient com PostgreSQL loopback, sem latência HTTP ou concorrência. Dashboard usou 24 consultas; processos e contratos, quatro. Dependências de produção Python/npm não apresentaram alertas conhecidos na consulta de 09/11; as ferramentas npm conservaram 26 alertas transitivos, 23 moderados e três baixos. A busca heurística em fontes versionados e histórico alcançável não encontrou padrões de segredos; não é uma auditoria infalível de todos os formatos."),
  p("Um ensaio local de recuperação gerou pg_dump em formato custom, restaurou em outro banco vazio e comparou as contagens das 39 tabelas públicas com o snapshot do dump, todas idênticas. A base ativa continuava disponível para testes e não foi usada como comparação móvel. O resultado não cobre arquivos do storage nem recuperação em nuvem e não substitui conferir conteúdo linha a linha, políticas de backup ou RPO/RTO. Firefox e WebKit Linux repetiram 41 casos cada, sem falhas na preparação final; o cenário PWA offline ficou restrito ao Chromium e bloqueado nos demais runtimes. WebKit Linux não comprova Safari real em macOS/iOS."),
  p("O vídeo de demonstração deve mostrar interação real, indicar o ambiente e distinguir serviços simulados de integrações externas. Um registro técnico local, quando incluído na entrega, não comprova recebimento real de e-mail/push, chamadas pagas de IA, consulta real ao CNJ ou pagamento bancário. O roteiro de demonstração relaciona os pontos do parecer às evidências disponíveis. Não foram obtidos resultados de usabilidade com profissionais, nem se altera a nota atribuída pelo revisor."),
  h2("7.10. Implantação e Contingência"),
  p("C1 apresenta pessoas e sistemas externos; C2 separa frontend, API, banco e rotinas; C3 detalha módulos lógicos do backend. O diagrama seguinte identifica exclusivamente os nós de implantação. Container no modelo C4 é uma unidade executável ou de armazenamento, sem exigir que toda unidade seja um contêiner Docker."),
  ...fig(`${DIAG}/implantacao.png`, 534, 782, "Nós de implantação e armazenamento", 360),
  p("O esquema PostgreSQL é compartilhado: entidades do negócio possuem relações com Escritorio e a API restringe consultas e vínculos pelo escritorio_id e pelas permissões do usuário. Processo sigiloso impõe restrição adicional ao administrador e ao responsável autorizado. Não se usam esquemas separados por escritório. A política RLS da tabela de fotos está na migration 0037; isso não comprova uma política RLS completa em todas as tabelas do banco publicado. Fotos novas ficam no PostgreSQL; documentos seguem o backend configurado por MEDIA_STORAGE, com bucket S3 privado quando habilitado. O modo S3 foi confirmado no Render em 09/11; ACL completa do bucket e restauração integral em nuvem permanecem sem comprovação operacional."),
  p("A integração de IA usa a API da OpenAI pelo SDK Python no backend; OPENAI_MODEL escolhe o modelo, cujo padrão no código é gpt-4o-mini. A configuração ativa do provedor não foi inferida desse padrão. Não houve chamada paga nesta auditoria. Sem chave ou diante de falha, os fluxos usam mensagens e fallback implementados; o conteúdo deve ser revisado antes de envio a terceiros."),
  p("Se BrasilAPI ou ViaCEP falharem, os dados podem ser preenchidos manualmente. Se DataJud ou DJEN estiverem indisponíveis, o profissional pode registrar movimentação ou prazo manual, identificando sua origem e conferindo a informação no canal oficial. Falhas de e-mail e push exigem conferência do envio, sem presumir recebimento; a agenda interna permanece a referência operacional. O cálculo de prazo é auxiliar e requer conferência jurídica. A indisponibilidade da IA não deve impedir o uso dos cadastros e da agenda."),

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
  p("A evolução registrada em outubro priorizou três aspectos: organização visual com menos informação simultânea, segurança de dados e conferência de ações sensíveis. O cadastro por etapas conserva valores e inclui revisão antes do envio; o menu agrupado e recolhível, a ajuda progressiva e a busca direta favorecem a orientação. O suporte ao CNPJ alfanumérico preserva a compatibilidade com registros anteriores. A conferência de intimações registra autor e horário e é invalidada quando o vencimento muda, sem confundir leitura com validação do prazo."),
  p("Na camada de privacidade, o contexto enviado à IA passou a minimizar informações pessoais estruturadas e padrões reconhecidos; o histórico de auditoria também foi considerado na anonimização de clientes. Essas medidas reduzem exposição, mas não eliminam o risco de dados sensíveis em texto livre nem equivalem a uma declaração de conformidade integral. O sistema não armazena respostas autenticadas da API para uso offline, evitando apresentar dados antigos como atuais."),
  p(`A auditoria de 09/11/2026 aprovou ${metricasAtuais.rodadas.at(-1).total} casos automatizados na referência atual, com ${metricasAtuais.cobertura.backend_linhas} de cobertura de linhas do backend e ${metricasAtuais.cobertura.frontend_linhas} do frontend. A meta da interface continua pendente. Sete novos achados foram corrigidos e retestados. A versão de aplicação 98ff6bf foi publicada na Vercel e no Render; o CI remoto de 09/11 aprovou os quatro jobs. A rodada prática teve ${praticosAprovados} aprovações em ${praticosAtuais.casos.length} verificações, mantendo 15 registros principais fictícios. Os anexos verificados conservaram seus bytes após o deploy. Relatório, guia e roteiro usam métricas datadas e distinguem execução local, CI e conta publicada. O grupo oficial é TDS-2026-038. O parecer continua apto com ressalvas: testes não demonstram ausência de falhas, eficácia jurídica, conformidade legal integral ou prontidão universal de produção. Vídeo e submissão permanecem com os integrantes; integrações, recuperação em nuvem e avaliação com profissionais mantêm limites explicitados.`),
  p("O próximo passo de avaliação é realizar sessões observadas com profissionais de escritórios, usando dados fictícios, registrando erros, tempo, conclusão de tarefas e percepção de usabilidade. Portal do cliente, fluxos configuráveis, versionamento de documentos e integrações de cobrança permanecem evoluções propostas. A principal contribuição do trabalho é uma solução integrada com mecanismos verificáveis de controle e orientação, acompanhada da explicitação de seus limites e das condições para sua continuidade."),
];

// ============================================================
// 10. REFERÊNCIAS BIBLIOGRÁFICAS
// ============================================================
const referencias = [
  h1("10. Referências Bibliográficas"),
  p("SABINO, João Henrique Souza; MUNHOZ, Guilherme. LexNexo: repositório, relatórios de validação e publicação de 28 out. 2026. Disponível em: https://github.com/guimunhoz13/TCCrepository. Consulta documental em: 2 nov. 2026."),
  p("GITHUB ACTIONS. TCCrepository: execução 40785092492, commit 89b675f. 28 out. 2026. Disponível em: https://github.com/guimunhoz13/TCCrepository/actions/runs/40785092492. Consulta em: 2 nov. 2026."),
  p("GITHUB ACTIONS. TCCrepository: execução 41926536601, commit 3a54547. 4 nov. 2026. Disponível em: https://github.com/guimunhoz13/TCCrepository/actions/runs/41926536601. Consulta em: 4 nov. 2026."),
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
