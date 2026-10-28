# Relatório de validação do LexNexo

> **Atualização de 28/10/2026:** as correções foram publicadas no GitHub, na Vercel e no Render. O CI remoto aprovou 843 casos. A auditoria original abaixo conserva sua data e seus limites; veja o [registro de publicação](PUBLICACAO-2026-10-28.md) para o estado atual.

**Parecer: APTO COM RESSALVAS, no escopo local validado.** Os fluxos
automatizados passaram após as correções, e os testes práticos criaram e
preservaram dados sintéticos na conta autorizada. Permanecem cobertura
limitada da interface, um alerta baixo na cadeia de ferramentas e verificações
externas/operacionais bloqueadas. Não há aprovação para produção nem prova
de que as correções locais já estejam publicadas.

Data: **27/10/2026**, America/Sao_Paulo. Base Git:
`8b41a295e0d7be677600295eb56537bb2c0f871e`, branch main, com alterações locais
anteriores preservadas. O objeto validado é essa base **mais o diff local**;
não foi criado commit. Os registros JSON podem usar 28/10 em UTC, equivalente
à noite de 27/10 no fuso informado pelo usuário.

## Escopo e método

Inspeção de modelos, serializers, permissões, autenticação, views, URLs,
uploads, integrações, migrações, cliente de API, páginas/painéis, formulários,
service worker, configuração, dependências, documentação e CI. Inventário:
**27 modelos, 37 migrations, 13 páginas, 102 paths OpenAPI e 166 operações**.
As 155 operações protegidas foram verificadas sem token; os subtestes dessa
verificação pertencem a um único método Django, sem inflar a contagem.

Suítes locais usam PostgreSQL exclusivo, fixtures sintéticas e settings que
ignoram `.env`, SMTP real, S3, IA paga e chaves de push. Integrações são
exercitadas por mocks/falhas/fallback. Playwright executou aplicação integrada
real em Chromium desktop/mobile; cenários com APIs interceptadas estão
identificados separadamente no catálogo. Cadastro por etapas em evolucao e
testes de indisponibilidade/rascunho usam interceptação; não comprovam esses
serviços externos. A demonstração real da conta publicada ocorreu à parte.

Ambiente: Linux x86_64, Python 3.14.7, Django 6.0.8/DRF 3.18.2, PostgreSQL
18.6, Node 22.23.2/npm 10.9.8, Next 16.4.2/React 19.2.4. CI usa versões
diferentes de Python/PostgreSQL; o pipeline remoto não foi consultado.

## Resultados reais

| ID | Categoria/cenário | Comando principal | Esperado | Observado | Status | Evidência |
|---|---|---|---|---|---|---|
| V01 | Dependências reproduzíveis | npm ci; python -m pip check | Instalação e dependências coerentes | npm ci 10 s; pip check sem conflitos após atualização | APROVADO | execucoes.json; dependencias.json |
| V02 | Saúde e migrations | manage.py check; makemigrations --check --dry-run | Sem erros/alterações faltantes | Nenhum problema; nenhuma migration nova; cadeia aplicada no banco descartável | APROVADO | execucoes.json |
| V03 | Backend | coverage run --branch … manage.py test | Suíte sem falhas | **532 aprovados, 0 reprovados, 0 bloqueados/skips**; reteste após dependências: 44,754 s de suíte | APROVADO | casos-executados.json; cobertura-backend.json |
| V04 | Frontend | npm test -- --runInBand --coverage … | Suíte sem falhas | **275 aprovados**, 46 suítes, 0 falhas/skips; cerca de 7 s | APROVADO | casos-executados.json; cobertura-frontend.json |
| V05 | Qualidade/build | npm run lint -- --max-warnings=0; npm run build | Lint e compilação concluídos | Sem avisos; build de produção concluído; 9 s/5 s na rodada integrada | APROVADO | execucoes.json |
| V06 | Integração/navegador | playwright test --reporter=json --trace=off | Fluxos e asserções sem falhas | **34 aprovados, 0 reprovados/skips/flaky**; reteste após dependências 74,821 s | APROVADO | execucoes.json; catálogo E2E |
| V07 | API e deploy por configuração | spectacular --validate --fail-on-warn; check --deploy --fail-level WARNING | Schema válido e sem avisos ativos | Ambos passaram; HSTS preload W021 silenciado conforme projeto | APROVADO | execucoes.json; EVIDENCIAS.md |
| V08 | Python vulnerabilidades | pip-audit -r requirements.txt; pip-audit --local | Sem alertas conhecidos | Resolução nova já passava; ambiente instalado tinha 46 entradas/5 pacotes, corrigidas; reteste instalado sem alertas | APROVADO | dependencias.json |
| V09 | npm em produção/gate alto | npm audit --omit=dev; npm audit --audit-level=high | Sem alertas de produção/alto | Zero em produção; zero alto/crítico após corrigir zod | APROVADO | dependencias.json |
| V10 | npm inventário completo | npm audit --json | Zero alerta conhecido, inclusive ferramentas | Cinco pacotes afetados na cadeia de um advisory baixo do deepmerge/Jest | REPROVADO | dependencias.json |
| V11 | API e volume leve local | medir-api-auditoria.py | 200 e consultas controladas | 60 amostras; processos mantêm 4 consultas para páginas de 5 e 25; dashboard 24 | APROVADO | desempenho-local.json |
| V12 | Uso prático publicado | Navegador na conta autorizada | Criar e preservar dados sintéticos | **21 verificações aprovadas e 1 bloqueada**; 19 registros, incluindo parcelas | APROVADO | TESTES_PRATICOS.md; capturas |
| V13 | Entrega por provedores/IA paga | Staging com credenciais e destinatários controlados | Entrega e custos verificáveis | Não executada; criação não comprova entrega SMTP/push | BLOQUEADO | R04, EVIDENCIAS.md |
| V14 | ACL/backup/restore/deploy remoto | Inspeção administrativa e recuperação em clone | Configuração e recuperação confirmadas | Não executadas; nenhum SQL/migrate/deploy remoto | BLOQUEADO | Guia operacional |
| V15 | Navegadores adicionais | Firefox/WebKit | Mesmos cenários aprovados | Browsers não instalados/configurados nesta rodada | BLOQUEADO | RNF01 |
| V16 | Avaliação com usuários/cores | Protocolo de usabilidade e revisão visual | Dados observados com participantes | Não houve participantes/SUS nem simulação cromática completa | BLOQUEADO | RNF06/RNF13; roteiro de usabilidade |
| V17 | Meta de cobertura frontend | Jest incluindo src inteiro | Pelo menos 70% de linhas | 35,55%; meta não atingida | REPROVADO | cobertura-frontend.json |
| V18 | CI remoto/versão publicada | Consultar pipeline e revisão implantada | Associar execução e versão pública | Não verificado administrativamente | BLOQUEADO | RNF19 |
| V19 | Automação ao cliente n8n | Requisito RF52 adiado | Não declarar como implementado | Ausente, conforme backlog | NÃO APLICÁVEL | MATRIZ_RASTREABILIDADE.md |

