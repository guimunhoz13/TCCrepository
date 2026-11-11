# Relatório de validação do LexNexo

## Reteste integrado de 11/11/2026 — TDS-2026-038

**951 testes aprovados: 550 Django + 356 Jest + 45 Playwright**, sem falhas ou
casos ignorados na rodada local final. Os 45 Playwright incluem 44 cenários de
navegador (41 desktop e três móveis) e uma integração HTTP/proxy sem UI.
Passaram lint sem avisos, build, check Django, detecção de migrations faltantes,
OpenAPI sem avisos e aplicação integral das migrations em PostgreSQL isolado.

| Métrica | Antes (09/11) | Atual (11/11) | Meta / resultado |
|---|---|---|---|
| Testes Jest | 290 / 49 suítes | 356 / 63 suítes | 66 casos novos |
| Linhas frontend | 1756/4617 = 38,03% | 3339/4623 = 72,22% | 70%, ATINGIDA |
| Instruções frontend | — | 3641/5152 = 70,67% | Informativa |
| Funções frontend | — | 847/1456 = 58,17% | Informativa |
| Ramos frontend | 34,02% | 2141/3478 = 61,55% | Informativa |
| Linhas backend | 4497/4896 = 91,85% | 4497/4896 = 91,85% | 80%, ATINGIDA |
| Ramos backend | 831/1042 = 79,75% | 831/1042 = 79,75% | Informativa |

O escopo frontend continua **todo `src/**/*.{js,jsx}`**, incluindo arquivos ainda
sem casos. Não foram excluídos componentes para cumprir a meta e não se somou
Playwright à cobertura Jest. As seis linhas adicionais decorrem dos tratamentos
de erro. Cobertura de linhas não é porcentagem de funcionalidades prontas e não
prova ausência de defeitos. Funções, ramos, módulos específicos e combinações de
estado continuam como oportunidades de melhoria.

A coleta é padrão em `jest.config.mjs`, com `coverageThreshold.global.lines=70`.
Assim, `npm test`, `npm run test:coverage` e o comando existente do CI
`npm test -- --ci` verificam a mesma meta. O comando do CI foi conferido localmente
com 356 aprovações. O workflow remoto não foi alterado; suas alterações locais de
outro trabalho foram preservadas fora do commit.

Os novos cenários cobrem painéis, formulários de acesso, sessão e arquivos,
dashboard, preferências, onboarding e assistente, conferindo payloads, relações,
erros, cancelamentos e novas tentativas. As regressões A31–A33 falharam antes e
passaram após as correções de feedback de status/reembolso e foco no assistente.
São testes de componentes reais com fronteiras HTTP e serviços externos simulados.

