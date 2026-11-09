# Defeitos e riscos da auditoria

<!-- auditoria-2026-11-09:inicio -->

## Achados finais de 09/11/2026

Repetições finais: **41 casos aprovados no Firefox e 41 no WebKit Linux**,
com um cenário PWA bloqueado em cada runtime, validado somente no Chromium.
Os cliques prematuros da preparação anterior foram corrigidos aguardando o
estado pronto da dashboard; não se usaram retries. Isso não comprova Safari
real. [Resultados e limites](evidencias/2026-11-09/navegadores.json).

| ID | Gravidade | Defeito e correção | Evidência | Estado |
|---|---|---|---|---|
| A24 | MÉDIA | Edição divergente de parcelas emitidas; recusar processo/total/forma/quantidade incompatíveis, preservar observações | Regressões Django e recusa 400 publicada | APROVADO |
| A25 | MÉDIA | Estorno mantinha pago_em e não registrava trilha; limpar data e auditar mudança | Regressão financeira local | APROVADO |
| A26 | MÉDIA | Tipos/IDs/textos/fuso e JSON malformados causavam 500; validar antes do negócio | 11 novos métodos de robustez, com subcasos não inflados na contagem | APROVADO |
| A27 | MÉDIA | Prazo truncava fração/booleano e podia exceder datas; inteiro 1–10000 e erro 400 | Regressão local e fração recusada publicada | APROVADO |
| A28 | MÉDIA | Modelo aceitava cliente distinto do processo; validar vínculo | Caso local e recusa 400 publicada | APROVADO |
| A29 | MÉDIA | Baixa recusada sem feedback, repetição e dashboard desatualizado; erro visível, bloqueio pendente e atualização | Dois Jest e E2E com 503 simulado | APROVADO |
| A30 | BAIXA | Configurações sem foco modal/Escape; ciclo Tab, fechamento e restauração do foco | E2E teclado e Axe | APROVADO |

[Regressões e falhas de preparação](evidencias/2026-11-09/regressoes.json).
As falhas iniciais do PWA eram de emulação: Playwright 1.56 exige habilitar a rede
do service worker para aplicar offline. As tentativas de alterar o produto foram
revertidas quando a hipótese não se confirmou. As simulações de erro bloqueiam o
worker; apenas o caso PWA permite o worker real. A formatação de data no WebKit
aceita variações de separador; o horário gravado é conferido separadamente.

Permanecem os riscos: cobertura frontend 38,03% abaixo da meta; 26 alertas de
ferramentas npm; operação externa/recebimento de mensagens; recuperação em nuvem;
ACL/RLS integral; agendador; Safari real; avaliação por profissionais. O vídeo
continua por conta dos integrantes. Sem garantia de ausência de defeitos ou
conformidade jurídica integral. Nenhum dado de teste publicado foi apagado.

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

> **Complemento de 28/10/2026:** o código de A01–A13 foi publicado no commit 89b675f. O reteste online concentrou-se na navegação e na saúde; não repete toda a auditoria de segurança em produção. A14 e o [registro de publicação](PUBLICACAO-2026-10-28.md) complementam os resultados históricos abaixo.

Execução de 27/10/2026, America/Sao_Paulo. Base
`8b41a295e0d7be677600295eb56537bb2c0f871e`, mais o diff local desta auditoria.
Reproduções ativas de segurança foram feitas somente no PostgreSQL local.
As correções abaixo não foram implantadas na aplicação publicada.
A13 é um complemento de 28/10/2026; os demais achados pertencem à rodada original.

## Achados corrigidos

