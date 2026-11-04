# Relatório técnico do TCC (gerado por script)

<!-- auditoria-2026-11-04:inicio -->

## Entrega revista em 04 de novembro de 2026

A revisão **1.10** está em [Word](LexNexo_Relatorio_Tecnico_v1.10.docx) e
[PDF](LexNexo_Relatorio_Tecnico_v1.10.pdf). Inclui nova auditoria, tabela datada
compartilhada com o [guia](../Guia-de-Funcionalidades-LexNexo.pdf), implantação
separada de C1/C2/C3, sequências TOTP/prazo, provedor OpenAI e contingências.
Títulos permanecem pretos. As figuras anteriores conservam sua data de origem.

A [resposta ao parecer](RESPOSTA_AO_PARECER-2026-11-04.md) diferencia itens já
existentes no fonte v1.9 de mudanças novas e pendências; vídeo e validação de
entrega externa não foram declarados como concluídos. Código oficial do grupo
em conferência com o proprietário; os novos nomes são neutros.

[Resultados da auditoria](../testes/RELATORIO_VALIDACAO.md),
[métricas únicas](../testes/evidencias/metricas-atuais.json),
[casos práticos preservados](../testes/TESTES_PRATICOS.md).
As versões e contagens abaixo são registros históricos.

<!-- auditoria-2026-11-04:fim -->

> A versão atual é a 1.9, consolidada em 02/11/2026. O relatório distingue auditoria local, CI remoto, publicação e consulta de saúde. As versões anteriores permanecem preservadas.

## Versão 1.9 — atualização de 02/11/2026

O [relatório técnico atual](RT-TDS-2026-39_v1.9.docx) incorpora a publicação do
LexNexo na Vercel e no Render, a execução remota com 843 casos e a correção da
navegação entre Dashboard e Compromissos. A seção 7.8 identifica os commits,
os deploys e a consulta de saúde de 02/11. O quadro de resultados compara os
841 casos locais de 27/10 com os 843 do CI de 28/10, mantendo a cobertura
vinculada somente à medição original.

Também foram atualizados resumo, metodologia, conclusão, armazenamento de
fotos, distinção entre PIX real e de teste e disponibilidade da documentação
OpenAPI. RF21 passou a distinguir a revogação do refresh da expiração do access,
conforme a regra e a implementação existentes. O sumário foi recalculado, as
linhas do backlog deixaram de se partir entre páginas e os títulos das
regras de negócio permanecem junto ao texto correspondente. Os títulos continuam pretos; foram preservadas as 42 figuras,
incluindo as 34 capturas de 28/10, com suas datas de origem.

A consulta desta revisão não equivale a reexecutar as suítes nem a medir nova
cobertura. Evidência documental: [relatorio-tecnico-v19.json](../testes/evidencias/relatorio-tecnico-v19.json).

## Versão 1.8 — títulos em preto de 28/10/2026

O [relatório técnico v1.8](RT-TDS-2026-39_v1.8.docx) usa preto nos títulos e
subtítulos, tanto na formatação direta quanto nos estilos de título do Word.
Conteúdo, capturas, tamanhos de fonte, negrito e espaçamento foram mantidos.
O documento anterior v1.7 permanece preservado como registro histórico.

## Versão 1.7 — identidade LexNexo de 28/10/2026

O [relatório técnico v1.7](RT-TDS-2026-39_v1.7.docx) apresenta 34 capturas
novas da interface LexNexo, incluindo login, painel, API, equipe, segunda etapa
de autenticação, planos e cadastro. As proporções das imagens foram recalculadas;
a imagem antiga de 11 testes Playwright foi substituída pelo quadro dos 34
cenários da auditoria registrada. As descrições identificam dados fictícios,
respostas simuladas e configurações locais sem chaves externas. A revisão de
marca não equivale a uma nova execução integral da auditoria de 27/10.

A versão 1.7 substituiu a 1.6 na entrega de 28/10. Os arquivos v1.4, v1.5 e v1.6
permanecem preservados no repositório como registros históricos. Referências
operacionais ao alias de configuração legado permanecem documentadas por
compatibilidade e não são nomes de marca apresentados na interface.

## Versão 1.6 — auditoria completa de 27/10/2026

O [relatório técnico v1.6](RT-TDS-2026-39_v1.6.docx) incorpora os resultados
da auditoria: 532 testes Django, 275 Jest e 34 Playwright, cobertura de linhas
de 91,47%/35,55%, correções, dependências e limites. As seções 7.5 e 7.6
registram a auditoria e os testes práticos; a seção 7.7 e a conclusão apresentam
o parecer **APTO COM RESSALVAS, no escopo local validado**. Foram preservados
19 registros na conta publicada, com 21 casos práticos aprovados e um bloqueado.
As correções permanecem locais, sem deploy.

Resumo, metodologia, descrição dos testes e conclusão foram atualizados;
o sumário foi recalculado a partir da renderização. As versões v1.4 e v1.5
permanecem preservadas como registros históricos. O [adendo](AUDITORIA-2026-10-27.md)
e os [relatórios de testes](../testes/RELATORIO_VALIDACAO.md) mantêm as evidências
detalhadas. As contagens históricas abaixo pertencem às respectivas revisões.

## Versão 1.5 — revisão de 27/10/2026

Atualiza os identificadores do backlog, separa notificação automática adiada
(RF52) da conferência de prazo implementada (RF53), inclui cadastro por etapas,
CNPJ alfanumérico, navegação agrupada/recolhível, aparência ajustável e busca
direta. Revisa as afirmações de privacidade e acessibilidade e acrescenta um
protocolo de avaliação com usuários, ainda não executado. A conclusão foi
reescrita para separar resultados, limites e trabalhos futuros. As novas
capturas usam apenas a demonstração local com dados fictícios. As verificações
desta versão compreendem 507 testes de backend, 261 de componentes e 19 fluxos
de navegador; quantidades referem-se à rodada, não a cobertura universal.

O documento anterior v1.4 é preservado. A versão 1.5 é uma revisão técnica
para validação pelos autores e orientador, não uma aprovação acadêmica.

O documento `RT-TDS-2026-39` é gerado a partir de `gerar_rt.js` (conteúdo),
`build_rt.js` (estilos e utilitários) e `main.js` (montagem), com a
biblioteca `docx`:

```bash
cd docs/tcc && npm install docx && node main.js   # gera LexNexo_Relatorio_Tecnico_v1.10.docx
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
soffice --headless --convert-to pdf LexNexo_Relatorio_Tecnico_v1.10.docx
python3 paginar.py LexNexo_Relatorio_Tecnico_v1.10.pdf   # grava paginas.json
node main.js                                 # gera de novo com as páginas certas
```

Repita a conversão, paginação e geração até `paginas.json` parar de mudar (em geral uma
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
escritório preenchidos; conclusão, referências e contagens de testes (478 da
API e 223 de componentes).