Fonte: [execuções](evidencias/2026-11-11/execucoes.json),
[catálogo dos 951 casos](evidencias/2026-11-11/inventario-e-casos.md),
[cobertura frontend](evidencias/2026-11-11/cobertura-frontend.json),
[cobertura backend](evidencias/2026-11-11/cobertura-backend.json),
[ampliação e regressões](evidencias/2026-11-11/ampliacao-frontend.json) e
[métricas únicas](evidencias/metricas-atuais.json).
Código registrado em `11a128a`, com mensagem em português. O [CI 43113561017](https://github.com/guimunhoz13/TCCrepository/actions/runs/43113561017)
aprovou os quatro jobs e os mesmos 951 casos. A cobertura de linhas foi 72,22%
também no CI; ramos ficaram em 61,58% nessa execução remota e 61,55% localmente,
medidas próprias. A Vercel publicou o frontend; assets do alias público e do deploy
foram idênticos, e site/health responderam 200. [Evidência remota](evidencias/2026-11-11/ci-publicacao.json).
Não se iniciou publicação manual do backend, cujo código não mudou nesta rodada.

O relatório v1.14 é entregue separadamente do guia. Os testes práticos de produção
de 09/11 mantêm essa data; nenhum registro publicado foi apagado nesta rodada.
Permanecem as ressalvas operacionais de integrações, ferramentas de desenvolvimento,
ACL/RLS completa, recuperação em nuvem, Safari real e usabilidade com profissionais.
Vídeo e submissão cabem aos integrantes. As seções abaixo são histórico datado.


<!-- auditoria-2026-11-09:inicio -->

## Auditoria final de 09/11/2026 — TDS-2026-038

Repetições finais: **41 casos aprovados no Firefox e 41 no WebKit Linux**,
com um cenário PWA bloqueado em cada runtime, validado somente no Chromium.
Os cliques prematuros da preparação anterior foram corrigidos aguardando o
estado pronto da dashboard; não se usaram retries. Isso não comprova Safari
real. [Resultados e limites](evidencias/2026-11-09/navegadores.json).

**APTO COM RESSALVAS.** Referência final: **885 testes** — 550 Django, 290 Jest e
45 Playwright (44 cenários de navegador, três deles em viewport móvel, e um
HTTP/proxy sem UI). Rodadas e repetições entre navegadores não se somam.
Cobertura de linhas: **91,85% backend e 38,03% frontend**. A meta frontend de
70% permanece pendente; não foram excluídos componentes para elevar a medida.

Sete achados adicionais, A24–A30, foram corrigidos e retestados: consistência
contrato/parcelas, estorno e auditoria, entradas malformadas, cálculo de prazo,
vínculo cliente/processo no modelo, erro de baixa e foco/Escape em Configurações.
A aplicação `98ff6bf` foi publicada na Vercel e no Render. O CI dessa versão
aprovou 884 casos; o CI complementar [42620912216](https://github.com/guimunhoz13/TCCrepository/actions/runs/42620912216) aprovou 885 após acrescentar o caso PWA.

Na conta publicada: **37 APROVADO e 1 BLOQUEADO em 38 verificações**, com **15 novos
registros principais mantidos**. Cliente e processo foram criados pela interface;
os demais lançamentos tiveram conferência autenticada e confirmação visual na ficha.
Nenhum pagamento real, exclusão ou anonimização foi feito em produção. Cinco
anexos conservaram bytes/SHA-256 e os IDs anteriores de 13 famílias foram preservados.
A inspeção visual da nova aba PDF foi bloqueada pela política de URL blob da
ferramenta; a verificação binária da API tem evidência independente.

Fontes: [execuções](evidencias/2026-11-09/execucoes.json),
[catálogo](evidencias/2026-11-09/inventario-e-casos.md),
[práticos](evidencias/2026-11-09/praticos.json),
[publicação](PUBLICACAO-2026-11-09.md) e [métricas únicas](evidencias/metricas-atuais.json).

### Verificações e limites

| Verificação | Resultado | Estado |
|---|---|---|
| Django, Jest e Playwright Chromium/mobile | 550 + 290 + 45; sem falhas na rodada final | APROVADO |
| Lint, build, check, migrations, schema OpenAPI | Todos concluídos; nenhuma migration nova | APROVADO |
| Configuração de produção simulada | check --deploy sem problemas; um aviso HSTS preload já silenciado | APROVADO |
| Acessibilidade e teclado | Axe em 18 estados, modal, Escape e foco | APROVADO |
| PWA | Worker real, tela offline e ausência de API/dashboard no Cache Storage | APROVADO no Chromium |
| Dependências de produção | pip-audit e npm --omit=dev sem alertas conhecidos | APROVADO |
| Ferramentas npm | 26 alertas transitivos: 23 moderados e três baixos; zero altos/críticos | REPROVADO, A17 |
| Cobertura frontend | 38,03%, contra meta de 70%; déficit 31,97 pontos | REPROVADO |
| Heurística de segredos | Zero padrões em fontes versionados e patches alcançáveis; não é certificação | APROVADO |
| Desempenho leve local | 12 amostras/endpoint, mediana 3,21–25,65 ms em APIClient; sem rede/carga | APROVADO |
| Restauração local | pg_dump custom → banco vazio; contagens das 39 tabelas do snapshot idênticas | APROVADO |
| Integrações externas | SMTP/push recebidos, chamada paga IA e periodicidade operacional não comprovados | BLOQUEADO |
| Nuvem e usuários | ACL/RLS completa, recuperação integral em nuvem, carga remota, Safari real e estudo com profissionais | BLOQUEADO |
| RF52 | Adiado conforme backlog, sem declaração de implementação | NÃO APLICÁVEL |

[Ensaio de restauração local](evidencias/2026-11-09/restauracao-local.json): não inclui arquivos de storage nem recuperação em nuvem.

O backend cobre 4.497/4.896 linhas e 831/1.042 ramos; o frontend cobre
1.756/4.617 linhas. Core/settings, migrations e testes não compõem o denominador
backend. A medição frontend considera todo src JS/JSX; E2E não foi somado à cobertura.
Os testes externos controlados usam mocks explicitamente identificados. Um retorno
200 ou um teste anônimo dos endpoints não comprova todos os fluxos de cada operação.

As seções datadas anteriores são histórico e não substituem esta referência.

<!-- auditoria-2026-11-09:fim -->

<!-- auditoria-2026-11-05:inicio -->

## Consolidação final de 05/11/2026 — grupo TDS-2026-038

Identificação confirmada pelo proprietário: **TDS-2026-038**. A entrega atual é o
[relatório técnico v1.11](../tcc/TDS-2026-038_Relatorio_Tecnico_v1.11.pdf), com
[Word editável](../tcc/TDS-2026-038_Relatorio_Tecnico_v1.11.docx) e
[manual ilustrado](../Guia-de-Funcionalidades-LexNexo.pdf).

A execução local final aprovou **863 casos**: 536 Django,
288 Jest e 39 Playwright (38 de navegador,
três deles no celular, e uma integração HTTP/proxy sem UI). Rodadas não se somam.
Cobertura de linhas: **91,49% backend / 36,93% frontend**;
a meta frontend de 70% continua como melhoria de qualidade, sem exclusão de código
para inflar a medida. O CI anterior de 04/11 possui 854 casos e mantém sua data.

Foram corrigidas a abertura tardia de abas de documentos/relatórios e a perda do
tipo PDF quando o título não tem extensão. Há seis regressões Jest, uma Django
e dois novos fluxos de navegador. Nenhum registro publicado foi removido ou alterado
por essas correções. As 43 verificações práticas de 03–04/11 (41 aprovadas e duas
bloqueadas) são históricas; os novos cenários locais não são renomeados como testes
publicados. A publicação dessas novas mudanças aguarda a reconexão ao Render e a
verificação do armazenamento dos documentos antes de um push que possa disparar deploy.

As correções documentais obrigatórias do parecer estão prontas, com C1/C2/C3,
implantação separada, sequências, OpenAI e métricas comuns. **Vídeo não produzido**:
a gravação e submissão ficam com os integrantes. RF52 permanece no backlog previsto.
Serviços externos pagos, recebimento SMTP/push, recuperação integral, estudo com
profissionais e meta de cobertura não são declarados concluídos sem evidência.

Evidências: [execuções](evidencias/2026-11-05/execucoes.json),
[catálogo](evidencias/2026-11-05/inventario-e-casos.md),
[regressões](evidencias/2026-11-05/regressoes.json),
[navegadores](evidencias/2026-11-05/navegadores.json) e
[fonte única de métricas](evidencias/metricas-atuais.json).
As seções datadas abaixo preservam as situações observadas nas rodadas anteriores.

<!-- auditoria-2026-11-05:fim -->

<!-- auditoria-2026-11-04:inicio -->

## Resultado histórico consolidado em 04/11/2026

**APTO COM RESSALVAS, no escopo validado.** Nova auditoria iniciada em 03/11,
com reteste integral em 04/11: **854 casos automatizados aprovados**, sem
falhas, skips ou flaky. Base inicial `0702332fa4c86c14aab6c679d51ec7f054b11870`;
correções financeiras em `b58034d846b688b7c11b83ab97de8b402c98e683`, interface em
`7219e1321831052b4eea90e4bded203202626a7a` e proxy de fotos em
`3a54547` (hash completo no catálogo). Alterações locais documentais anteriores
foram preservadas. Data e fuso: 03–04/11/2026, America/Sao_Paulo.

### Execução e rastreabilidade

| Data | Ambiente | Django | Jest | Playwright | Total |
|---|---|---:|---:|---:|---:|
| 2026-10-27 | local | 532 | 275 | 34 | 841 |
| 2026-10-28 | CI | 532 | 275 | 36 | 843 |
| 2026-11-03 | local | 535 | 282 | 36 | 853 |
| 2026-11-04 | local | 535 | 282 | 37 | 854 |
| 2026-11-04 | CI | 535 | 282 | 37 | 854 |

A tabela é gerada da [fonte única](evidencias/metricas-atuais.json), também
usada pelo relatório técnico e pelo guia. As rodadas não se somam: o total
corrente é 854. Casos protegidos por subtestes não são inflados na contagem.
Catálogo atual: [854 casos identificados](evidencias/2026-11-04/inventario-e-casos.md).
Inventário: 27 modelos, 37 migrations, 13 páginas, 102 paths e 166 operações.
O cenário anônimo das 155 operações protegidas não comprova todos os seus
fluxos positivos. Requisitos e limites permanecem na matriz RF/RNF.

| Categoria | Comando / procedimento | Observado | Estado | Evidência |
|---|---|---|---|---|
| Django | coverage run --branch … manage.py test | 535 aprovados; 31,572 s de suíte | APROVADO | [execuções](evidencias/2026-11-04/execucoes.json) |
| Jest | npm test -- --runInBand --coverage | 282 aprovados, 47 suítes; 12 s do comando | APROVADO | catálogo e cobertura frontend |
| Playwright | playwright test --reporter=json --trace=off | 37 aprovados; 82,333 s; 36 cenários Chromium + 1 integração HTTP/proxy sem UI; 0 falhas/skips/flaky | APROVADO | catálogo e execuções |
| Build e lint | npm run build; npm run lint -- --max-warnings=0 | Build concluído, lint sem avisos; 4 s/14 s | APROVADO | execuções |
| Django/schema/migrations | check; makemigrations --check --dry-run; spectacular --validate --fail-on-warn | Sem erro; nenhuma migration nova; cadeia aplicada somente no banco exclusivo | APROVADO | execuções e operações API |
| Configuração de deploy | check --deploy com settings simulados de produção | Passou; aviso HSTS preload deliberadamente silenciado conforme projeto | APROVADO | [evidências da rodada](EVIDENCIAS.md) |
| Dependências de produção | pip-audit requirements; npm audit --omit=dev | Sem alertas conhecidos na consulta de 04/11 | APROVADO | JSONs datados de 04/11 |
| Ferramentas npm | npm audit completo | 26 entradas transitivas, 23 moderadas/3 baixas; zero altas/críticas; três advisories raiz | REPROVADO | npm-audit.json, A17 |
| Cobertura frontend | Jest incluindo src inteiro | 36,17% de linhas; meta 70% não atingida | REPROVADO | cobertura-frontend.json |
| Medição leve local | APIClient, 12 amostras por operação | Medianas 3,72–25,24 ms; processos 4 consultas com páginas de 5/25, dashboard 24 | APROVADO | desempenho-local.json |
| Práticos publicados | Interface e conferências autenticadas da massa sintética | 41 APROVADO, 0 REPROVADO, 2 BLOQUEADO em 43 verificações; consultar reteste da foto | APROVADO no escopo aprovado | [casos e dados preservados](TESTES_PRATICOS.md) |
| CI remoto atual | GitHub Actions 41926536601 | Quatro jobs aprovados; 535+282+37=854; execução remota não soma à local | APROVADO | evidencias/2026-11-04/ci.json |
| PDF/relatório em nova aba | Navegador integrado | Nova aba/conteúdo não observável; download binário da API aprovado separadamente | BLOQUEADO | PR26-21/29 |
| Serviços externos e recuperação | Entrega SMTP/push, IA paga, agendador, ACL/RLS/bucket completo, backup/restore | Não comprovados em operação real; mocks e inspeção não substituem essa validação | BLOQUEADO | riscos R03–R08 |
| Navegadores e usuários | Firefox/WebKit, estudo com profissionais/SUS e carga remota | Não executados; sem conclusão de capacidade ou eficácia jurídica | BLOQUEADO | RNFs e resposta ao parecer |
| RF52 | Notificação automática ao cliente via n8n | Adiado, sem implementação encontrada | NÃO APLICÁVEL | backlog |

Os estados da tabela classificam verificações agrupadas; não se somam aos
854 casos, nem aos registros criados. O agrupamento prático aprovado conserva
seus casos reprovados/bloqueados identificados individualmente.

### Cobertura e ambiente

| Métrica de 04/11 | Backend | Frontend |
|---|---:|---:|
| Linhas | 91,49% (4430/4842) | 36,17% (1653/4569) |
| Ramos | 79,08% (824/1042) | 32,63% (1120/3432) |
| Meta de linhas | 80%, atingida | 70%, faltam 33,83 pontos |

Backend cobre advocacia, sem tests/migrations; core/settings/storage não
integram esse denominador. Frontend cobre JS/JSX de src inteiro, sem CSS/public.
Não somar cobertura de Playwright à Jest. Lacunas incluem painéis grandes,
fluxos secundários de autenticação/conta e métodos do cliente de API.

Linux x86_64, Python 3.14.7, Django 6.0.8, DRF 3.18.2, PostgreSQL 18.6,
Node 22.23.2, Next 16.4.2, React 19.2.4. PostgreSQL exclusivo em loopback,
settings_auditoria, LEXNEXO_ENV_FILE=/dev/null, e-mail em memória, sem chaves
pagas e integrações isoladas. Nenhum seed/reset, teste de carga ou migração
administrativa foi executado na base publicada. Um reteste interrompido antes
da conclusão em 03/11 não foi contado; a rodada completa de 04/11 está preservada.

Reprodução: `PG_BIN=… PG_SHARE=… AUDIT_OUTPUT_DIR=… AUDIT_DB_PORT=55445
AUDIT_API_PORT=18005 AUDIT_FRONTEND_PORT=13005 bash scripts/auditoria-local.sh`.
Use diretório e cluster NOVOS e as bibliotecas compatíveis do PostgreSQL.
A tentativa inicial de 04/11 falhou antes de iniciar o banco por libssl.so.4
ausente; a biblioteca oficial foi extraída apenas no runtime isolado, sem
alterar o sistema, e o reteste subsequente passou. Logs brutos e pgdata não
integram a entrega; JSONs são resumos sanitizados.

### Correções, publicação e documentação

A15/A16 corrigem rollback de contrato/parcelas e divisão de centavos: três
regressões falhavam antes e passaram depois. A18 corrige a data fixa do
gerador de evidências. A19 restringe o chat conforme o plano (3 falhas/1
aprovação antes, 4 aprovações depois). A20 elimina o aviso de descarte em
buscas (duas falhas antes, 17 testes do componente passam depois). A19/A20
passaram também na interface publicada. A21 trata o proxy de fotos, com
API direta 200 e Vercel 404 antes da correção; o teste local passava antes,
portanto não é apresentado como reprodução local da falha exclusiva publicada.
Estado final de implantação e reteste: [PUBLICACAO-2026-11-04.md](PUBLICACAO-2026-11-04.md).

Foram mantidos **18 novos registros de negócio e uma foto sintética** na conta,
além dos registros anteriores. Nenhum registro foi apagado, inativado ou
anonimizado. PIX foi simulação; não houve cobrança ou baixa financeira real.
Avisos automáticos foram autorizados, mas seu recebimento não foi comprovado.

O relatório técnico v1.10 e o guia usam as mesmas métricas, títulos pretos e
limites explícitos. C1/C2 já existiam no fonte v1.9; a entrega agora os identifica
separadamente de C3 e da implantação, acrescenta TOTP/prazo e esclarece OpenAI,
esquema compartilhado/escritorio_id, storage e contingência. Vídeo continua
pendente, com [roteiro e resposta aos achados](../tcc/RESPOSTA_AO_PARECER-2026-11-04.md).

Prioridades: concluir vídeo com indicação honesta de simulações; confirmar
implantação da API preservando arquivos; retestar PDF em navegador com popups;
ampliar cobertura frontend; corrigir ferramentas com versão compatível;
validar recuperação, integrações e agendador em staging controlado. O parecer
acadêmico não certifica segurança, conformidade legal ou prontidão para produção.

## Histórico das rodadas anteriores

As seções abaixo conservam datas e resultados históricos. Afirmações antigas
sobre ausência de commit/deploy ou cobertura não substituem o estado acima.

<!-- auditoria-2026-11-04:fim -->

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
acadêmico, além do [relatório técnico v1.9](../tcc/RT-TDS-2026-39_v1.9.docx),
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

## Consolidação do relatório técnico em 02/11/2026

O Word v1.9 incorpora o CI remoto e a publicação, atualiza o caso de navegação,
explicita a persistência de fotos e o PIX de teste e corrige RF21 para refletir
a revogação do refresh. A consulta de 02/11 confirmou main em 0702332, Vercel
READY, Render live e saúde HTTP 200 do site/API. Não houve nova execução das
suítes nem nova medição de cobertura. As datas históricas foram preservadas.
Evidência: [relatorio-tecnico-v19.json](evidencias/relatorio-tecnico-v19.json).