| ID | Gravidade | Local | Reprodução segura e impacto | Correção | Reteste | Situação |
|---|---|---|---|---|---|---|
| A01 | ALTA | views/processos.py, FichaProcesso.jsx | Estagiário/secretária recebiam contrato e resumo mesmo com GET contratos negado; secretária também recebia horas | Aplicar matriz a cada bloco da ficha e à interface; resumo sem permissão retorna null | AuditoriaPermissoesTests; FichaProcesso.test.jsx; E2E por dois perfis | Corrigido localmente; APROVADO |
| A02 | ALTA | push.py, views/notificacoes_push.py | Cadastro aceitava HTTPS arbitrário, inclusive loopback; envio posterior permitiria SSRF e ocupação de threads | Destinos restritos a provedores conhecidos, sem credenciais/portas livres; validar também inscrições antigas; impedir redirects e limitar envio a 10 s | AuditoriaPushTests; test_push.py com transporte mockado, sem conexão ao destino inválido | Corrigido localmente; APROVADO |
| A03 | MÉDIA | views/notificacoes_push.py | keys textual/lista causava 500; token master chegava a código que exige Usuario | Validar tipos/tamanhos e exigir membro do escritório; resposta 400/403 | AuditoriaPushTests | Corrigido localmente; APROVADO |
| A04 | MÉDIA | views/configuracoes.py | PATCH com nome e tipo PIX inválido retornava 400, mas já gravava o nome | Transação atômica no conjunto escritório/configuração | test_configuracao_invalida_nao_salva_parte_do_escritorio | Corrigido localmente; APROVADO |
| A05 | MÉDIA | views/horas_e_despesas.py | Identificadores e datas inválidos em filtros levantavam exceções ORM/500 | Reutilizar leitores de ID/data que devolvem 400 | Cinco variantes de filtro em test_auditoria.py | Corrigido localmente; APROVADO |
| A06 | ALTA | views/configuracoes.py, serializers.py | Upload de documento na conta/advogado contornava extensão, assinatura e tamanho; arquivo acima de 10 MB era salvo | Aplicar validadores do campo Usuario também nesses caminhos; validar foto aninhada | Arquivo sintético inválido, assinatura falsa e limite; testes de fotos e suíte completa | Corrigido localmente; APROVADO |
| A07 | MÉDIA | hooks/useRascunhoFormulario.js | Consulta tardia sobrescrevia digitação; gravação em andamento podia recriar rascunho após descarte. Observado também no uso publicado | Preservar edição nova, serializar gravações, invalidar tarefas antigas e aguardar gravação antes do descarte; retry não apaga rascunho de nova sessão | Dois testes unitários falhavam antes; cinco testes do hook e E2E com resposta controlada passam | Corrigido localmente; APROVADO; contorno prático por edição, sem apagar registros |
| A08 | MÉDIA | views/financeiro.py, HorasPanel.jsx, utils/formato.js | Em 27/10 à noite, UTC já era 28/10: parcela e datas iniciais de horas/despesas avançavam um dia; horas podiam ser rejeitadas como futuras | timezone.localdate no backend e dataLocalISO nos formulários | Teste congelado em 28/10 00:30 UTC e E2E em America/Sao_Paulo | Corrigido localmente; APROVADO; parcelas sintéticas já gravadas foram preservadas |
| A09 | ALTA | forms/LoginForm.jsx e demais formulários de credenciais | Sem hidratação JavaScript, form sem method usa GET e pode incluir campos sensíveis na URL/histórico/log | method=post em login, 2FA, cadastro, recuperação, master e formulários de conta | Regressão unitária falhava antes; E2E com JavaScript desativado confirma POST sem query string | Corrigido localmente; APROVADO |
| A10 | ALTA | requirements.txt, ambiente Python e package-lock.json | npm audit apontava zod alto em ferramenta; auditoria do ambiente Python instalado apontou 46 entradas em 5 pacotes, apesar de resolução nova do requirements não ter alertas | zod 4.4.3→4.6.7; Pillow 13.0.0, dnspython 2.9.0, certifi 2026.10.23; mínimos seguros no requirements. pip e filelock atualizados só no venv | pip check, pip-audit do ambiente e requirements, backend completo e E2E repetidos | Corrigido no ambiente/código local; versões remotas BLOQUEADO |
| A11 | BAIXA | views/sessao.py | OpenAPI anunciava 205 no logout, mas a implementação retorna 200 | Documentar resposta 200 | spectacular --validate --fail-on-warn e testes de autenticação | Corrigido localmente; APROVADO |
| A12 | BAIXA | jest.config.mjs e testes E2E/API | Alias @/ sem mapper no Jest; teste de API fixava porta 8000; densidade lida antes da hidratação; rascunho de rodada anterior afetava teste de estado vazio | Mapper coerente com jsconfig, respeitar URL configurada, esperar preferências e limpar só o rascunho do teste no banco E2E local | 46 suítes Jest e 34 E2E; logout corrigido no teste para página pública, conforme comportamento existente | Corrigido localmente; APROVADO |
| A13 | BAIXA | frontend/src/app/dashboard/layout.js e páginas Dashboard/Compromissos | Provider remontado na troca de rota aplicava comfortable temporariamente sobre a escolha compact; mudança visível de espaçamento | Manter PreferencesProvider no layout compartilhado das duas rotas | 28/10: antes 1 falha/1 aprovação; depois ambos os novos cenários passam e suíte completa tem 36 E2E aprovados | Publicado em 89b675f; APROVADO nos testes E2E e no smoke online |
| A14 | MÉDIA | Vercel: domínio lexnexo.vercel.app | Novo deploy READY, mas o domínio principal servia scripts da versão anterior por ser apenas alias manual | Atualizar alias e registrar o domínio verificado no projeto LexNexo | Inspeção administrativa, scripts iguais aos do deploy novo e navegação com densidade estável | Corrigido na configuração publicada em 28/10 |

