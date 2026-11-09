# Plano de auditoria — LexNexo

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
Reexecução em PostgreSQL exclusivo novo, sem ler .env remoto: baseline 863,
regressões antes/depois, suíte final e CI separados. Cenários destrutivos,
segurança ativa, troca de senha e 2FA usam somente a base local. Práticos publicados
mantêm registros sintéticos. As tentativas intermediárias com falha permanecem
nos logs privados e têm classificação; não são contadas como aprovação.

As seções datadas anteriores são histórico e não substituem esta referência.

<!-- auditoria-2026-11-09:fim -->

<!-- auditoria-2026-11-05:inicio -->

## Referência atual de 05/11/2026

Grupo confirmado: **TDS-2026-038**. A rodada local final possui **863 testes
aprovados** (536 Django, 288 Jest, 39 Playwright).
Consulte o [relatório de validação](RELATORIO_VALIDACAO.md), a
[fonte única de métricas](evidencias/metricas-atuais.json) e o
[catálogo atualizado](evidencias/2026-11-05/inventario-e-casos.md).
Abertura de documentos/relatórios e MIME PDF corrigidos localmente; publicação
aguarda reconexão ao Render e conferência do armazenamento. Vídeo a gravar pelos
integrantes. As seções abaixo conservam as datas e resultados históricos.

<!-- auditoria-2026-11-05:fim -->

<!-- auditoria-2026-11-04:inicio -->

## Encerramento da nova execução em 04 de novembro de 2026

Executado o plano adicional iniciado em 03/11, com baseline 843 e reteste
integral final de 854 casos. Cobertura de linhas 91,49%/36,17%, lint/build,
schema e migrations conferidos. A15/A16/A18/A19/A20 corrigidos e retestados;
A21 exige a conferência publicada descrita no registro da implantação.

Os testes práticos da conta preservam 18 registros novos de negócio, foto e
todos os anteriores. Nenhuma limpeza foi aplicada. Operações destrutivas,
perfis negativos, concorrência e falhas deliberadas ficaram restritos ao
PostgreSQL local. Não houve pagamento nem chamada paga de IA.

Critérios tratados: inventário, baseline, execução e correção, regressões,
segurança, acessibilidade automatizada, desempenho leve, dependências, CI,
limites de publicação, rastreabilidade, evidências e revisão documental.
Bloqueios operacionais, vídeo, meta frontend e navegação PDF são mantidos no
relatório; não foram convertidos em sucesso por falta de acesso ou tempo.
A seção “em execução” no histórico descreve o planejamento original.

<!-- auditoria-2026-11-04:fim -->

Execução iniciada em 27/10/2026, America/Sao_Paulo. Base: commit
`8b41a295e0d7be677600295eb56537bb2c0f871e`, branch `main`, com alterações
locais anteriores preservadas (inventário em EVIDENCIAS.md).

## Objetivo e critérios

Validar API, segregação por escritório/perfil/sigilo, formulários, integrações
simuladas, aplicação integrada, acessibilidade, build e configuração. Aprovação
exige evidência executável; recursos sem execução ficam BLOQUEADO. Metas de
cobertura: backend 80%, frontend 70%; são referências, não critérios para
ocultar lacunas. Nenhuma escrita ou envio em serviços de produção.

## Ambiente e sequência

1. Inventariar modelos, URLs, telas, permissões, requisitos RF01–RF53 e CI.
2. Registrar baseline de Django/Jest/lint/build antes de corrigir produto.
3. Usar PostgreSQL exclusivo local com `core.settings_auditoria`, sem `.env`,
   SMTP, OpenAI, VAPID ou storage remoto. Criar apenas dados sintéticos.
4. Executar checks, migrations dry-run, OpenAPI, cobertura, auditoria de
   dependências e Playwright Chromium desktop/mobile.
5. Reproduzir defeitos, adicionar regressões úteis, corrigir e repetir suítes.
6. Atualizar matriz, achados, evidências, README, guia operacional e TCC.

## Prioridades e riscos

Prioridade máxima: autenticação, autorização horizontal/vertical, documentos,
sigilo e perda de dados. Depois: fluxos centrais, contratos/agenda, integração
frontend/API, acessibilidade, dependências e documentação.

Dependências: Python compatível com Django 6, Node 22, PostgreSQL local,
pacotes do lockfile e Chromium do Playwright. Docker não está ativo na
descoberta; binários PostgreSQL locais disponíveis. Produção, entrega de
e-mail/push, cobrança e chamadas reais de IA ficam fora da execução ativa.

