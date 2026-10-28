# Plano de auditoria — LexNexo

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