Os caminhos abreviados são relativos a `backend/advocacia/` ou `frontend/src/`.
Os nomes dos casos e seus arquivos completos estão em
[INVENTARIO_E_CASOS.md](INVENTARIO_E_CASOS.md). A09 foi identificado em uma
tentativa local com um servidor cujo build havia sido substituído; essa
tentativa falhou por infraestrutura e não foi contada como regressão funcional
de data. A regressão de GET foi depois isolada e validada separadamente.

## Evidência anterior às correções

O primeiro lote de oito métodos novos gerou 12 falhas de asserção e nove
erros de subtestes. Não eram 21 métodos diferentes. O lote de upload gerou
quatro falhas em dois métodos. As duas regressões do rascunho falharam antes
da correção; a de parcela demonstrou 28/10 em lugar de 27/10; a de formulário
demonstrou ausência de method. Resumos sanitizados estão em
[evidencias/regressoes.txt](evidencias/regressoes.txt). A rodada final não tem
falha nem skip nos 841 casos dos três runners.

## Pendências e riscos

| ID | Gravidade | Evidência/impacto | Estado | Ação para encerrar |
|---|---|---|---|---|
| R01 | MÉDIA | Frontend: 35,55% de linhas; meta 70%; dashboard, autenticação secundária e vários painéis pouco exercitados em Jest | BLOQUEADO | Ampliar testes de comportamento dos módulos apontados em cobertura-frontend.json; falta de cobertura não deve ser ocultada por exclusões |
| R02 | BAIXA | npm audit completo: cinco pacotes afetados na cadeia Jest/deepmerge; raiz é um advisory baixo, não cinco vulnerabilidades independentes em produção | REPROVADO | Acompanhar correção compatível; não aplicar downgrade major/force sugerido automaticamente. Gate high e audit de produção passam |
| R03 | MÉDIA | Access/refresh em localStorage, CSP com unsafe-inline e validade do access após logout de até 30 min | BLOQUEADO | Revisar arquitetura de sessão/CSP em mudança dedicada; nenhum XSS explorável foi comprovado nesta rodada |
| R04 | MÉDIA | Políticas Supabase/bucket, SMTP/push entregues, cron, backup/restauração, observabilidade e versões publicadas não foram inspecionados administrativamente | BLOQUEADO | Validar em staging autorizado, sem dados reais; executar procedimento de recuperação antes de alegar prontidão operacional |
| R05 | MÉDIA | Só Chromium foi executado; axe não cobre toda a interface, cores simuladas nem usuários reais | BLOQUEADO | Executar Firefox/WebKit, auditoria manual de acessibilidade e protocolo de usabilidade com participantes |
| R06 | MÉDIA | Abertura do anexo publicado não produziu nova aba observável no navegador integrado; upload e vínculo foram confirmados | BLOQUEADO | Repetir abertura/download em navegador com popups permitidos; distinguir bloqueio do navegador de defeito do produto |
| R07 | MÉDIA | Código das correções publicado em 89b675f; CI completo aprovado e smoke online de navegação/saúde concluído em 28/10 | PARCIALMENTE ENCERRADO | Publicação comprovada em PUBLICACAO-2026-10-28.md; ampliar o reteste prático remoto de rascunhos/datas e demais fluxos sem explorar vulnerabilidades em produção |
| R08 | MÉDIA | Scan heurístico cobre arquivos rastreados atuais até 2 MB; não houve varredura de todo o histórico Git nem análise exaustiva de concorrência/volume em todos os modelos | BLOQUEADO | Executar scanner de histórico com saída redigida e testes de concorrência em staging isolado; não interpretar o scan atual como ausência universal de segredos |

