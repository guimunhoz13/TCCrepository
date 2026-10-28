# Adendo de validação técnica do TCC

> **Complemento de 28/10/2026:** publicação e CI remoto foram posteriormente autorizados e verificados; veja [o registro atualizado](../testes/PUBLICACAO-2026-10-28.md). As afirmações de ausência de deploy abaixo descrevem a rodada original.

Data: 27/10/2026, America/Sao_Paulo. Projeto LexNexo. Base do repositório:
`8b41a295e0d7be677600295eb56537bb2c0f871e`, branch main, mais as alterações
locais de auditoria ainda não commitadas. Este adendo detalha a auditoria incorporada ao
[relatório técnico v1.8](RT-TDS-2026-39_v1.8.docx), nas seções 7.5–7.7, no resumo,
na metodologia e na conclusão. A revisão visual de 28/10/2026 atualizou a marca e as capturas, sem nova
execução integral da auditoria. Os DOCX v1.4/v1.5/v1.6 foram preservados como versões
históricas e não são apresentados como resultados atuais.

## Metodologia e objeto da verificação

Foi executada uma auditoria técnica com descoberta do repositório, baseline,
testes Django/DRF, Jest/Testing Library, aplicação integrada com Playwright,
verificação automática de acessibilidade com axe, análise de configurações,
schema OpenAPI, dependências, uploads, permissões e documentação. Foram usados
PostgreSQL exclusivo local, fixtures sintéticas, integrações simuladas e
checagens de configuração sem migração ou escrita administrativa em produção.

Após autorização específica do usuário, uma conta administrativa da aplicação
publicada foi usada para testes práticos com registros identificados como
AUDITORIA TCC. O usuário pediu sua preservação e autorizou os avisos
automáticos. Essas ações constituem verificação técnica por agente, sem
participantes humanos de uma pesquisa de usabilidade e sem pontuação SUS.

## Resultados observados

A linha de base teve 519 testes Django, 268 Jest e 26 Playwright aprovados.
Após reproduções, correções e retestes, passaram **532 testes Django,
275 Jest e 34 Playwright**, total de **841 casos automatizados**, sem falhas
ou skips nessa rodada. O catálogo identifica cada caso e arquivo; contagem
de casos não é porcentagem de cobertura.

Cobertura de linhas: **91,47%** no código de advocacia, excluindo testes e
migrations, e **35,55%** no conjunto JS/JSX de src do frontend. Ramos:
79,04%/31,85%, respectivamente. O backend supera a meta de 80% de linhas;
o frontend fica abaixo da referência de 70%. As métricas não incluem uma
suposta soma com Playwright e não comprovam todos os estados possíveis da UI.

Na aplicação publicada, 21 verificações práticas passaram e uma ficou
bloqueada (visualização/download do anexo no navegador integrado). Foram
preservados 19 registros de negócio: dois clientes, dois processos, quatro
eventos, duas tarefas, um contrato, três parcelas, um anexo, um apontamento,
uma despesa, uma movimentação e um modelo. O preview do modelo mostrou
substituição de variáveis; quatro eventos foram reencontrados após novo login.

## Correções e limites

A auditoria encontrou lacunas não cobertas pela suíte original: exposição de
contrato/resumo na ficha para perfis sem acesso financeiro, destinos push sem
restrição suficiente, validações de upload contornadas, gravação parcial de
configuração, filtros com erro 500, disputas de rascunho, uso da data UTC em
campos locais e possibilidade de submissão GET de credenciais sem JavaScript.
As correções locais têm regressões executadas e estão detalhadas no catálogo.

A auditoria adicional do ambiente instalado detectou pacotes antigos com
alertas conhecidos, embora uma resolução nova do requirements não os
reproduzisse. Depois de atualizados os pacotes e os mínimos do projeto,
pip-audit do ambiente não apontou alertas, e backend/E2E foram repetidos.
No npm, foi corrigido o alerta alto do zod, restando alertas baixos na cadeia
de ferramentas Jest/deepmerge; dependências de produção não apresentaram
alertas nessa execução.

Não houve comprovação administrativa da versão publicada, execução remota do
CI, ACL/RLS geral do Supabase, bucket, backup/restauração, agendadores ou
entrega por provedores. Não foram feitas chamadas pagas de IA, testes de
carga remotos, estudo com usuários, avaliação jurídica de cada prazo ou
auditoria exaustiva de acessibilidade. RF52, notificação automática ao cliente
via automação, permanece adiado. As correções estão locais, sem deploy.

## Parecer e uso acadêmico

**APTO COM RESSALVAS, no escopo validado.** Os resultados sustentam os
comportamentos dos casos executados, com limites identificados. Não sustentam
afirmações de ausência de bugs, cobertura universal, conformidade legal,
ganho de produtividade ou aprovação para produção. O documento acadêmico deve
apresentar esses limites e manter a distinção entre testes automatizados,
teste prático por agente e pesquisa com participantes.

Fontes da execução: [relatório](../testes/RELATORIO_VALIDACAO.md),
[matriz](../testes/MATRIZ_RASTREABILIDADE.md),
[evidências](../testes/EVIDENCIAS.md),
[casos executados](../testes/INVENTARIO_E_CASOS.md) e
[testes práticos](../testes/TESTES_PRATICOS.md).

## Complemento de manutenção — 28/10/2026

Foi corrigida localmente a mudança transitória de densidade ao navegar entre
Dashboard e Compromissos (A13). O reteste teve 275 testes Jest e 36 E2E aprovados,
além de lint e build concluídos. A execução do backend e os números de cobertura
acima continuam relativos à auditoria original. Comandos e reprodução estão no
[relatório de validação atualizado](../testes/RELATORIO_VALIDACAO.md#reteste-da-dashboard).
O relatório Word v1.8 conserva os resultados históricos de 27/10; este complemento
registra a correção posterior. Não houve publicação da aplicação nesta rodada.
