# Defeitos e riscos da auditoria

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