LGPD: isolamento, minimização e anonimização têm testes; texto livre,
documentos, retenção, backups e envio a terceiros exigem controles operacionais.
Esta auditoria não constitui parecer jurídico nem certificação de conformidade.

## Nova rodada de 03/11/2026

| ID | Gravidade | Reprodução e impacto | Correção e evidência | Situação |
|---|---|---|---|---|
| A15 | MÉDIA | Falha sintética ao criar a segunda parcela deixava contrato e primeira parcela persistidos, impedindo nova tentativa consistente. | `transaction.atomic` em `ContratoViewSet.perform_create`; regressão de rollback. | Corrigido no código; implantação da API deve ser confirmada separadamente. |
| A16 | MÉDIA | R$ 0,06 em quatro parcelas gerava última parcela zero; R$ 0,02 em quatro era aceito e o arredondamento podia produzir saldo negativo. | Validação de pelo menos um centavo por parcela e divisão com ROUND_DOWN, atribuindo o restante à última. Não altera parcelas antigas. | Corrigido; três regressões financeiras falharam antes e passam após a correção. |
| A17 | MÉDIA | npm audit completo informou 31 alertas moderados e três baixos na cadeia de desenvolvimento. Nenhum em produção. | glob/minimatch exigem versões principais novas; deepmerge sem patch. Não aplicar sugestões de downgrade de Jest/ESLint nem overrides globais incompatíveis. | Pendente; zero altos/críticos. |
| A18 | BAIXA | Gerador de evidências fixava a data em 27/10, mesmo em nova execução. | `--data` obrigatório e `--destino` para separar evidências; geração conferida com data atual. | Corrigido. |
| A19 | BAIXA | Página do assistente mostrava chat no plano Gratuito; API já restringia o recurso. | Consulta do plano antes de montar o chat; estados de carga e erro; quatro testes (3 falhas/1 aprovado antes). | Corrigido no código; reteste publicado registrado nos casos práticos. |
| A20 | BAIXA | Pesquisar na ajuda gerava confirmação de alterações não salvas ao fechar. | Buscas fora de form não representam cadastros pendentes; busca global identificada explicitamente. Duas regressões falharam antes; proteção de edição de cadastro permanece testada. | Corrigido no código; reteste publicado registrado nos casos práticos. |

Fontes primárias dos alertas A17:
[glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4),
[minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249) e
[deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4). As contagens
34/31/3 incluem a cadeia transitiva; são três advisories raiz, não 34
vulnerabilidades independentes do produto. O caminho de exploração no
serviço publicado não foi demonstrado nem testado ativamente.

Permanecem a meta de cobertura frontend, confirmação de entrega externa,
restauração, ACL/RLS/bucket completo, navegadores adicionais, carga remota
e avaliação com profissionais. A abertura de PDF/relatório em nova aba no
navegador integrado segue BLOQUEADO; o download binário pela API passou
nesta rodada. Não concluir que ambos os cenários são o mesmo teste.