Testes automatizados não substituem avaliação com usuários, revisão jurídica
dos prazos, pentest independente nem validação dos serviços publicados.

## Encerramento da execução

Todas as fases do prompt foram percorridas. As verificações executadas,
reprovadas e bloqueadas estão no [relatório](RELATORIO_VALIDACAO.md), sem
omitir limitações. Suítes finais: 532 Django, 275 Jest, 34 Playwright. Os
12 grupos de achados e retestes estão no catálogo de defeitos. Foram
inventariados RF01–RF53, RNF01–RNF21 e as operações do OpenAPI.

Critérios de saída: suítes e build passaram, relatórios entregues e Git
revisado. Ressalvas: meta frontend não atingida, alertas baixos de ferramentas,
serviços/recuperação não verificados, navegadores adicionais e avaliação humana
pendentes. O parecer é APTO COM RESSALVAS. Os testes práticos autorizados
preservaram os registros; nenhuma limpeza foi aplicada à conta publicada.

## Conferência dos critérios do prompt

- [x] Inventário de funcionalidades, páginas, endpoints, modelos e permissões.
- [x] Baseline anterior às correções de produto registrado.
- [x] Suítes backend/frontend e build executados com resultados verificáveis.
- [x] Integração real em navegador; interceptações e bloqueios identificados.
- [x] Autenticação, perfis, isolamento e sigilo avaliados por testes negativos.
- [x] Migrations, banco, uploads e integrações avaliados; serviços reais têm bloqueios.
- [x] Segurança, privacidade, axe e responsividade avaliados com limites explícitos.
- [x] Lint/build/dependências/CI/deploy inspecionados; não houve deploy remoto.
- [x] Achados priorizados, reproduzidos, corrigidos e retestados localmente.
- [x] Cobertura real coletada; meta frontend não atingida registrada como REPROVADO.
- [x] Relatórios atuais e documentação existente atualizados/contextualizados.
- [x] Evidências compactas, comandos e instruções de retomada entregues.
- [x] Dados reais e credenciais da conta não foram introduzidos nos relatórios/testes.
- [x] Diff revisado, links/casos conferidos e estado final Git registrado.

Marcação significa que a atividade foi tratada e documentada. Não transforma
as verificações BLOQUEADO ou REPROVADO em aprovações.

## Complemento autorizado em 28/10/2026

O proprietário autorizou publicar as correções no GitHub, na Vercel e no Render.
A execução do CI remoto e o smoke da navegação publicada estão separados da
rodada local original em [PUBLICACAO-2026-10-28.md](PUBLICACAO-2026-10-28.md).
As preferências de aparência foram temporariamente alternadas para conferência
e restauradas. Não houve criação ou exclusão de registros de negócio nesse smoke.

## Nova rodada em 03/11/2026 (em execução)

Base: `0702332fa4c86c14aab6c679d51ec7f054b11870`, branch main, incluindo
as alterações locais documentais já existentes. Estado inicial e hashes
registrados antes de editar. Não misturar os resultados desta rodada com
os de 27/10 ou com o CI de 28/10.

1. Reexecutar Django, Jest, lint, build, OpenAPI, migrations e E2E sobre
   PostgreSQL local exclusivo, sem credenciais ou banco de produção.
2. Rever lacunas de autorização, sessão, documentos, prazos e integrações;
   reproduzir defeitos e acrescentar regressões antes da correção.
3. Executar testes práticos pela interface em https://lexnexo.vercel.app,
   na conta autorizada, com prefixo AUDITORIA TCC 20261103. Criar cliente,
   processos, prazos, audiências, tarefas, contrato/parcelas, horas, despesas,
   documento, modelo e feriado quando os recursos permitirem.
4. Conferir busca, detalhes, edição dos novos registros, persistência após
   novo login, calendário, relatórios, preferências e modo PIX de teste.
5. Preservar tudo o que for adicionado na conta publicada. Exclusões,
   anonimização, tentativas de invasão e testes negativos de perfis ficam
   restritos ao ambiente local. Avisos automáticos já autorizados pelo
   proprietário; sem mensagens manuais a terceiros, pagamento ou IA paga.
6. Registrar evidências sanitizadas e atualizar relatórios, matriz e guia,
   com bloqueios explícitos para recursos não executados.

A solicitação de testar todos os módulos orienta o inventário; não significa
certificação de todos os estados, provedores ou situações possíveis.
