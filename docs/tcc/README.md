# Relatório técnico do TCC (gerado por script)

O documento `RT-TDS-2026-39` é gerado a partir de `gerar_rt.js` (conteúdo),
`build_rt.js` (estilos e utilitários) e `main.js` (montagem), com a
biblioteca `docx`:

```bash
cd docs/tcc && npm install docx && node main.js   # gera RT-TDS-2026-39_v1.4.docx
```

Os diagramas ficam em `diagramas/*.puml` (PlantUML) e são renderizados com
`plantuml -tpng diagramas/*.puml`. As capturas de tela (`print_*.png`) foram
tiradas do sistema rodando sobre `python manage.py popular_demo`.

## Páginas do sumário

O sumário é montado a partir da lista `TITULOS_SUMARIO` de `gerar_rt.js`, e
as páginas vêm de `paginas.json`. Esse arquivo é gerado lendo o PDF
renderizado (precisa de LibreOffice e poppler-utils):

```bash
node main.js
soffice --headless --convert-to pdf RT-TDS-2026-39_v1.4.docx
python3 paginar.py RT-TDS-2026-39_v1.4.pdf   # grava paginas.json
node main.js                                 # gera de novo com as páginas certas
```

Repita as duas últimas etapas até `paginas.json` parar de mudar (em geral uma
passada basta). Ao acrescentar uma seção, inclua o título também em
`TITULOS_SUMARIO`.

## Versão 1.1

Incorpora as Partes 5, 6 e 7 do plano de melhorias: perfis de acesso e
equipe, processo em segredo de justiça, verificação em duas etapas, direitos
do titular (LGPD), intimações do DJEN com prazo calculado, cobrança por PIX,
atualização do cliente em linguagem simples, quadro Kanban, agenda no
calendário do celular, notificações push, documentação OpenAPI e testes de
ponta a ponta no CI. Foram revistos o resumo, a introdução, o backlog
(RF38–RF48), os requisitos não funcionais (RNF15–RNF20), as regras de negócio
(RN26–RN34), os casos de uso (com o novo caso 4.2.5), os diagramas (casos de
uso, classes, banco de dados, contexto, containers, componentes e sequência
do DJEN), os protótipos (seções 6.14 a 6.25), a arquitetura (seção 7.4,
integração contínua), os trabalhos futuros, a conclusão e as referências.

## Versão 1.2

Incorpora os planos de assinatura: o Gratuito, sem pagamento, para qualquer
escritório, e o Básico e o Profissional com mais limites e recursos. Foram
revistos o resumo, a descrição da solução, os objetivos, o escopo, o Business
Model Canvas (modelo freemium), o backlog (RF49), as regras de negócio (RN35),
os casos de uso (ator Visitante, Consultar Plano e Uso dos Limites e Verificar
Limite do Plano; fluxos alternativos em 4.2.2 e 4.2.4), o diagrama de classes,
os protótipos (seção 6.26), os componentes, os trabalhos futuros (cobrança
online das assinaturas), a conclusão e as contagens de testes (445 da API e 200
de componentes).

## Versão 1.3

Incorpora os feriados locais no cálculo de prazos: RF50 e RN36; RN14, RN30 e
RF22 revistas; FeriadoLocal nos diagramas de classes, de banco de dados e de
casos de uso (Cadastrar Feriados Locais estende Gerenciar Agenda); tabela
feriado_local na modelagem de dados; seção 6.27 com a aba de feriados e a
calculadora; trabalhos futuros (importação do calendário dos tribunais),
conclusão e contagens de testes (459 da API e 205 de componentes).

## Versão 1.4

Incorpora o preenchimento dos dados da empresa pelo CNPJ (BrasilAPI): RF51,
RNF21 e RN37; resumo e escopo revistos; caso de uso Preencher Dados pelo CNPJ
(estende Gerenciar Clientes e Cadastrar Escritório); BrasilAPI e ViaCEP no
diagrama de contexto; seção 6.28 com o cadastro de cliente e a criação de
escritório preenchidos; conclusão, referências e contagens de testes (466 da
API e 221 de componentes).