Contagem das **19 verificações agrupadas V01–V19**: 11 APROVADO,
2 REPROVADO, 5 BLOQUEADO e 1 NÃO APLICÁVEL. Isso é uma classificação de
verificações, distinta dos **841 casos automatizados aprovados**
(532 + 275 + 34), dos 22 casos práticos e dos 19 registros criados.
O bloqueio PR14 da abertura de anexo permanece explícito dentro de V12.

## Cobertura efetivamente coletada

| Métrica | Backend | Frontend |
|---|---:|---:|
| Linhas | **91,47%** (4420/4832) | **35,55%** (1621/4559) |
| Ramos | 79,04% (822/1040) | 31,85% (1090/3422) |
| Funções | Não coletada por coverage.py | 29,49% (425/1441) |
| Instruções/combined | 89,27% combinando linhas e ramos | 35,06% de statements |
| Meta de linhas | 80%, atingida | 70%, faltam 34,45 pontos percentuais |

Backend medido em advocacia, excluindo tests e migrations; core/settings e
storage não entram nesse denominador, embora parte de seu comportamento seja
testada. Frontend inclui todos os JS/JSX de src; não inclui CSS, public e
cobertura de navegador. Não somar cobertura Playwright à Jest sem
instrumentação compatível. Lacunas relevantes: dashboard/painéis grandes,
fluxos secundários de conta, recuperação/cadastro e vários métodos do cliente
de API. As listas por arquivo indicam exatamente o que falta.

## Correções e regressões

Foram corrigidos 12 grupos de achados A01–A12: vazamento por perfil na ficha,
SSRF/validação do push, gravação parcial de configurações, filtros que causavam
500, bypass de validadores de upload, concorrência de rascunhos, datas UTC,
formulários que podiam enviar credenciais pela URL sem JavaScript,
dependências instaladas vulneráveis, status incorreto no schema e falhas de
configuração/isolamento dos testes. As reproduções anteriores, gravidades,
arquivos e retestes estão em [DEFEITOS_E_RISCOS.md](DEFEITOS_E_RISCOS.md).

O ambiente Python foi atualizado para Pillow 13.0.0, dnspython 2.9.0 e
certifi 2026.10.23, com mínimos registrados no requirements; pip/filelock
também foram atualizados no venv. zod passou a 4.6.7 no lockfile npm. Não foi
aplicado npm audit fix --force. Alertas baixos remanescentes são de ferramenta
e não foram ocultados. O audit de requirements resolve pacotes novos e não
substitui o audit do ambiente realmente instalado.

## Desempenho, segurança e limites

Medições locais com APIClient: medianas entre 9,75 ms e 47,49 ms nos cinco
endpoints amostrados, 12 requisições por endpoint, com captura SQL. A dashboard
realiza 24 consultas no conjunto sintético; listagem de processos mantém quatro
consultas com 5/25 registros. Não houve carga contra serviços publicados nem
conclusão de capacidade de produção.