## Encerramento técnico em 04/11/2026

| ID | Gravidade | Local e reprodução | Impacto e probabilidade | Correção | Reteste e situação |
|---|---|---|---|---|---|
| A21 | MÉDIA | next.config.mjs; foto autenticada 200 direto, 404 pela Vercel; com barra final a API também retornava 404 | Foto gravada não aparecia na interface publicada; reprodução consistente na origem testada | Regra de fotos antes da genérica, preservando o caminho sem barra extra; nenhuma permissão alterada | Publicado em 3a54547; proxy/API 200, bytes idênticos e anônimo 401. APROVADO. E2E local já passava antes, não é prova de reprodução do provedor |
| R09 | MÉDIA | Render ainda em 89b675f, apesar de main/autoDeploy configurados | Correção A15/A16 ainda ausente da API publicada; condição observada, causa do acionamento não determinada | Confirmar armazenamento persistente/recuperação antes de substituir instância e publicar uma única revisão testada | BLOQUEADO; publicação.json distingue frontend atualizado e backend anterior |
| R10 | MÉDIA | Parecer recebido sem vídeo; código oficial do grupo divergente entre parecer e nomes antigos | Entrega acadêmica incompleta ou identificação incorreta | Roteiro de vídeo e resposta aos itens; confirmar identificação institucional | BLOQUEADO vídeo e confirmação do código; diagramas/métricas revisados |

Reteste integral de 04/11: **854 aprovados**. A19/A20 passaram também no site
publicado. A15/A16 estão aprovados no código e nos testes locais/CI, mas sua
implantação na API permanece BLOQUEADO (R09). A18 está corrigido no gerador.
A17 segue REPROVADO na consulta datada de 03/11, sem alerta de produção,
alto ou crítico. Cobertura frontend atual 36,17%, ainda abaixo de 70%; não se
usa a porcentagem antiga de R01 como medida atual. O scan heurístico não
constitui prova de ausência de segredos em todo o histórico.

Não foi identificado novo achado crítico/alto nas reproduções desta rodada;
isso não equivale a uma certificação nem elimina os bloqueios operacionais.

A consulta adicional de **04/11/2026** retornou **26 entradas npm transitivas:
23 moderadas e três baixas**, com os mesmos três advisories raiz (glob,
minimatch e deepmerge). Nenhuma alteração de lockfile foi feita para ocultar
alertas; não atribuir a redução de entradas a uma correção de dependências.
As 34 entradas da tabela de 03/11 são históricas. A17 permanece REPROVADO.
`npm audit --omit=dev` e `pip-audit -r requirements.txt` voltaram a retornar
zero alertas; o deploy check simulado passou com um aviso silenciado.
Evidência atual: `evidencias/2026-11-04/verificacoes-adicionais.json`.

## Correções de 05/11/2026

| ID | Gravidade | Evidência | Correção e reteste | Situação |
|---|---|---|---|---|
| A22 | MÉDIA | Abertura de documento/relatório ocorria após aguardar API; popup podia ser bloqueado | Reserva da janela no clique, opener nulo, download alternativo e limpeza em erro; seis regressões antes/depois e dois E2E | APROVADO local; publicação depende da conferência do storage |
| A23 | BAIXA | PDF com título sem extensão era enviado como application/octet-stream | MIME determinado pelo arquivo armazenado; título, bytes e autorização preservados; regressão Django e E2E | APROVADO local; publicação depende da conferência do storage |
| R10 | MÉDIA | Identificação acadêmica | Grupo TDS-2026-038 confirmado e aplicado ao RT v1.11 e manual | Identificação encerrada; vídeo permanece BLOQUEADO até gravação dos integrantes |

R06: a nova implementação resolve o fluxo tardio e acrescenta download quando
novas abas são impedidas. O reteste local é aprovado; o fechamento do caso
publicado exige conferir a versão nova online. Não se modifica o histórico 41/43.
R09: não publicar substituindo instância antes de confirmar a preservação dos anexos.