Autenticação, perfis, IDs de outro escritório, sigilo, refresh/logout,
limites, uploads e falhas de integrações têm testes negativos. O scan de
segredos por padrões não encontrou candidatos nos arquivos rastreados
inspecionados; não é uma análise exaustiva do histórico Git. HTTPS/CSP,
cookies e CORS foram inspecionados no código; o deploy check simulou settings
de produção sem afirmar que esses settings estão ativos nos provedores.
Access/refresh em localStorage e CSP unsafe-inline continuam riscos de
arquitetura documentados. Não foi produzido parecer de conformidade legal.

A aplicação publicada foi usada com autorização explícita para escrita de
registros sintéticos e avisos automáticos. Esses registros permanecem na conta.
Os defeitos práticos de rascunho/data foram corrigidos somente localmente;
exigem revisão/publicação antes de repetir a validação do site corrigido.

## Entrega e ações prioritárias

1. Revisar o diff e as correções de segurança antes de publicar; confirmar
   versões e permissões reais dos provedores. Não houve deploy nesta execução.
2. Retestar os cenários práticos após publicação, preservando AUDITORIA TCC.
   Repetir abertura/download do anexo em navegador com popups permitidos.
3. Ampliar cobertura de comportamento dos painéis críticos e encerrar os
   alertas baixos de ferramentas quando existir atualização compatível.
4. Validar backup/restauração, SMTP/push/CNJ/storage em staging e executar o
   protocolo com participantes antes de alegar usabilidade ou prontidão operacional.

Documentos entregues: plano, matriz, inventário/casos, este relatório,
defeitos/riscos, evidências, arquitetura/API/manual, testes práticos e adendo
acadêmico, além do [relatório técnico v1.8](../tcc/RT-TDS-2026-39_v1.8.docx),
que incorpora os resultados e limites nas seções 7.5–7.7 e na conclusão.
A revisão documental de 28/10/2026 atualizou 34 capturas e a identidade LexNexo,
sem contabilizar essa revisão como nova execução integral da suíte.
README, guia de deploy e documentação histórica foram contextualizados.
Estado final do Git e arquivos envolvidos: [git-estado-final.txt](evidencias/git-estado-final.txt).
Não houve commit, push, merge, deploy nem migração em banco remoto.

## Reteste da dashboard

**28/10/2026, America/Sao_Paulo — A13 corrigido localmente.** Ao navegar
entre Dashboard e Compromissos, cada página remontava `PreferencesProvider`.
A densidade voltava temporariamente a `comfortable` antes de recuperar a
escolha salva. Isso alterava espaçamentos e dava a impressão de que a página
mudava de modo sozinha. O provider passou para `dashboard/layout.js`, que
preserva o estado entre essas rotas; os painéis continuam próprios de cada página.

Antes da correção, os dois novos cenários produziram **1 falha e 1 aprovação**:
compacto com menu expandido apresentou a troca transitória; confortável com
menu recolhido passou. Os testes observam mutações durante toda a navegação,
incluindo retorno à dashboard, histórico voltar/avançar e abertura da Agenda
partindo de Compromissos. Uma asserção só do estado final não detectaria a falha.

| Verificação após a correção | Resultado |
|---|---|
| `npm run build`, API local configurada | APROVADO; build de produção concluído |
| `npm run lint -- --max-warnings=0` | APROVADO; sem avisos |
| `npm test -- --runInBand` | 275 aprovados, 46 suítes; sem falhas/skips |
| Playwright completo contra `next start` e API real local | 36 aprovados (33 computador e 3 celular), em 78,289 s; zero falhas, skips ou flaky |
| Dois novos cenários de aparência durante a navegação | Ambos aprovados, incluídos nos 36 acima |

Esta rodada reexecutou o frontend e acrescentou dois casos E2E. Os 841 casos
e a cobertura da auditoria de 27/10 acima permanecem resultados históricos;
não houve nova execução do backend nem recálculo de cobertura nesta correção.
API e PostgreSQL foram locais, com dados de demonstração e integrações externas
isoladas. Os registros da conta publicada foram preservados. Não houve commit,
push ou deploy; a versão publicada não foi retestada nesta rodada.

Evidência sanitizada, comandos, catálogo dos 36 casos e hashes dos quatro arquivos:
[regressao-dashboard-2026-10-28.json](evidencias/regressao-dashboard-2026-10-28.json).

## Publicação autorizada e reteste online

Em 28/10/2026, o proprietário autorizou commit, push e publicação. O código
validado foi identificado pelo commit 89b675f e confirmado na Vercel e no Render.
O CI remoto executou 532 testes Django, 275 Jest e 36 Playwright, todos aprovados,
além do job de Compose. A13 foi conferido na sessão publicada nos dois modos de
aparência, com histórico do navegador e painel Agenda. A14 corrigiu o vínculo
do domínio principal da Vercel, que ainda apontava à versão anterior.

Essa rodada passa a comprovar o CI e a revisão publicada (V18); não encerra as
demais pendências operacionais. Nenhuma alteração do histórico antigo foi enviada.
Procedimento, identificadores dos deploys e limites:
[PUBLICACAO-2026-10-28.md](PUBLICACAO-2026-10-28.md).
