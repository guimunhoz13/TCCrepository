# Inventário da implementação e verificações

Base `8b41a295e0d7be677600295eb56537bb2c0f871e`; execução de 27/10/2026, America/Sao_Paulo.

## Operações da API

Extraídas do OpenAPI validado. Cada operação protegida foi chamada sem token
por `AuditoriaRotasAnonimasTests` e retornou 401/403. Isso comprova a barreira
anônima, não todos os caminhos funcionais. Consulte a matriz RF e o catálogo
de casos para os cenários positivos, de perfil, escritório e validação.

| Método | Endpoint | Cenário obrigatório | Estado desse cenário |
|---|---|---|---|
| GET | `/api/advogados/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/advogados/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/advogados/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/advogados/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/advogados/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/advogados/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/advogados/registrar/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/agenda/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/agenda/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/agenda/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/agenda/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/agenda/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/agenda/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/agenda/assinatura/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/agenda/assinatura/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/agenda/assinatura/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/agenda/calcular-prazo/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/agenda/exportar-ics/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/agenda/feed/{token}.ics` | Fluxos públicos em test_autenticacao/test_cadastro_e_equipe/test_agenda_ics/test_planos | APROVADO |
| GET | `/api/agenda/feriados/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/apontamentos/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/apontamentos/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/apontamentos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/apontamentos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/apontamentos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/apontamentos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/assistente-ia/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/atividade/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/auditoria/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/auditoria/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/busca/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/clientes/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/clientes/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/clientes/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/clientes/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/clientes/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/clientes/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/clientes/{id}/anonimizar/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/clientes/{id}/documento-identidade/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/clientes/{id}/exportar-dados/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/configuracoes/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/configuracoes/2fa/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/configuracoes/conta/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/configuracoes/desativar-escritorio/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/configuracoes/escritorio/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/configuracoes/exportar/clientes/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/configuracoes/exportar/processos/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/configuracoes/preferencias/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/configuracoes/relatorio/cliente/{cliente_id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/configuracoes/relatorio/cliente/{cliente_id}/email/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/configuracoes/relatorio/processo/{processo_id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/configuracoes/relatorio/processo/{processo_id}/email/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/configuracoes/senha/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/contratos/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/contratos/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/contratos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/contratos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/contratos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/contratos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/dashboard/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/dashboard/stats/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/despesas/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/despesas/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/despesas/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/despesas/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/despesas/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/despesas/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/documentos/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/documentos/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/documentos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/documentos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/documentos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/documentos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/documentos/{id}/download/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/equipe/registrar/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/escritorios/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/escritorios/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/escritorios/confirmar-email/` | Fluxos públicos em test_autenticacao/test_cadastro_e_equipe/test_agenda_ics/test_planos | APROVADO |
| POST | `/api/escritorios/registrar/` | Fluxos públicos em test_autenticacao/test_cadastro_e_equipe/test_agenda_ics/test_planos | APROVADO |
| GET | `/api/feriados-locais/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/feriados-locais/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/feriados-locais/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/feriados-locais/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/feriados-locais/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/feriados-locais/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/fotos/{arquivo}` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/intimacoes/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/intimacoes/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/intimacoes/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/intimacoes/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/intimacoes/{id}/conferir/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/intimacoes/buscar/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/login/` | Fluxos públicos em test_autenticacao/test_cadastro_e_equipe/test_agenda_ics/test_planos | APROVADO |
| POST | `/api/login/2fa/` | Fluxos públicos em test_autenticacao/test_cadastro_e_equipe/test_agenda_ics/test_planos | APROVADO |
| POST | `/api/login/esqueci-senha/` | Fluxos públicos em test_autenticacao/test_cadastro_e_equipe/test_agenda_ics/test_planos | APROVADO |
| POST | `/api/login/redefinir-senha/` | Fluxos públicos em test_autenticacao/test_cadastro_e_equipe/test_agenda_ics/test_planos | APROVADO |
| POST | `/api/logout/` | Fluxos públicos em test_autenticacao/test_cadastro_e_equipe/test_agenda_ics/test_planos | APROVADO |
| GET | `/api/master/auditoria/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/master/auditoria/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/master/escritorios/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/master/escritorios/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/master/escritorios/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/master/escritorios/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/master/escritorios/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/master/escritorios/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/master/login/` | Fluxos públicos em test_autenticacao/test_cadastro_e_equipe/test_agenda_ics/test_planos | APROVADO |
| GET | `/api/master/stats/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/modelos-documento/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/modelos-documento/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/modelos-documento/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/modelos-documento/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/modelos-documento/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/modelos-documento/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/modelos-documento/{id}/gerar/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/modelos-documento/variaveis/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/movimentacoes/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/movimentacoes/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/movimentacoes/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/movimentacoes/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/movimentacoes/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/movimentacoes/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/noticias/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/parcelas/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/parcelas/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/parcelas/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/parcelas/{id}/pix/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/parcelas/{id}/simular-pix/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/plano/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/plano/pix-teste/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/plano/pix-teste/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/planos/` | Fluxos públicos em test_autenticacao/test_cadastro_e_equipe/test_agenda_ics/test_planos | APROVADO |
| GET | `/api/processos/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/processos/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/processos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/processos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/processos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/processos/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/processos/{id}/consultar-datajud/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/processos/{id}/ficha/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/processos/{id}/resumo-cliente/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/push/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/push/cancelar/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/push/inscrever/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/push/testar/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/rascunhos/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/rascunhos/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/rascunhos/{chave}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/rascunhos/{chave}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/relatorios/tempo-uso/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/tarefas/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/tarefas/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/tarefas/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/tarefas/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/tarefas/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/tarefas/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/token/refresh/` | Fluxos públicos em test_autenticacao/test_cadastro_e_equipe/test_agenda_ics/test_planos | APROVADO |
| GET | `/api/usuarios/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/usuarios/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/usuarios/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PUT | `/api/usuarios/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| PATCH | `/api/usuarios/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| DELETE | `/api/usuarios/{id}/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/usuarios/{id}/alternar-ativo/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/usuarios/{id}/definir-perfil/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| GET | `/api/usuarios/{id}/documento-identidade/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |
| POST | `/api/usuarios/{id}/redefinir-2fa/` | Sem JWT → 401/403 (teste de auditoria) | APROVADO |

102 paths canônicos; 166 operações DRF, 155 protegidas. Variantes `.json` não são contadas em dobro.
`GET /api/health/` é uma função Django fora do schema: sucesso e indisponibilidade
são testados em `test_deploy.py`. `/api/docs/`, `/api/redoc/` e `/api/schema/`
são condicionais a API_DOCS_PUBLICAS e têm testes de documentação.
`/admin/` usa o admin padrão Django; administração da plataforma usa `/master/`.

## Páginas e ações

| Página | Cenário | Evidência ou limite |
|---|---|---|
| `/assistente-ia` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |
| `/cadastro` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |
| `/confirmar-email` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |
| `/dashboard/clientes` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |
| `/dashboard/compromissos` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |
| `/dashboard` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |
| `/esqueci-senha` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |
| `/login` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |
| `/master` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |
| `/master/painel` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |
| `/offline` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |
| `/` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |
| `/redefinir-senha` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |

Os painéis são sobreposições em `/dashboard`: clientes (criar, buscar, editar,
inativar, excluir, exportar/anonimizar), processos (CRUD, ficha, DataJud,
intimações e conferência), documentos (upload/abertura/exclusão), agenda
(CRUD, cumprimento, cálculo, feriados, .ics/feed), tarefas (CRUD, Kanban),
contratos (criação/exclusão, parcelas, PIX real/teste), horas/despesas,
modelos (CRUD e geração), contato, planos, advogados/equipe, configurações,
preferências, relatórios, auditoria, busca e ajuda. Cada família consta na matriz RF.

## Modelos e regras de acesso

| Modelo | Fonte | Cenário |
|---|---|---|
| FotoPersistente | `backend/advocacia/models.py:24` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| Escritorio | `backend/advocacia/models.py:31` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| SuperAdmin | `backend/advocacia/models.py:58` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| Usuario | `backend/advocacia/models.py:74` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| Cliente | `backend/advocacia/models.py:151` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| Advogado | `backend/advocacia/models.py:264` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| Processo | `backend/advocacia/models.py:298` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| Movimentacao | `backend/advocacia/models.py:408` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| Documento | `backend/advocacia/models.py:450` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| Agenda | `backend/advocacia/models.py:473` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| FeriadoLocal | `backend/advocacia/models.py:535` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| Contrato | `backend/advocacia/models.py:565` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| Parcela | `backend/advocacia/models.py:615` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| Tarefa | `backend/advocacia/models.py:646` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| PreferenciasUsuario | `backend/advocacia/models.py:770` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| RegistroAuditoria | `backend/advocacia/models.py:800` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| TokenRedefinicaoSenha | `backend/advocacia/models.py:858` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| TokenVerificacaoEmail | `backend/advocacia/models.py:875` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| ConfiguracaoEscritorio | `backend/advocacia/models.py:892` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| NotificacaoEnviada | `backend/advocacia/models.py:919` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| ApontamentoHora | `backend/advocacia/models.py:969` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| Despesa | `backend/advocacia/models.py:1033` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| SessaoUso | `backend/advocacia/models.py:1106` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| ModeloDocumento | `backend/advocacia/models.py:1143` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| Intimacao | `backend/advocacia/models.py:1181` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| InscricaoPush | `backend/advocacia/models.py:1243` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |
| RascunhoFormulario | `backend/advocacia/models.py:1261` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |

27 modelos; 37 migrations de advocacia. A cadeia inteira foi aplicada em
PostgreSQL descartável. Rollback de dados não é garantido: 0002, 0031 e 0037
têm reversão noop em operações de dados. Não executar downgrade cego em produção.

Perfis: admin, advogado, estagiario, financeiro e secretaria; superadmin
é uma identidade separada. `permissoes.py` define ações por área;
`EscritorioScopedMixin` e serializers verificam escritório; `sigilo.py`
limita processos e dependências; rascunhos também são privados do usuário.

## Casos automatizados executados

Pré-condições comuns: dependências instaladas, settings_auditoria, fixtures
sintéticas por teste Django; mocks em Jest; popular_demo no PostgreSQL local
para Playwright. Esperado: asserções descritas no nome e no código do caso.
Observado: aprovação individual na saída do runner final. Gravidade: não se
aplica aos casos aprovados; regressões e histórico estão no catálogo de defeitos.
Comandos completos e ambientes: EVIDENCIAS.md e RELATORIO_VALIDACAO.md.

| ID | Runner | Cenário e teste de referência | Estado |
|---|---|---|---|
| BE-001 | Django | advocacia.tests.test_agenda.AgendaPrazoAPITestCase.test_compromisso_sem_processo_de_outro_escritorio_fica_isolado — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-002 | Django | advocacia.tests.test_agenda.AgendaPrazoAPITestCase.test_compromisso_sem_processo_e_gravado_no_escritorio_de_quem_criou — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-003 | Django | advocacia.tests.test_agenda.AgendaPrazoAPITestCase.test_criar_compromisso_sem_processo — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-004 | Django | advocacia.tests.test_agenda.AgendaPrazoAPITestCase.test_criar_prazo_atrasado_e_sinalizado — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-005 | Django | advocacia.tests.test_agenda.AgendaPrazoAPITestCase.test_criar_prazo_fatal — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-006 | Django | advocacia.tests.test_agenda.AgendaPrazoAPITestCase.test_editar_titulo_e_reagendar_data_do_evento — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-007 | Django | advocacia.tests.test_agenda.AgendaPrazoAPITestCase.test_filtro_agenda_por_eventos_futuros — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-008 | Django | advocacia.tests.test_agenda.AgendaPrazoAPITestCase.test_filtro_agenda_por_tipo — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-009 | Django | advocacia.tests.test_agenda.AgendaPrazoAPITestCase.test_marcar_evento_como_cumprido — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-010 | Django | advocacia.tests.test_agenda.AgendaPrazoAPITestCase.test_prazo_cumprido_nao_e_sinalizado_como_atrasado — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-011 | Django | advocacia.tests.test_agenda.AgendaPrazoAPITestCase.test_reabrir_evento_marcado_como_cumprido — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-012 | Django | advocacia.tests.test_agenda.AgendaPrazoAPITestCase.test_remover_vinculo_de_processo_de_um_evento_existente — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-013 | Django | advocacia.tests.test_agenda.CalcularPrazoAPITestCase.test_calcula_prazo_em_dias_corridos — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-014 | Django | advocacia.tests.test_agenda.CalcularPrazoAPITestCase.test_calcula_prazo_em_dias_uteis — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-015 | Django | advocacia.tests.test_agenda.CalcularPrazoAPITestCase.test_dias_zero_e_rejeitado — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-016 | Django | advocacia.tests.test_agenda.CalcularPrazoAPITestCase.test_sem_autenticacao_e_negado — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-017 | Django | advocacia.tests.test_agenda.CalcularPrazoAPITestCase.test_sem_dados_e_rejeitado — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-018 | Django | advocacia.tests.test_agenda.CalculoDePrazoTestCase.test_calcular_prazo_em_dias_corridos_conta_todos_os_dias — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-019 | Django | advocacia.tests.test_agenda.CalculoDePrazoTestCase.test_calcular_prazo_em_dias_uteis_pula_feriado_e_fim_de_semana — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-020 | Django | advocacia.tests.test_agenda.CalculoDePrazoTestCase.test_eh_dia_util_rejeita_fim_de_semana_e_feriado — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-021 | Django | advocacia.tests.test_agenda.CalculoDePrazoTestCase.test_feriados_nacionais_inclui_fixos_e_moveis — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-022 | Django | advocacia.tests.test_agenda.CalculoDePrazoTestCase.test_pascoa_bate_com_datas_conhecidas — `backend/advocacia/tests/test_agenda.py` | APROVADO |
| BE-023 | Django | advocacia.tests.test_agenda_ics.ExportacaoDaAgendaAPITestCase.test_assinatura_gera_link_que_funciona_sem_login — `backend/advocacia/tests/test_agenda_ics.py` | APROVADO |
| BE-024 | Django | advocacia.tests.test_agenda_ics.ExportacaoDaAgendaAPITestCase.test_download_respeita_sigilo_e_deixa_o_passado_distante_de_fora — `backend/advocacia/tests/test_agenda_ics.py` | APROVADO |
| BE-025 | Django | advocacia.tests.test_agenda_ics.ExportacaoDaAgendaAPITestCase.test_gerar_novo_link_invalida_o_antigo_e_desligar_apaga — `backend/advocacia/tests/test_agenda_ics.py` | APROVADO |
| BE-026 | Django | advocacia.tests.test_agenda_ics.ExportacaoDaAgendaAPITestCase.test_link_de_usuario_inativo_para_de_funcionar — `backend/advocacia/tests/test_agenda_ics.py` | APROVADO |
| BE-027 | Django | advocacia.tests.test_agenda_ics.ExportacaoDaAgendaAPITestCase.test_token_curto_ou_inexistente_da_404 — `backend/advocacia/tests/test_agenda_ics.py` | APROVADO |
| BE-028 | Django | advocacia.tests.test_agenda_ics.FormatoICalendarTestCase.test_dobra_linhas_longas_sem_partir_acento — `backend/advocacia/tests/test_agenda_ics.py` | APROVADO |
| BE-029 | Django | advocacia.tests.test_agenda_ics.FormatoICalendarTestCase.test_escapa_caracteres_especiais — `backend/advocacia/tests/test_agenda_ics.py` | APROVADO |
| BE-030 | Django | advocacia.tests.test_agenda_ics.FormatoICalendarTestCase.test_prazo_fatal_tem_alarmes_e_horario_em_utc — `backend/advocacia/tests/test_agenda_ics.py` | APROVADO |
| BE-031 | Django | advocacia.tests.test_auditoria.AuditoriaPermissoesTests.test_configuracao_invalida_nao_salva_parte_do_escritorio — `backend/advocacia/tests/test_auditoria.py` | APROVADO |
| BE-032 | Django | advocacia.tests.test_auditoria.AuditoriaPermissoesTests.test_documento_da_conta_respeita_extensao_assinatura_e_tamanho — `backend/advocacia/tests/test_auditoria.py` | APROVADO |
| BE-033 | Django | advocacia.tests.test_auditoria.AuditoriaPermissoesTests.test_documento_do_advogado_nao_contorna_validadores_do_modelo — `backend/advocacia/tests/test_auditoria.py` | APROVADO |
| BE-034 | Django | advocacia.tests.test_auditoria.AuditoriaPermissoesTests.test_ficha_nao_contorna_a_permissao_financeira — `backend/advocacia/tests/test_auditoria.py` | APROVADO |
| BE-035 | Django | advocacia.tests.test_auditoria.AuditoriaPermissoesTests.test_ficha_preserva_contrato_para_perfis_autorizados — `backend/advocacia/tests/test_auditoria.py` | APROVADO |
| BE-036 | Django | advocacia.tests.test_auditoria.AuditoriaPermissoesTests.test_ficha_respeita_permissao_de_leitura_das_horas — `backend/advocacia/tests/test_auditoria.py` | APROVADO |
| BE-037 | Django | advocacia.tests.test_auditoria.AuditoriaPermissoesTests.test_filtros_invalidos_retornam_400 — `backend/advocacia/tests/test_auditoria.py` | APROVADO |
| BE-038 | Django | advocacia.tests.test_auditoria.AuditoriaPermissoesTests.test_parcela_inicial_usa_data_local_na_virada_utc — `backend/advocacia/tests/test_auditoria.py` | APROVADO |
| BE-039 | Django | advocacia.tests.test_auditoria.AuditoriaPushTests.test_destino_interno_legado_nao_e_acessado — `backend/advocacia/tests/test_auditoria.py` | APROVADO |
| BE-040 | Django | advocacia.tests.test_auditoria.AuditoriaPushTests.test_push_nao_aceita_token_master_como_membro — `backend/advocacia/tests/test_auditoria.py` | APROVADO |
| BE-041 | Django | advocacia.tests.test_auditoria.AuditoriaPushTests.test_push_recusa_chaves_malformadas_sem_500 — `backend/advocacia/tests/test_auditoria.py` | APROVADO |
| BE-042 | Django | advocacia.tests.test_auditoria.AuditoriaPushTests.test_push_recusa_destino_fora_dos_provedores — `backend/advocacia/tests/test_auditoria.py` | APROVADO |
| BE-043 | Django | advocacia.tests.test_auditoria.AuditoriaRotasAnonimasTests.test_todas_operacoes_protegidas_exigem_token — `backend/advocacia/tests/test_auditoria.py` | APROVADO |
| BE-044 | Django | advocacia.tests.test_auditoria_e_mestre.AuditoriaLoginAPITestCase.test_bloqueio_apos_3_tentativas_gera_registro_de_bloqueio — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-045 | Django | advocacia.tests.test_auditoria_e_mestre.AuditoriaLoginAPITestCase.test_login_bem_sucedido_gera_registro_de_auditoria — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-046 | Django | advocacia.tests.test_auditoria_e_mestre.AuditoriaLoginAPITestCase.test_login_com_senha_errada_gera_registro_de_falha — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-047 | Django | advocacia.tests.test_auditoria_e_mestre.AuditoriaLoginAPITestCase.test_login_master_bem_sucedido_gera_registro_de_auditoria — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-048 | Django | advocacia.tests.test_auditoria_e_mestre.AuditoriaVisualizacaoAPITestCase.test_admin_ve_apenas_registros_do_proprio_escritorio — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-049 | Django | advocacia.tests.test_auditoria_e_mestre.AuditoriaVisualizacaoAPITestCase.test_advogado_comum_nao_ve_registros_de_auditoria — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-050 | Django | advocacia.tests.test_auditoria_e_mestre.AuditoriaVisualizacaoAPITestCase.test_edicao_registra_campo_valor_anterior_e_novo — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-051 | Django | advocacia.tests.test_auditoria_e_mestre.AuditoriaVisualizacaoAPITestCase.test_estado_de_auditoria_ignora_senhas_tokens_e_segredos — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-052 | Django | advocacia.tests.test_auditoria_e_mestre.AuditoriaVisualizacaoAPITestCase.test_master_ve_registros_de_todos_os_escritorios — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-053 | Django | advocacia.tests.test_auditoria_e_mestre.AuditoriaVisualizacaoAPITestCase.test_preferencias_e_dados_do_escritorio_guardam_as_mudancas — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-054 | Django | advocacia.tests.test_auditoria_e_mestre.AuditoriaVisualizacaoAPITestCase.test_tenant_nao_acessa_auditoria_master — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-055 | Django | advocacia.tests.test_auditoria_e_mestre.PainelMestreAPITestCase.test_acesso_sem_token_e_negado — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-056 | Django | advocacia.tests.test_auditoria_e_mestre.PainelMestreAPITestCase.test_login_master_com_credenciais_corretas — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-057 | Django | advocacia.tests.test_auditoria_e_mestre.PainelMestreAPITestCase.test_login_master_com_senha_incorreta_e_negado — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-058 | Django | advocacia.tests.test_auditoria_e_mestre.PainelMestreAPITestCase.test_master_lista_todos_os_escritorios — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-059 | Django | advocacia.tests.test_auditoria_e_mestre.PainelMestreAPITestCase.test_master_pode_inativar_escritorio — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-060 | Django | advocacia.tests.test_auditoria_e_mestre.PainelMestreAPITestCase.test_token_master_nao_enxerga_dados_de_tenant — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-061 | Django | advocacia.tests.test_auditoria_e_mestre.PainelMestreAPITestCase.test_usuario_comum_nao_acessa_painel_mestre — `backend/advocacia/tests/test_auditoria_e_mestre.py` | APROVADO |
| BE-062 | Django | advocacia.tests.test_autenticacao.LoginAPITestCase.test_login_com_credenciais_corretas_retorna_tokens — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-063 | Django | advocacia.tests.test_autenticacao.LoginAPITestCase.test_login_com_senha_incorreta_e_negado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-064 | Django | advocacia.tests.test_autenticacao.LoginAPITestCase.test_login_com_usuario_inexistente_e_negado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-065 | Django | advocacia.tests.test_autenticacao.LoginAPITestCase.test_login_de_usuario_desativado_e_negado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-066 | Django | advocacia.tests.test_autenticacao.LoginBloqueioAPITestCase.test_bloqueia_apos_3_tentativas_erradas — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-067 | Django | advocacia.tests.test_autenticacao.LoginBloqueioAPITestCase.test_login_correto_e_negado_enquanto_bloqueado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-068 | Django | advocacia.tests.test_autenticacao.LoginBloqueioAPITestCase.test_login_correto_funciona_apos_bloqueio_expirar — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-069 | Django | advocacia.tests.test_autenticacao.LoginBloqueioAPITestCase.test_tentativa_errada_isolada_nao_bloqueia — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-070 | Django | advocacia.tests.test_autenticacao.LogoutAPITestCase.test_access_token_emitido_antes_do_logout_continua_valido_ate_expirar — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-071 | Django | advocacia.tests.test_autenticacao.LogoutAPITestCase.test_logout_com_token_ja_invalido_nao_gera_erro — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-072 | Django | advocacia.tests.test_autenticacao.LogoutAPITestCase.test_logout_do_painel_mestre_revoga_o_refresh_token — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-073 | Django | advocacia.tests.test_autenticacao.LogoutAPITestCase.test_logout_gera_registro_de_auditoria — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-074 | Django | advocacia.tests.test_autenticacao.LogoutAPITestCase.test_logout_revoga_o_refresh_token — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-075 | Django | advocacia.tests.test_autenticacao.LogoutAPITestCase.test_logout_sem_refresh_token_e_rejeitado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-076 | Django | advocacia.tests.test_autenticacao.RedefinicaoSenhaAPITestCase.test_redefinir_com_confirmacao_diferente_e_rejeitado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-077 | Django | advocacia.tests.test_autenticacao.RedefinicaoSenhaAPITestCase.test_redefinir_com_senha_fraca_e_rejeitado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-078 | Django | advocacia.tests.test_autenticacao.RedefinicaoSenhaAPITestCase.test_redefinir_com_token_expirado_e_rejeitado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-079 | Django | advocacia.tests.test_autenticacao.RedefinicaoSenhaAPITestCase.test_redefinir_com_token_ja_usado_e_rejeitado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-080 | Django | advocacia.tests.test_autenticacao.RedefinicaoSenhaAPITestCase.test_redefinir_com_token_valido_altera_a_senha — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-081 | Django | advocacia.tests.test_autenticacao.RedefinicaoSenhaAPITestCase.test_solicitar_com_email_existente_cria_token_e_retorna_generico — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-082 | Django | advocacia.tests.test_autenticacao.RedefinicaoSenhaAPITestCase.test_solicitar_com_email_inexistente_retorna_a_mesma_resposta_generica — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-083 | Django | advocacia.tests.test_autenticacao.RenovacaoDeTokenAPITestCase.test_access_token_renovado_preserva_as_claims_do_usuario — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-084 | Django | advocacia.tests.test_autenticacao.RenovacaoDeTokenAPITestCase.test_refresh_ja_usado_nao_renova_de_novo — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-085 | Django | advocacia.tests.test_autenticacao.RenovacaoDeTokenAPITestCase.test_refresh_rotacionado_continua_renovando_e_mantem_as_claims — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-086 | Django | advocacia.tests.test_autenticacao.RenovacaoDeTokenAPITestCase.test_refresh_token_gera_um_access_token_valido — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-087 | Django | advocacia.tests.test_autenticacao.RenovacaoDeTokenAPITestCase.test_refresh_token_invalido_e_rejeitado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-088 | Django | advocacia.tests.test_autenticacao.RenovacaoDeTokenAPITestCase.test_renovacao_devolve_um_refresh_novo — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-089 | Django | advocacia.tests.test_autenticacao.SessaoInvalidadaNaTrocaDeSenhaAPITestCase.test_access_token_emitido_antes_da_redefinicao_por_link_e_rejeitado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-090 | Django | advocacia.tests.test_autenticacao.SessaoInvalidadaNaTrocaDeSenhaAPITestCase.test_access_token_emitido_antes_da_troca_de_senha_propria_e_rejeitado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-091 | Django | advocacia.tests.test_autenticacao.SessaoInvalidadaNaTrocaDeSenhaAPITestCase.test_quem_nao_trocou_a_senha_continua_com_o_token_valendo — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-092 | Django | advocacia.tests.test_autenticacao.SessaoInvalidadaNaTrocaDeSenhaAPITestCase.test_refresh_token_emitido_antes_da_troca_de_senha_propria_nao_renova_mais — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-093 | Django | advocacia.tests.test_autenticacao.SessaoInvalidadaNaTrocaDeSenhaAPITestCase.test_troca_de_senha_propria_devolve_tokens_novos_que_funcionam — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-094 | Django | advocacia.tests.test_autenticacao.ThrottlingAPITestCase.test_endpoint_sensivel_bloqueia_apos_exceder_o_limite — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-095 | Django | advocacia.tests.test_autenticacao.ValidacaoDeSenhaAPITestCase.test_senha_com_menos_de_8_caracteres_e_rejeitada — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-096 | Django | advocacia.tests.test_autenticacao.ValidacaoDeSenhaAPITestCase.test_senha_que_atende_todos_os_requisitos_e_aceita — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-097 | Django | advocacia.tests.test_autenticacao.ValidacaoDeSenhaAPITestCase.test_senha_sem_caractere_especial_e_rejeitada — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-098 | Django | advocacia.tests.test_autenticacao.ValidacaoDeSenhaAPITestCase.test_senha_sem_letra_maiuscula_e_rejeitada — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-099 | Django | advocacia.tests.test_autenticacao.ValidacaoDeSenhaAPITestCase.test_senha_sem_numero_e_rejeitada — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-100 | Django | advocacia.tests.test_autenticacao.VerificacaoEmDuasEtapasAPITestCase.test_admin_redefine_2fa_de_quem_perdeu_o_celular — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-101 | Django | advocacia.tests.test_autenticacao.VerificacaoEmDuasEtapasAPITestCase.test_codigo_errado_e_recusado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-102 | Django | advocacia.tests.test_autenticacao.VerificacaoEmDuasEtapasAPITestCase.test_com_2fa_ativo_a_senha_sozinha_nao_abre_sessao — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-103 | Django | advocacia.tests.test_autenticacao.VerificacaoEmDuasEtapasAPITestCase.test_desafio_adulterado_e_recusado — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-104 | Django | advocacia.tests.test_autenticacao.VerificacaoEmDuasEtapasAPITestCase.test_desafio_mais_codigo_abre_a_sessao — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-105 | Django | advocacia.tests.test_autenticacao.VerificacaoEmDuasEtapasAPITestCase.test_desativar_exige_senha_e_codigo — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-106 | Django | advocacia.tests.test_autenticacao.VerificacaoEmDuasEtapasAPITestCase.test_iniciar_devolve_qr_code_sem_ativar_ainda — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-107 | Django | advocacia.tests.test_autenticacao.VerificacaoEmDuasEtapasAPITestCase.test_mesmo_codigo_nao_serve_duas_vezes — `backend/advocacia/tests/test_autenticacao.py` | APROVADO |
| BE-108 | Django | advocacia.tests.test_busca.BuscaGlobalAPITestCase.test_acha_em_varias_areas_de_uma_vez — `backend/advocacia/tests/test_busca.py` | APROVADO |
| BE-109 | Django | advocacia.tests.test_busca.BuscaGlobalAPITestCase.test_acha_processo_pelo_nome_do_cliente — `backend/advocacia/tests/test_busca.py` | APROVADO |
| BE-110 | Django | advocacia.tests.test_busca.BuscaGlobalAPITestCase.test_ignora_acentos_e_maiusculas — `backend/advocacia/tests/test_busca.py` | APROVADO |
| BE-111 | Django | advocacia.tests.test_busca.BuscaGlobalAPITestCase.test_limita_a_quatro_resultados_por_area — `backend/advocacia/tests/test_busca.py` | APROVADO |
| BE-112 | Django | advocacia.tests.test_busca.BuscaGlobalAPITestCase.test_nao_enxerga_outro_escritorio — `backend/advocacia/tests/test_busca.py` | APROVADO |
| BE-113 | Django | advocacia.tests.test_busca.BuscaGlobalAPITestCase.test_termo_curto_nao_busca_nada — `backend/advocacia/tests/test_busca.py` | APROVADO |
| BE-114 | Django | advocacia.tests.test_busca.FiltroBuscaAPITestCase.test_busca_clientes_por_nome — `backend/advocacia/tests/test_busca.py` | APROVADO |
| BE-115 | Django | advocacia.tests.test_busca.FiltroBuscaAPITestCase.test_busca_clientes_sem_correspondencia_retorna_vazio — `backend/advocacia/tests/test_busca.py` | APROVADO |
| BE-116 | Django | advocacia.tests.test_busca.FiltroBuscaAPITestCase.test_busca_processos_por_titulo — `backend/advocacia/tests/test_busca.py` | APROVADO |
| BE-117 | Django | advocacia.tests.test_busca.FiltroBuscaAPITestCase.test_filtro_processos_por_cliente — `backend/advocacia/tests/test_busca.py` | APROVADO |
| BE-118 | Django | advocacia.tests.test_busca.FiltroBuscaAPITestCase.test_filtro_processos_por_status — `backend/advocacia/tests/test_busca.py` | APROVADO |
| BE-119 | Django | advocacia.tests.test_cadastro_e_equipe.AdvogadosAPITestCase.test_advogado_nao_altera_nem_exclui_colega — `backend/advocacia/tests/test_cadastro_e_equipe.py` | APROVADO |
| BE-120 | Django | advocacia.tests.test_cadastro_e_equipe.AdvogadosAPITestCase.test_colega_ve_dados_profissionais_sem_documentos_pessoais — `backend/advocacia/tests/test_cadastro_e_equipe.py` | APROVADO |
| BE-121 | Django | advocacia.tests.test_cadastro_e_equipe.AdvogadosAPITestCase.test_editar_advogado_para_oab_de_outro_retorna_erro_especifico — `backend/advocacia/tests/test_cadastro_e_equipe.py` | APROVADO |
| BE-122 | Django | advocacia.tests.test_cadastro_e_equipe.EscritorioRegistroAPITestCase.test_confirmar_email_com_token_invalido_e_rejeitado — `backend/advocacia/tests/test_cadastro_e_equipe.py` | APROVADO |
| BE-123 | Django | advocacia.tests.test_cadastro_e_equipe.EscritorioRegistroAPITestCase.test_confirmar_email_com_token_ja_usado_e_rejeitado — `backend/advocacia/tests/test_cadastro_e_equipe.py` | APROVADO |
| BE-124 | Django | advocacia.tests.test_cadastro_e_equipe.EscritorioRegistroAPITestCase.test_em_desenvolvimento_nao_exige_verificacao_de_email — `backend/advocacia/tests/test_cadastro_e_equipe.py` | APROVADO |
| BE-125 | Django | advocacia.tests.test_cadastro_e_equipe.EscritorioRegistroAPITestCase.test_em_producao_exige_verificacao_de_email_antes_do_login — `backend/advocacia/tests/test_cadastro_e_equipe.py` | APROVADO |
| BE-126 | Django | advocacia.tests.test_cadastro_e_equipe.EscritorioRegistroAPITestCase.test_registro_com_cnpj_com_poucos_digitos_e_rejeitado — `backend/advocacia/tests/test_cadastro_e_equipe.py` | APROVADO |
| BE-127 | Django | advocacia.tests.test_cadastro_e_equipe.EscritorioRegistroAPITestCase.test_registro_com_cnpj_duplicado_e_rejeitado — `backend/advocacia/tests/test_cadastro_e_equipe.py` | APROVADO |
| BE-128 | Django | advocacia.tests.test_cadastro_e_equipe.EscritorioRegistroAPITestCase.test_registro_com_senha_fraca_e_rejeitado — `backend/advocacia/tests/test_cadastro_e_equipe.py` | APROVADO |
| BE-129 | Django | advocacia.tests.test_cadastro_e_equipe.EscritorioRegistroAPITestCase.test_registro_com_telefone_com_poucos_digitos_e_rejeitado — `backend/advocacia/tests/test_cadastro_e_equipe.py` | APROVADO |
| BE-130 | Django | advocacia.tests.test_cadastro_e_equipe.EscritorioRegistroAPITestCase.test_registro_cria_escritorio_e_admin — `backend/advocacia/tests/test_cadastro_e_equipe.py` | APROVADO |
| BE-131 | Django | advocacia.tests.test_clientes.ClientesAPITestCase.test_admin_ve_apenas_clientes_do_proprio_escritorio — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-132 | Django | advocacia.tests.test_clientes.ClientesAPITestCase.test_cnpj_alfanumerico_e_normalizado_e_nao_duplica_com_outra_mascara — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-133 | Django | advocacia.tests.test_clientes.ClientesAPITestCase.test_criar_cliente_autenticado — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-134 | Django | advocacia.tests.test_clientes.ClientesAPITestCase.test_criar_cliente_com_cnpj_duplicado_retorna_erro_especifico — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-135 | Django | advocacia.tests.test_clientes.ClientesAPITestCase.test_criar_cliente_com_cpf_duplicado_retorna_erro_especifico — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-136 | Django | advocacia.tests.test_clientes.ClientesAPITestCase.test_criar_cliente_pessoa_juridica_com_cnpj — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-137 | Django | advocacia.tests.test_clientes.ClientesAPITestCase.test_dois_clientes_pessoa_fisica_sem_cnpj_nao_colidem — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-138 | Django | advocacia.tests.test_clientes.ClientesAPITestCase.test_dois_clientes_pessoa_juridica_sem_cpf_nao_colidem — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-139 | Django | advocacia.tests.test_clientes.ClientesAPITestCase.test_editar_cliente_para_cpf_de_outro_retorna_erro_especifico — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-140 | Django | advocacia.tests.test_clientes.ClientesAPITestCase.test_isolamento_multi_tenant_entre_escritorios — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-141 | Django | advocacia.tests.test_clientes.ClientesAPITestCase.test_listar_clientes_sem_autenticacao_e_negado — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-142 | Django | advocacia.tests.test_clientes.LgpdClienteAPITestCase.test_anonimizar_apaga_dados_pessoais_e_mantem_o_processo — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-143 | Django | advocacia.tests.test_clientes.LgpdClienteAPITestCase.test_anonimizar_remove_valores_pessoais_da_auditoria_sem_apagar_a_trilha — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-144 | Django | advocacia.tests.test_clientes.LgpdClienteAPITestCase.test_consentimento_registra_a_data_sozinho — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-145 | Django | advocacia.tests.test_clientes.LgpdClienteAPITestCase.test_estagiario_nao_atende_pedido_do_titular — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-146 | Django | advocacia.tests.test_clientes.LgpdClienteAPITestCase.test_exporta_os_dados_do_titular_em_json — `backend/advocacia/tests/test_clientes.py` | APROVADO |
| BE-147 | Django | advocacia.tests.test_dashboard.DashboardResumoAPITestCase.test_exige_autenticacao — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-148 | Django | advocacia.tests.test_dashboard.DashboardResumoAPITestCase.test_financeiro_mensal_traz_seis_meses_com_recebido_e_despesas — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-149 | Django | advocacia.tests.test_dashboard.DashboardResumoAPITestCase.test_minhas_tarefas_so_inclui_as_abertas_de_quem_abriu — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-150 | Django | advocacia.tests.test_dashboard.DashboardResumoAPITestCase.test_nao_mistura_dados_de_outro_escritorio — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-151 | Django | advocacia.tests.test_dashboard.DashboardResumoAPITestCase.test_traz_totais_e_os_cinco_processos_mais_recentes — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-152 | Django | advocacia.tests.test_dashboard.IndicadoresFinanceirosAPITestCase.test_a_receber_soma_as_parcelas_em_aberto — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-153 | Django | advocacia.tests.test_dashboard.IndicadoresFinanceirosAPITestCase.test_despesas_a_reembolsar_ignoram_as_ja_reembolsadas — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-154 | Django | advocacia.tests.test_dashboard.IndicadoresFinanceirosAPITestCase.test_escritorio_sem_movimento_recebe_zeros — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-155 | Django | advocacia.tests.test_dashboard.IndicadoresFinanceirosAPITestCase.test_horas_faturaveis_do_mes_somam_tempo_e_valor — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-156 | Django | advocacia.tests.test_dashboard.IndicadoresFinanceirosAPITestCase.test_indicadores_nao_misturam_escritorios — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-157 | Django | advocacia.tests.test_dashboard.IndicadoresFinanceirosAPITestCase.test_parcela_quitada_no_mes_passado_nao_entra_no_recebido_do_mes — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-158 | Django | advocacia.tests.test_dashboard.IndicadoresFinanceirosAPITestCase.test_parcela_vencida_mas_ja_paga_nao_conta_como_vencida — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-159 | Django | advocacia.tests.test_dashboard.IndicadoresFinanceirosAPITestCase.test_recebido_no_mes_conta_so_o_que_foi_quitado_desde_o_dia_primeiro — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-160 | Django | advocacia.tests.test_dashboard.IndicadoresFinanceirosAPITestCase.test_vencidas_olham_a_data_e_nao_o_status_da_parcela — `backend/advocacia/tests/test_dashboard.py` | APROVADO |
| BE-161 | Django | advocacia.tests.test_datajud.ConsultaDataJudAPITestCase.test_chave_recusada_pelo_cnj_gera_mensagem_clara — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-162 | Django | advocacia.tests.test_datajud.ConsultaDataJudAPITestCase.test_consulta_importa_movimentacoes — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-163 | Django | advocacia.tests.test_datajud.ConsultaDataJudAPITestCase.test_consulta_registra_auditoria — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-164 | Django | advocacia.tests.test_datajud.ConsultaDataJudAPITestCase.test_consultar_duas_vezes_nao_duplica — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-165 | Django | advocacia.tests.test_datajud.ConsultaDataJudAPITestCase.test_falha_de_rede_nao_quebra_a_requisicao — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-166 | Django | advocacia.tests.test_datajud.ConsultaDataJudAPITestCase.test_mesmo_codigo_em_datas_diferentes_nao_e_tratado_como_repetido — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-167 | Django | advocacia.tests.test_datajud.ConsultaDataJudAPITestCase.test_movimentacao_importada_guarda_a_data_do_tribunal — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-168 | Django | advocacia.tests.test_datajud.ConsultaDataJudAPITestCase.test_movimento_novo_e_importado_sem_repetir_os_antigos — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-169 | Django | advocacia.tests.test_datajud.ConsultaDataJudAPITestCase.test_processo_de_outro_escritorio_nao_e_consultavel — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-170 | Django | advocacia.tests.test_datajud.ConsultaDataJudAPITestCase.test_processo_inexistente_no_tribunal_devolve_404 — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-171 | Django | advocacia.tests.test_datajud.ConsultaDataJudAPITestCase.test_sem_chave_configurada_explica_o_que_falta — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-172 | Django | advocacia.tests.test_datajud.ConsultaDataJudAPITestCase.test_tempo_esgotado_no_cnj_gera_mensagem_clara — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-173 | Django | advocacia.tests.test_datajud.InterpretacaoDaRespostaDataJudTestCase.test_campos_ausentes_nao_quebram_a_leitura — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-174 | Django | advocacia.tests.test_datajud.InterpretacaoDaRespostaDataJudTestCase.test_extrai_capa_e_movimentos — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-175 | Django | advocacia.tests.test_datajud.InterpretacaoDaRespostaDataJudTestCase.test_movimento_com_nome_alternativo_e_lido — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-176 | Django | advocacia.tests.test_datajud.InterpretacaoDaRespostaDataJudTestCase.test_resposta_sem_resultados_devolve_none — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-177 | Django | advocacia.tests.test_datajud.InterpretacaoDaRespostaDataJudTestCase.test_resposta_vazia_devolve_none — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-178 | Django | advocacia.tests.test_datajud.NumeracaoCNJTestCase.test_aceita_numero_sem_mascara — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-179 | Django | advocacia.tests.test_datajud.NumeracaoCNJTestCase.test_codigo_de_tribunal_estadual_desconhecido_e_rejeitado — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-180 | Django | advocacia.tests.test_datajud.NumeracaoCNJTestCase.test_justica_do_trabalho_vira_alias_do_trt — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-181 | Django | advocacia.tests.test_datajud.NumeracaoCNJTestCase.test_justica_estadual_vira_alias_do_tj — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-182 | Django | advocacia.tests.test_datajud.NumeracaoCNJTestCase.test_justica_federal_vira_alias_do_trf — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-183 | Django | advocacia.tests.test_datajud.NumeracaoCNJTestCase.test_numero_com_tamanho_errado_e_rejeitado — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-184 | Django | advocacia.tests.test_datajud.NumeracaoCNJTestCase.test_quebra_o_numero_em_partes — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-185 | Django | advocacia.tests.test_datajud.NumeracaoCNJTestCase.test_segmento_nao_coberto_explica_o_limite — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-186 | Django | advocacia.tests.test_datajud.SincronizacaoDataJudTestCase.test_dry_run_nao_consulta_nem_grava — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-187 | Django | advocacia.tests.test_datajud.SincronizacaoDataJudTestCase.test_escritorio_inativo_nao_e_sincronizado — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-188 | Django | advocacia.tests.test_datajud.SincronizacaoDataJudTestCase.test_falha_em_um_processo_nao_interrompe_os_demais — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-189 | Django | advocacia.tests.test_datajud.SincronizacaoDataJudTestCase.test_importa_andamentos_e_avisa — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-190 | Django | advocacia.tests.test_datajud.SincronizacaoDataJudTestCase.test_limite_restringe_a_quantidade_por_execucao — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-191 | Django | advocacia.tests.test_datajud.SincronizacaoDataJudTestCase.test_nao_reconsulta_antes_do_intervalo — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-192 | Django | advocacia.tests.test_datajud.SincronizacaoDataJudTestCase.test_preferencia_desligada_nao_recebe_aviso — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-193 | Django | advocacia.tests.test_datajud.SincronizacaoDataJudTestCase.test_processo_concluido_nao_e_consultado — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-194 | Django | advocacia.tests.test_datajud.SincronizacaoDataJudTestCase.test_processo_nunca_sincronizado_tem_prioridade_na_fila — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-195 | Django | advocacia.tests.test_datajud.SincronizacaoDataJudTestCase.test_processo_suspenso_continua_sendo_acompanhado — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-196 | Django | advocacia.tests.test_datajud.SincronizacaoDataJudTestCase.test_sem_andamento_novo_nao_avisa — `backend/advocacia/tests/test_datajud.py` | APROVADO |
| BE-197 | Django | advocacia.tests.test_djen.IntimacoesAPITestCase.test_advogado_com_oab_sem_seccional_e_avisado — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-198 | Django | advocacia.tests.test_djen.IntimacoesAPITestCase.test_buscar_grava_liga_ao_processo_e_lanca_o_prazo — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-199 | Django | advocacia.tests.test_djen.IntimacoesAPITestCase.test_comando_agendado_busca_para_todos_os_escritorios — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-200 | Django | advocacia.tests.test_djen.IntimacoesAPITestCase.test_confere_publicacao_que_ainda_nao_tinha_data_final — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-201 | Django | advocacia.tests.test_djen.IntimacoesAPITestCase.test_djen_fora_do_ar_avisa_sem_quebrar — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-202 | Django | advocacia.tests.test_djen.IntimacoesAPITestCase.test_estagiario_nao_confirma_e_dados_desatualizados_nao_sobrescrevem_prazo — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-203 | Django | advocacia.tests.test_djen.IntimacoesAPITestCase.test_intimacao_de_processo_sigiloso_some_para_quem_nao_ve — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-204 | Django | advocacia.tests.test_djen.IntimacoesAPITestCase.test_leitura_nao_confirma_e_conferencia_registra_autor_e_ajusta_agenda — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-205 | Django | advocacia.tests.test_djen.IntimacoesAPITestCase.test_lista_marca_como_lida_e_filtra — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-206 | Django | advocacia.tests.test_djen.IntimacoesAPITestCase.test_nao_importa_a_mesma_intimacao_duas_vezes — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-207 | Django | advocacia.tests.test_djen.IntimacoesAPITestCase.test_processo_nao_cadastrado_fica_sem_vinculo — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-208 | Django | advocacia.tests.test_djen.IntimacoesAPITestCase.test_secretaria_ve_mas_nao_busca — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-209 | Django | advocacia.tests.test_djen.IntimacoesAPITestCase.test_sem_prazo_no_texto_usa_5_dias_uteis_marcado_como_estimado — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-210 | Django | advocacia.tests.test_djen.RegrasDoPrazoTestCase.test_interpreta_o_item_do_djen_e_limpa_html — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-211 | Django | advocacia.tests.test_djen.RegrasDoPrazoTestCase.test_le_o_prazo_no_texto — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-212 | Django | advocacia.tests.test_djen.RegrasDoPrazoTestCase.test_publicacao_no_dia_util_seguinte_e_contagem_a_partir_dela — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-213 | Django | advocacia.tests.test_djen.RegrasDoPrazoTestCase.test_recesso_forense_suspende_a_contagem — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-214 | Django | advocacia.tests.test_djen.RegrasDoPrazoTestCase.test_separa_numero_e_seccional_em_varios_formatos — `backend/advocacia/tests/test_djen.py` | APROVADO |
| BE-215 | Django | advocacia.tests.test_documentacao_api.DocumentacaoDaAPITestCase.test_esquema_openapi_publico_cobre_as_rotas_principais — `backend/advocacia/tests/test_documentacao_api.py` | APROVADO |
| BE-216 | Django | advocacia.tests.test_documentacao_api.DocumentacaoDaAPITestCase.test_esquema_valido_e_sem_avisos — `backend/advocacia/tests/test_documentacao_api.py` | APROVADO |
| BE-217 | Django | advocacia.tests.test_documentacao_api.DocumentacaoDaAPITestCase.test_swagger_e_redoc_abrem_sem_login — `backend/advocacia/tests/test_documentacao_api.py` | APROVADO |
| BE-218 | Django | advocacia.tests.test_feriados_locais.CalculoComFeriadosLocaisTestCase.test_dias_corridos_ignoram_feriado_local — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-219 | Django | advocacia.tests.test_feriados_locais.CalculoComFeriadosLocaisTestCase.test_dias_uteis_pulam_suspensao_de_dezembro_a_janeiro — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-220 | Django | advocacia.tests.test_feriados_locais.CalculoComFeriadosLocaisTestCase.test_feriado_anual_vale_em_qualquer_ano — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-221 | Django | advocacia.tests.test_feriados_locais.CalculoComFeriadosLocaisTestCase.test_feriado_local_no_meio_do_prazo_empurra_o_vencimento — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-222 | Django | advocacia.tests.test_feriados_locais.CalculoComFeriadosLocaisTestCase.test_feriado_local_pula_a_contagem — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-223 | Django | advocacia.tests.test_feriados_locais.CalculoComFeriadosLocaisTestCase.test_intimacao_publicada_e_vencimento_respeitam_feriado_local — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-224 | Django | advocacia.tests.test_feriados_locais.CalculoComFeriadosLocaisTestCase.test_lista_so_os_feriados_locais_que_mudaram_a_contagem — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-225 | Django | advocacia.tests.test_feriados_locais.CalculoComFeriadosLocaisTestCase.test_sem_feriado_local_nada_muda — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-226 | Django | advocacia.tests.test_feriados_locais.CalculoComFeriadosLocaisTestCase.test_suspensao_de_um_dia_so_vale_naquela_data — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-227 | Django | advocacia.tests.test_feriados_locais.CalendarioDeFeriadosAPITestCase.test_29_de_fevereiro_anual_nao_quebra_ano_comum — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-228 | Django | advocacia.tests.test_feriados_locais.CalendarioDeFeriadosAPITestCase.test_ano_invalido — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-229 | Django | advocacia.tests.test_feriados_locais.CalendarioDeFeriadosAPITestCase.test_calendario_identifica_duas_abrangencias_na_mesma_data — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-230 | Django | advocacia.tests.test_feriados_locais.CalendarioDeFeriadosAPITestCase.test_feriado_local_na_data_de_um_nacional_nao_aparece_duas_vezes — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-231 | Django | advocacia.tests.test_feriados_locais.CalendarioDeFeriadosAPITestCase.test_feriados_de_outro_escritorio_nao_aparecem — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-232 | Django | advocacia.tests.test_feriados_locais.CalendarioDeFeriadosAPITestCase.test_inclui_os_feriados_locais_do_escritorio — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-233 | Django | advocacia.tests.test_feriados_locais.CalendarioDeFeriadosAPITestCase.test_informa_o_recesso_forense — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-234 | Django | advocacia.tests.test_feriados_locais.CalendarioDeFeriadosAPITestCase.test_lista_os_feriados_nacionais_com_nome — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-235 | Django | advocacia.tests.test_feriados_locais.FeriadosLocaisAPITestCase.test_cadastra_lista_e_exclui — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-236 | Django | advocacia.tests.test_feriados_locais.FeriadosLocaisAPITestCase.test_calculadora_rejeita_processo_alheio_e_booleano_invalido — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-237 | Django | advocacia.tests.test_feriados_locais.FeriadosLocaisAPITestCase.test_calculadora_usa_e_mostra_o_feriado_local — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-238 | Django | advocacia.tests.test_feriados_locais.FeriadosLocaisAPITestCase.test_djen_ignora_feriado_de_outro_tribunal — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-239 | Django | advocacia.tests.test_feriados_locais.FeriadosLocaisAPITestCase.test_feriado_de_comarca_so_vale_para_processo_da_comarca — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-240 | Django | advocacia.tests.test_feriados_locais.FeriadosLocaisAPITestCase.test_financeiro_so_consulta — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-241 | Django | advocacia.tests.test_feriados_locais.FeriadosLocaisAPITestCase.test_intimacao_do_djen_considera_o_feriado_local — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-242 | Django | advocacia.tests.test_feriados_locais.FeriadosLocaisAPITestCase.test_mesma_data_duas_vezes_e_recusada — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-243 | Django | advocacia.tests.test_feriados_locais.FeriadosLocaisAPITestCase.test_mesma_data_pode_ser_cadastrada_para_comarcas_distintas — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-244 | Django | advocacia.tests.test_feriados_locais.FeriadosLocaisAPITestCase.test_outro_escritorio_nao_ve_nem_usa — `backend/advocacia/tests/test_feriados_locais.py` | APROVADO |
| BE-245 | Django | advocacia.tests.test_financeiro.ContratoHonorarioAPITestCase.test_contrato_a_vista_gera_uma_unica_parcela — `backend/advocacia/tests/test_financeiro.py` | APROVADO |
| BE-246 | Django | advocacia.tests.test_financeiro.ContratoHonorarioAPITestCase.test_contrato_parcelado_divide_o_valor_total_sem_perder_centavos — `backend/advocacia/tests/test_financeiro.py` | APROVADO |
| BE-247 | Django | advocacia.tests.test_financeiro.ContratoHonorarioAPITestCase.test_marcar_parcela_como_paga_atualiza_status_e_data — `backend/advocacia/tests/test_financeiro.py` | APROVADO |
| BE-248 | Django | advocacia.tests.test_financeiro.ContratoHonorarioAPITestCase.test_nao_e_possivel_criar_dois_contratos_para_o_mesmo_processo — `backend/advocacia/tests/test_financeiro.py` | APROVADO |
| BE-249 | Django | advocacia.tests.test_financeiro.ContratoValorMinimoAPITestCase.test_contrato_com_numero_de_parcelas_zero_e_rejeitado — `backend/advocacia/tests/test_financeiro.py` | APROVADO |
| BE-250 | Django | advocacia.tests.test_financeiro.ContratoValorMinimoAPITestCase.test_contrato_com_valor_zero_e_rejeitado — `backend/advocacia/tests/test_financeiro.py` | APROVADO |
| BE-251 | Django | advocacia.tests.test_fotos.FotosProtegidasAPITestCase.test_documento_e_rota_antiga_nao_sao_publicos — `backend/advocacia/tests/test_fotos.py` | APROVADO |
| BE-252 | Django | advocacia.tests.test_fotos.FotosProtegidasAPITestCase.test_envio_de_foto_na_conta_persiste_e_e_devolvido_na_proxima_consulta — `backend/advocacia/tests/test_fotos.py` | APROVADO |
| BE-253 | Django | advocacia.tests.test_fotos.FotosProtegidasAPITestCase.test_foto_exige_login_e_escritorio_correto — `backend/advocacia/tests/test_fotos.py` | APROVADO |
| BE-254 | Django | advocacia.tests.test_fotos.FotosProtegidasAPITestCase.test_foto_invalida_retorna_erro_sem_trocar_a_atual — `backend/advocacia/tests/test_fotos.py` | APROVADO |
| BE-255 | Django | advocacia.tests.test_fotos.FotosProtegidasAPITestCase.test_foto_legada_ainda_pode_ser_lida_do_storage_anterior — `backend/advocacia/tests/test_fotos.py` | APROVADO |
| BE-256 | Django | advocacia.tests.test_fotos.FotosProtegidasAPITestCase.test_foto_persiste_com_nova_instancia_sem_arquivo_no_disco — `backend/advocacia/tests/test_fotos.py` | APROVADO |
| BE-257 | Django | advocacia.tests.test_fotos.FotosProtegidasAPITestCase.test_tabela_de_fotos_tem_rls_no_postgresql — `backend/advocacia/tests/test_fotos.py` | APROVADO |
| BE-258 | Django | advocacia.tests.test_horas_e_despesas.ApontamentoHoraAPITestCase.test_apontamento_acima_de_24h_e_rejeitado — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-259 | Django | advocacia.tests.test_horas_e_despesas.ApontamentoHoraAPITestCase.test_apontamento_de_outro_escritorio_nao_aparece — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-260 | Django | advocacia.tests.test_horas_e_despesas.ApontamentoHoraAPITestCase.test_apontamento_e_lancado_em_nome_de_quem_esta_logado — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-261 | Django | advocacia.tests.test_horas_e_despesas.ApontamentoHoraAPITestCase.test_apontamento_em_data_futura_e_rejeitado — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-262 | Django | advocacia.tests.test_horas_e_despesas.ApontamentoHoraAPITestCase.test_criar_apontamento_calcula_horas_e_valor — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-263 | Django | advocacia.tests.test_horas_e_despesas.ApontamentoHoraAPITestCase.test_filtro_por_processo — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-264 | Django | advocacia.tests.test_horas_e_despesas.ApontamentoHoraAPITestCase.test_hora_nao_faturavel_nao_tem_valor — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-265 | Django | advocacia.tests.test_horas_e_despesas.ApontamentoHoraAPITestCase.test_minutos_zero_e_rejeitado — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-266 | Django | advocacia.tests.test_horas_e_despesas.DespesaAPITestCase.test_criar_despesa — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-267 | Django | advocacia.tests.test_horas_e_despesas.DespesaAPITestCase.test_despesa_registra_quem_lancou — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-268 | Django | advocacia.tests.test_horas_e_despesas.DespesaAPITestCase.test_filtro_por_reembolsavel — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-269 | Django | advocacia.tests.test_horas_e_despesas.DespesaAPITestCase.test_nao_reembolsavel_nao_pode_ser_reembolsada — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-270 | Django | advocacia.tests.test_horas_e_despesas.DespesaAPITestCase.test_valor_zero_e_rejeitado — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-271 | Django | advocacia.tests.test_horas_e_despesas.TempoDeUsoAPITestCase.test_admin_ve_o_tempo_de_toda_a_equipe — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-272 | Django | advocacia.tests.test_horas_e_despesas.TempoDeUsoAPITestCase.test_duracao_e_a_diferenca_entre_inicio_e_ultima_atividade — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-273 | Django | advocacia.tests.test_horas_e_despesas.TempoDeUsoAPITestCase.test_mes_invalido_e_rejeitado — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-274 | Django | advocacia.tests.test_horas_e_despesas.TempoDeUsoAPITestCase.test_mes_sem_uso_retorna_lista_vazia — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-275 | Django | advocacia.tests.test_horas_e_despesas.TempoDeUsoAPITestCase.test_nao_admin_ve_apenas_o_proprio_tempo — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-276 | Django | advocacia.tests.test_horas_e_despesas.TempoDeUsoAPITestCase.test_primeiro_sinal_abre_uma_sessao — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-277 | Django | advocacia.tests.test_horas_e_despesas.TempoDeUsoAPITestCase.test_relatorio_soma_o_tempo_do_mes — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-278 | Django | advocacia.tests.test_horas_e_despesas.TempoDeUsoAPITestCase.test_sinal_apos_a_janela_abre_nova_sessao — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-279 | Django | advocacia.tests.test_horas_e_despesas.TempoDeUsoAPITestCase.test_sinal_seguido_estende_a_mesma_sessao — `backend/advocacia/tests/test_horas_e_despesas.py` | APROVADO |
| BE-280 | Django | advocacia.tests.test_ia.AssistenteIAAPITestCase.test_cliente_de_outro_escritorio_nao_entra_no_contexto — `backend/advocacia/tests/test_ia.py` | APROVADO |
| BE-281 | Django | advocacia.tests.test_ia.AssistenteIAAPITestCase.test_contexto_do_cliente_nao_envia_documentos_ou_contatos — `backend/advocacia/tests/test_ia.py` | APROVADO |
| BE-282 | Django | advocacia.tests.test_ia.AssistenteIAAPITestCase.test_falha_da_openai_vira_502_sem_vazar_o_erro — `backend/advocacia/tests/test_ia.py` | APROVADO |
| BE-283 | Django | advocacia.tests.test_ia.AssistenteIAAPITestCase.test_historico_vindo_do_navegador_nao_injeta_mensagem_de_sistema — `backend/advocacia/tests/test_ia.py` | APROVADO |
| BE-284 | Django | advocacia.tests.test_ia.AssistenteIAAPITestCase.test_limite_proprio_de_chamadas_por_minuto — `backend/advocacia/tests/test_ia.py` | APROVADO |
| BE-285 | Django | advocacia.tests.test_ia.AssistenteIAAPITestCase.test_mensagem_e_historico_minimizam_identificadores — `backend/advocacia/tests/test_ia.py` | APROVADO |
| BE-286 | Django | advocacia.tests.test_ia.AssistenteIAAPITestCase.test_mensagem_grande_demais_e_recusada_sem_chamar_a_openai — `backend/advocacia/tests/test_ia.py` | APROVADO |
| BE-287 | Django | advocacia.tests.test_ia.AssistenteIAAPITestCase.test_mensagem_vazia_e_recusada — `backend/advocacia/tests/test_ia.py` | APROVADO |
| BE-288 | Django | advocacia.tests.test_ia.AssistenteIAAPITestCase.test_responde_com_o_texto_devolvido_pela_openai — `backend/advocacia/tests/test_ia.py` | APROVADO |
| BE-289 | Django | advocacia.tests.test_ia.AssistenteIAAPITestCase.test_sem_chave_configurada_responde_servico_indisponivel — `backend/advocacia/tests/test_ia.py` | APROVADO |
| BE-290 | Django | advocacia.tests.test_kanban.QuadroDeTarefasAPITestCase.test_mover_o_cartao_para_concluida_registra_a_data — `backend/advocacia/tests/test_kanban.py` | APROVADO |
| BE-291 | Django | advocacia.tests.test_kanban.QuadroDeTarefasAPITestCase.test_quadro_traz_o_que_esta_em_jogo_e_as_concluidas_recentes — `backend/advocacia/tests/test_kanban.py` | APROVADO |
| BE-292 | Django | advocacia.tests.test_lembretes_e_avisos.AvisosPorEventoAPITestCase.test_autor_da_acao_nao_recebe_o_proprio_aviso — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-293 | Django | advocacia.tests.test_lembretes_e_avisos.AvisosPorEventoAPITestCase.test_edicao_sem_mudar_status_nao_avisa — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-294 | Django | advocacia.tests.test_lembretes_e_avisos.AvisosPorEventoAPITestCase.test_falha_de_email_nao_derruba_a_operacao — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-295 | Django | advocacia.tests.test_lembretes_e_avisos.AvisosPorEventoAPITestCase.test_mudanca_de_status_avisa_os_colegas — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-296 | Django | advocacia.tests.test_lembretes_e_avisos.AvisosPorEventoAPITestCase.test_novo_cliente_avisa_os_colegas — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-297 | Django | advocacia.tests.test_lembretes_e_avisos.AvisosPorEventoAPITestCase.test_preferencia_desligada_nao_recebe — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-298 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_comando_e_idempotente — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-299 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_contagem_de_dias_usa_o_fuso_local — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-300 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_dry_run_nao_envia_nem_registra — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-301 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_evento_dentro_da_antecedencia_gera_email — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-302 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_evento_fora_da_antecedencia_nao_gera_email — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-303 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_evento_ja_cumprido_nao_gera_email — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-304 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_falha_de_envio_nao_marca_como_enviado — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-305 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_falha_do_email_nao_impede_o_push — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-306 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_prazo_fatal_e_identificado_no_assunto — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-307 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_prazo_fatal_recebe_reforco_em_dois_dias_um_dia_e_no_dia — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-308 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_preferencia_desligada_nao_gera_email — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-309 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_resumo_semanal_e_enviado_uma_vez_por_semana — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-310 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_resumo_semanal_lista_eventos_da_semana — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-311 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_usuario_de_outro_escritorio_nao_recebe_eventos_alheios — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-312 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_usuario_inativo_nao_recebe — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-313 | Django | advocacia.tests.test_lembretes_e_avisos.EnvioDeLembretesTestCase.test_usuario_sem_email_ainda_recebe_push — `backend/advocacia/tests/test_lembretes_e_avisos.py` | APROVADO |
| BE-314 | Django | advocacia.tests.test_modelos_documento.ModeloDocumentoAPITestCase.test_criar_modelo_pela_api — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-315 | Django | advocacia.tests.test_modelos_documento.ModeloDocumentoAPITestCase.test_gerar_documento_a_partir_de_cliente — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-316 | Django | advocacia.tests.test_modelos_documento.ModeloDocumentoAPITestCase.test_gerar_sem_cliente_nem_processo_e_rejeitado — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-317 | Django | advocacia.tests.test_modelos_documento.ModeloDocumentoAPITestCase.test_listar_variaveis_disponiveis — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-318 | Django | advocacia.tests.test_modelos_documento.ModeloDocumentoAPITestCase.test_modelo_de_outro_escritorio_nao_e_acessivel — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-319 | Django | advocacia.tests.test_modelos_documento.ModeloDocumentoAPITestCase.test_nao_preenche_com_cliente_de_outro_escritorio — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-320 | Django | advocacia.tests.test_modelos_documento.ModeloDocumentoAPITestCase.test_nome_de_modelo_duplicado_no_mesmo_escritorio_e_rejeitado — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-321 | Django | advocacia.tests.test_modelos_documento.PreenchimentoDeModeloTestCase.test_campo_em_branco_no_cadastro_e_sinalizado — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-322 | Django | advocacia.tests.test_modelos_documento.PreenchimentoDeModeloTestCase.test_data_por_extenso_e_cidade — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-323 | Django | advocacia.tests.test_modelos_documento.PreenchimentoDeModeloTestCase.test_espacos_dentro_das_chaves_sao_tolerados — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-324 | Django | advocacia.tests.test_modelos_documento.PreenchimentoDeModeloTestCase.test_nao_expoe_campo_sensivel_por_travessia_de_atributo — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-325 | Django | advocacia.tests.test_modelos_documento.PreenchimentoDeModeloTestCase.test_processo_preenche_cliente_e_advogado_automaticamente — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-326 | Django | advocacia.tests.test_modelos_documento.PreenchimentoDeModeloTestCase.test_substitui_variaveis_do_cliente — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-327 | Django | advocacia.tests.test_modelos_documento.PreenchimentoDeModeloTestCase.test_variavel_fora_do_catalogo_e_mantida_e_sinalizada — `backend/advocacia/tests/test_modelos_documento.py` | APROVADO |
| BE-328 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_a_mensagem_nao_confirma_a_existencia_do_registro_alheio — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-329 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_a_rota_generica_nao_troca_senha — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-330 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_admin_exclui_usuario_sem_vinculos — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-331 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_admin_nao_exclui_a_propria_conta — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-332 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_admin_pode_consultar_dados_completos_de_membro — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-333 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_administrador_nao_altera_o_proprio_perfil — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-334 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_administrador_troca_o_perfil_de_outro — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-335 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_advogado_nao_edita_outro_usuario — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-336 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_advogado_nao_reativa_a_propria_conta — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-337 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_advogado_nao_se_promove_a_administrador — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-338 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_agenda_nao_entra_em_processo_alheio — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-339 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_apenas_administrador_desativa_usuario — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-340 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_apontamento_nao_entra_em_processo_alheio — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-341 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_cada_um_edita_os_proprios_dados — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-342 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_cliente_sem_processo_continua_excluivel — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-343 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_colega_ve_apenas_resumo_da_equipe — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-344 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_contrato_nao_entra_em_processo_alheio — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-345 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_despesa_nao_entra_em_processo_alheio — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-346 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_escritorio_desativado_derruba_os_usuarios — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-347 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_escritorio_nao_fica_sem_administrador — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-348 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_excluir_cliente_com_processo_e_recusado — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-349 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_filtro_invalido_responde_400_e_nao_500 — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-350 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_filtro_valido_continua_funcionando — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-351 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_movimentacao_nao_entra_em_processo_alheio — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-352 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_processo_nao_aceita_cliente_de_outro_escritorio — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-353 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_refresh_nao_renova_acesso_de_conta_desativada — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-354 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_usuario_com_processo_nao_e_excluido — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-355 | Django | advocacia.tests.test_permissoes.IsolamentoEAutorizacaoTestCase.test_usuario_desativado_perde_o_acesso_imediatamente — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-356 | Django | advocacia.tests.test_permissoes.PerfisDeAcessoAPITestCase.test_admin_cadastra_membro_sem_oab_e_ele_consegue_entrar — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-357 | Django | advocacia.tests.test_permissoes.PerfisDeAcessoAPITestCase.test_admin_troca_perfil_para_financeiro — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-358 | Django | advocacia.tests.test_permissoes.PerfisDeAcessoAPITestCase.test_busca_nao_traz_area_que_o_perfil_nao_ve — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-359 | Django | advocacia.tests.test_permissoes.PerfisDeAcessoAPITestCase.test_estagiario_cadastra_cliente_mas_nao_exclui — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-360 | Django | advocacia.tests.test_permissoes.PerfisDeAcessoAPITestCase.test_estagiario_e_secretaria_nao_veem_o_financeiro — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-361 | Django | advocacia.tests.test_permissoes.PerfisDeAcessoAPITestCase.test_financeiro_cuida_dos_contratos_mas_nao_altera_processo — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-362 | Django | advocacia.tests.test_permissoes.PerfisDeAcessoAPITestCase.test_login_devolve_as_permissoes_do_perfil — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-363 | Django | advocacia.tests.test_permissoes.PerfisDeAcessoAPITestCase.test_secretaria_agenda_compromisso_mas_nao_usa_a_ia — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-364 | Django | advocacia.tests.test_permissoes.PerfisDeAcessoAPITestCase.test_so_admin_cadastra_membro — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-365 | Django | advocacia.tests.test_permissoes.ProcessoSigilosoAPITestCase.test_outro_advogado_nao_ve_o_processo_nem_o_que_pende_dele — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-366 | Django | advocacia.tests.test_permissoes.ProcessoSigilosoAPITestCase.test_relatorio_do_cliente_omite_o_sigiloso_para_quem_nao_pode — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-367 | Django | advocacia.tests.test_permissoes.ProcessoSigilosoAPITestCase.test_responsavel_e_administrador_veem — `backend/advocacia/tests/test_permissoes.py` | APROVADO |
| BE-368 | Django | advocacia.tests.test_pix.BRCodeTestCase.test_crc_do_exemplo_do_manual_do_banco_central — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-369 | Django | advocacia.tests.test_pix.BRCodeTestCase.test_descricao_longa_e_cortada_para_caber_no_campo — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-370 | Django | advocacia.tests.test_pix.BRCodeTestCase.test_normaliza_a_chave_sem_validar_documento — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-371 | Django | advocacia.tests.test_pix.BRCodeTestCase.test_payload_tem_valor_destinatario_e_crc_valido — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-372 | Django | advocacia.tests.test_pix.BRCodeTestCase.test_sem_chave_ou_sem_cidade_explica_o_que_falta — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-373 | Django | advocacia.tests.test_pix.PixDaParcelaAPITestCase.test_chave_sem_tipo_e_recusada — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-374 | Django | advocacia.tests.test_pix.PixDaParcelaAPITestCase.test_gera_qr_code_e_copia_e_cola_da_parcela — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-375 | Django | advocacia.tests.test_pix.PixDaParcelaAPITestCase.test_parcela_de_processo_sigiloso_nao_aparece_para_quem_nao_ve — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-376 | Django | advocacia.tests.test_pix.PixDaParcelaAPITestCase.test_parcela_paga_nao_gera_pix — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-377 | Django | advocacia.tests.test_pix.PixDaParcelaAPITestCase.test_perfil_sem_financeiro_nao_acessa — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-378 | Django | advocacia.tests.test_pix.PixDaParcelaAPITestCase.test_sem_chave_cadastrada_explica_onde_configurar — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-379 | Django | advocacia.tests.test_pix.PixDaParcelaAPITestCase.test_simulacao_exige_permissao_e_escritorio_correto — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-380 | Django | advocacia.tests.test_pix.PixDaParcelaAPITestCase.test_simulacao_recusa_codigo_real_e_modo_invalido — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-381 | Django | advocacia.tests.test_pix.PixDaParcelaAPITestCase.test_simulacao_repetida_nao_altera_parcela_real — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-382 | Django | advocacia.tests.test_pix.PixDaParcelaAPITestCase.test_teste_funciona_sem_chave_e_nao_contem_dados_bancarios — `backend/advocacia/tests/test_pix.py` | APROVADO |
| BE-383 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_cadastrar_processo_ja_arquivado_nao_esbarra_no_limite — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-384 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_catalogo_e_publico_e_o_primeiro_plano_e_gratuito — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-385 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_catalogo_funciona_mesmo_com_token_vencido_no_navegador — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-386 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_consulta_manual_ao_datajud_continua_no_gratuito — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-387 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_desarquivar_acima_do_limite_e_recusado — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-388 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_escritorio_novo_comeca_no_gratuito_sem_pagar — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-389 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_gratuito_recusa_novo_advogado_acima_do_limite — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-390 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_gratuito_recusa_o_quarto_usuario_sem_apagar_ninguem — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-391 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_gratuito_recusa_processo_acima_de_30_ativos — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-392 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_ia_fica_no_profissional_e_nao_chama_a_openai_no_gratuito — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-393 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_intimacoes_do_djen_ficam_nos_planos_pagos — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-394 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_pix_teste_de_assinatura_nao_contrata_nem_altera_limites — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-395 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_pix_teste_exige_login_e_plano_valido — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-396 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_pix_teste_recusa_codigo_de_outro_escritorio_ou_plano — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-397 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_plano_pago_dentro_da_validade_vale — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-398 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_plano_pago_libera_mais_usuarios — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-399 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_plano_pago_vencido_vale_como_gratuito — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-400 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_processo_arquivado_nao_conta_no_limite — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-401 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_profissional_nao_tem_limite_de_processos — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-402 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_reativar_usuario_respeita_o_limite_mas_desativar_sempre_pode — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-403 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_resumo_ao_cliente_no_gratuito_usa_o_modelo_sem_ia — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-404 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_rotina_do_djen_pula_escritorio_gratuito — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-405 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_sincronizacao_automatica_do_datajud_pula_escritorio_gratuito — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-406 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_situacao_mostra_plano_uso_e_limites — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-407 | Django | advocacia.tests.test_planos.PlanosAPITestCase.test_usuario_de_outro_escritorio_ve_so_o_proprio_plano — `backend/advocacia/tests/test_planos.py` | APROVADO |
| BE-408 | Django | advocacia.tests.test_popular_demo.PopularDemonstracaoTestCase.test_cria_um_escritorio_completo_e_utilizavel — `backend/advocacia/tests/test_popular_demo.py` | APROVADO |
| BE-409 | Django | advocacia.tests.test_popular_demo.PopularDemonstracaoTestCase.test_nao_duplica_e_recria_quando_pedido — `backend/advocacia/tests/test_popular_demo.py` | APROVADO |
| BE-410 | Django | advocacia.tests.test_processos.DownloadAutenticadoAPITestCase.test_admin_baixa_documento_de_identidade_de_qualquer_usuario_do_escritorio — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-411 | Django | advocacia.tests.test_processos.DownloadAutenticadoAPITestCase.test_advogado_baixa_o_proprio_documento_de_identidade — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-412 | Django | advocacia.tests.test_processos.DownloadAutenticadoAPITestCase.test_advogado_nao_baixa_documento_de_identidade_de_outro_advogado — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-413 | Django | advocacia.tests.test_processos.DownloadAutenticadoAPITestCase.test_download_de_documento_de_outro_escritorio_e_404 — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-414 | Django | advocacia.tests.test_processos.DownloadAutenticadoAPITestCase.test_download_de_documento_do_proprio_escritorio_funciona — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-415 | Django | advocacia.tests.test_processos.DownloadAutenticadoAPITestCase.test_download_de_documento_sem_autenticacao_e_negado — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-416 | Django | advocacia.tests.test_processos.DownloadAutenticadoAPITestCase.test_download_do_documento_de_identidade_de_cliente_de_outro_escritorio_e_404 — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-417 | Django | advocacia.tests.test_processos.DownloadAutenticadoAPITestCase.test_download_do_documento_de_identidade_do_cliente_funciona — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-418 | Django | advocacia.tests.test_processos.DownloadAutenticadoAPITestCase.test_serializer_de_cliente_nao_expoe_url_mas_avisa_que_ha_documento — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-419 | Django | advocacia.tests.test_processos.DownloadAutenticadoAPITestCase.test_serializer_de_documento_nao_expoe_url_do_arquivo — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-420 | Django | advocacia.tests.test_processos.FichaDoProcessoAPITestCase.test_ficha_de_processo_vazio_traz_listas_vazias_e_sem_contrato — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-421 | Django | advocacia.tests.test_processos.FichaDoProcessoAPITestCase.test_ficha_exige_autenticacao — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-422 | Django | advocacia.tests.test_processos.FichaDoProcessoAPITestCase.test_ficha_expoe_a_origem_da_movimentacao — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-423 | Django | advocacia.tests.test_processos.FichaDoProcessoAPITestCase.test_ficha_nao_alcanca_processo_de_outro_escritorio — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-424 | Django | advocacia.tests.test_processos.FichaDoProcessoAPITestCase.test_ficha_reune_todos_os_blocos_do_processo — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-425 | Django | advocacia.tests.test_processos.FichaDoProcessoAPITestCase.test_processo_serializado_traz_data_de_sincronizacao_com_datajud — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-426 | Django | advocacia.tests.test_processos.MovimentacaoCriadoPorAPITestCase.test_movimentacao_registra_o_usuario_que_criou — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-427 | Django | advocacia.tests.test_processos.MovimentacaoManualAPITestCase.test_exclui_movimentacao_lancada_manualmente — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-428 | Django | advocacia.tests.test_processos.MovimentacaoManualAPITestCase.test_movimentacao_criada_pela_api_nasce_com_origem_manual — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-429 | Django | advocacia.tests.test_processos.MovimentacaoManualAPITestCase.test_nao_exclui_movimentacao_importada_do_datajud — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-430 | Django | advocacia.tests.test_processos.ProcessosAPITestCase.test_criar_processo — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-431 | Django | advocacia.tests.test_processos.ProcessosAPITestCase.test_criar_processo_com_dados_juridicos_adicionais — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-432 | Django | advocacia.tests.test_processos.ProcessosAPITestCase.test_criar_processo_com_numero_duplicado_retorna_erro_especifico — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-433 | Django | advocacia.tests.test_processos.ProcessosAPITestCase.test_editar_processo_para_numero_de_outro_retorna_erro_especifico — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-434 | Django | advocacia.tests.test_processos.ProcessosAPITestCase.test_percentual_honorarios_sucumbencia_zero_e_rejeitado — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-435 | Django | advocacia.tests.test_processos.ProcessosAPITestCase.test_processo_sem_dados_juridicos_adicionais_tem_estimativa_nula — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-436 | Django | advocacia.tests.test_processos.ProcessosAPITestCase.test_valor_da_causa_zero_e_rejeitado — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-437 | Django | advocacia.tests.test_processos.ProximoPrazoDoProcessoAPITestCase.test_com_varios_prazos_traz_o_mais_proximo — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-438 | Django | advocacia.tests.test_processos.ProximoPrazoDoProcessoAPITestCase.test_compromisso_nao_e_confundido_com_prazo — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-439 | Django | advocacia.tests.test_processos.ProximoPrazoDoProcessoAPITestCase.test_prazo_cumprido_nao_conta_como_proximo_prazo — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-440 | Django | advocacia.tests.test_processos.ProximoPrazoDoProcessoAPITestCase.test_prazo_futuro_aparece_e_nao_esta_atrasado — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-441 | Django | advocacia.tests.test_processos.ProximoPrazoDoProcessoAPITestCase.test_prazo_vencido_aparece_como_atrasado — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-442 | Django | advocacia.tests.test_processos.ProximoPrazoDoProcessoAPITestCase.test_processo_recem_criado_tambem_traz_proximo_prazo — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-443 | Django | advocacia.tests.test_processos.ProximoPrazoDoProcessoAPITestCase.test_processo_sem_prazo_nao_tem_proximo_prazo — `backend/advocacia/tests/test_processos.py` | APROVADO |
| BE-444 | Django | advocacia.tests.test_push.NotificacoesPushAPITestCase.test_cancelar_remove_so_o_aparelho_da_pessoa — `backend/advocacia/tests/test_push.py` | APROVADO |
| BE-445 | Django | advocacia.tests.test_push.NotificacoesPushAPITestCase.test_inscreve_e_a_mensagem_chega_cifrada_e_assinada — `backend/advocacia/tests/test_push.py` | APROVADO |
| BE-446 | Django | advocacia.tests.test_push.NotificacoesPushAPITestCase.test_inscricao_expirada_e_apagada — `backend/advocacia/tests/test_push.py` | APROVADO |
| BE-447 | Django | advocacia.tests.test_push.NotificacoesPushAPITestCase.test_inscricao_sem_https_ou_sem_chaves_e_recusada — `backend/advocacia/tests/test_push.py` | APROVADO |
| BE-448 | Django | advocacia.tests.test_push.NotificacoesPushAPITestCase.test_mesmo_aparelho_passa_para_quem_entrou_nele — `backend/advocacia/tests/test_push.py` | APROVADO |
| BE-449 | Django | advocacia.tests.test_push.NotificacoesPushAPITestCase.test_situacao_traz_a_chave_publica — `backend/advocacia/tests/test_push.py` | APROVADO |
| BE-450 | Django | advocacia.tests.test_push.NotificacoesPushAPITestCase.test_tarefa_atribuida_avisa_o_responsavel_no_celular — `backend/advocacia/tests/test_push.py` | APROVADO |
| BE-451 | Django | advocacia.tests.test_push.NotificacoesPushAPITestCase.test_testar_sem_aparelho_explica — `backend/advocacia/tests/test_push.py` | APROVADO |
| BE-452 | Django | advocacia.tests.test_push.PushDesligadoAPITestCase.test_comando_gera_par_de_chaves — `backend/advocacia/tests/test_push.py` | APROVADO |
| BE-453 | Django | advocacia.tests.test_push.PushDesligadoAPITestCase.test_sem_chaves_o_sistema_avisa_e_nao_tenta_enviar — `backend/advocacia/tests/test_push.py` | APROVADO |
| BE-454 | Django | advocacia.tests.test_rascunhos.RascunhoFormularioAPITestCase.test_cria_e_atualiza_o_mesmo_rascunho — `backend/advocacia/tests/test_rascunhos.py` | APROVADO |
| BE-455 | Django | advocacia.tests.test_rascunhos.RascunhoFormularioAPITestCase.test_rascunho_e_privado_ate_no_mesmo_escritorio — `backend/advocacia/tests/test_rascunhos.py` | APROVADO |
| BE-456 | Django | advocacia.tests.test_rascunhos.RascunhoFormularioAPITestCase.test_recusa_chave_fora_do_formato_seguro — `backend/advocacia/tests/test_rascunhos.py` | APROVADO |
| BE-457 | Django | advocacia.tests.test_rascunhos.RascunhoFormularioAPITestCase.test_recusa_conteudo_que_nao_seja_objeto — `backend/advocacia/tests/test_rascunhos.py` | APROVADO |
| BE-458 | Django | advocacia.tests.test_rascunhos.RascunhoFormularioAPITestCase.test_recusa_rascunho_maior_que_64_kb — `backend/advocacia/tests/test_rascunhos.py` | APROVADO |
| BE-459 | Django | advocacia.tests.test_rascunhos.RascunhoFormularioAPITestCase.test_usuario_pode_excluir_o_proprio_rascunho — `backend/advocacia/tests/test_rascunhos.py` | APROVADO |
| BE-460 | Django | advocacia.tests.test_relatorios.ExportacaoCSVSeguraAPITestCase.test_exportacao_de_clientes_neutraliza_nome_com_formula — `backend/advocacia/tests/test_relatorios.py` | APROVADO |
| BE-461 | Django | advocacia.tests.test_relatorios.ExportacaoCSVSeguraAPITestCase.test_exportacao_de_processos_neutraliza_titulo_com_formula — `backend/advocacia/tests/test_relatorios.py` | APROVADO |
| BE-462 | Django | advocacia.tests.test_relatorios.RelatorioFinanceiroAPITestCase.test_cliente_sem_lancamentos_tem_resumo_zerado — `backend/advocacia/tests/test_relatorios.py` | APROVADO |
| BE-463 | Django | advocacia.tests.test_relatorios.RelatorioFinanceiroAPITestCase.test_email_do_relatorio_de_cliente_lista_o_financeiro — `backend/advocacia/tests/test_relatorios.py` | APROVADO |
| BE-464 | Django | advocacia.tests.test_relatorios.RelatorioFinanceiroAPITestCase.test_email_do_relatorio_de_processo_lista_o_financeiro — `backend/advocacia/tests/test_relatorios.py` | APROVADO |
| BE-465 | Django | advocacia.tests.test_relatorios.RelatorioFinanceiroAPITestCase.test_hora_sem_valor_hora_nao_entra_no_valor_a_cobrar — `backend/advocacia/tests/test_relatorios.py` | APROVADO |
| BE-466 | Django | advocacia.tests.test_relatorios.RelatorioFinanceiroAPITestCase.test_relatorio_do_cliente_traz_contratos_horas_e_despesas — `backend/advocacia/tests/test_relatorios.py` | APROVADO |
| BE-467 | Django | advocacia.tests.test_relatorios.RelatorioFinanceiroAPITestCase.test_relatorio_do_processo_tambem_traz_o_financeiro — `backend/advocacia/tests/test_relatorios.py` | APROVADO |
| BE-468 | Django | advocacia.tests.test_relatorios.RelatorioFinanceiroAPITestCase.test_relatorio_nao_soma_dados_de_outro_cliente — `backend/advocacia/tests/test_relatorios.py` | APROVADO |
| BE-469 | Django | advocacia.tests.test_relatorios.RelatorioFinanceiroAPITestCase.test_resumo_do_cliente_consolida_os_valores — `backend/advocacia/tests/test_relatorios.py` | APROVADO |
| BE-470 | Django | advocacia.tests.test_resumo_cliente.ResumoParaClienteAPITestCase.test_com_ia_manda_so_o_minimo_e_devolve_o_texto_dela — `backend/advocacia/tests/test_resumo_cliente.py` | APROVADO |
| BE-471 | Django | advocacia.tests.test_resumo_cliente.ResumoParaClienteAPITestCase.test_processo_sigiloso_de_outro_advogado_nao_e_acessivel — `backend/advocacia/tests/test_resumo_cliente.py` | APROVADO |
| BE-472 | Django | advocacia.tests.test_resumo_cliente.ResumoParaClienteAPITestCase.test_se_a_ia_falha_cai_no_modelo — `backend/advocacia/tests/test_resumo_cliente.py` | APROVADO |
| BE-473 | Django | advocacia.tests.test_resumo_cliente.ResumoParaClienteAPITestCase.test_secretaria_sem_acesso_a_ia_recebe_o_modelo — `backend/advocacia/tests/test_resumo_cliente.py` | APROVADO |
| BE-474 | Django | advocacia.tests.test_resumo_cliente.ResumoParaClienteAPITestCase.test_sem_ia_configurada_usa_o_modelo_em_linguagem_simples — `backend/advocacia/tests/test_resumo_cliente.py` | APROVADO |
| BE-475 | Django | advocacia.tests.test_resumo_cliente.ResumoParaClienteAPITestCase.test_traduz_os_andamentos_mais_comuns — `backend/advocacia/tests/test_resumo_cliente.py` | APROVADO |
| BE-476 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_alta_prioridade_vem_antes_de_media_e_baixa — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-477 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_aviso_respeita_a_preferencia_do_responsavel — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-478 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_concluir_tarefa_grava_a_data_de_conclusao — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-479 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_criar_tarefa_registra_quem_atribuiu — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-480 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_editar_sem_trocar_responsavel_nao_reenvia_aviso — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-481 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_entre_tarefas_de_mesma_prioridade_vence_o_prazo_mais_proximo — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-482 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_filtro_abertas_deixa_de_fora_concluidas_e_canceladas — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-483 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_filtro_responsavel_eu_traz_so_as_minhas — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-484 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_nao_atribui_tarefa_a_usuario_inativo — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-485 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_quem_se_atribui_uma_tarefa_nao_recebe_aviso_de_si_mesmo — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-486 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_reabrir_tarefa_limpa_a_data_de_conclusao — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-487 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_responsavel_de_outro_escritorio_e_recusado — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-488 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_responsavel_e_avisado_por_email — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-489 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_tarefa_com_prazo_vencido_aparece_como_atrasada — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-490 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_tarefa_concluida_nao_conta_como_atrasada — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-491 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_tarefa_de_outro_escritorio_nao_aparece — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-492 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_tarefa_encerrada_vai_para_o_fim_da_lista — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-493 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_tarefa_pode_existir_sem_processo — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-494 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_tarefa_pode_ser_vinculada_a_um_processo — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-495 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_tarefa_sem_prazo_nunca_esta_atrasada — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-496 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_titulo_em_branco_e_recusado — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-497 | Django | advocacia.tests.test_tarefas.TarefaAPITestCase.test_trocar_o_responsavel_avisa_o_novo — `backend/advocacia/tests/test_tarefas.py` | APROVADO |
| BE-498 | Django | advocacia.tests.test_validacoes.ModelosTestCase.test_cliente_nao_permite_cpf_duplicado_no_mesmo_escritorio — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-499 | Django | advocacia.tests.test_validacoes.ModelosTestCase.test_mesmo_cpf_e_permitido_em_escritorios_diferentes — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-500 | Django | advocacia.tests.test_validacoes.ModelosTestCase.test_str_do_escritorio_retorna_o_nome — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-501 | Django | advocacia.tests.test_validacoes.ModelosTestCase.test_usuario_e_criado_com_valores_padrao_esperados — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-502 | Django | advocacia.tests.test_validacoes.PaginacaoAPITestCase.test_listagem_retorna_envelope_paginado — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-503 | Django | advocacia.tests.test_validacoes.PaginacaoAPITestCase.test_page_size_customizado_e_respeitado — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-504 | Django | advocacia.tests.test_validacoes.ValidacaoDeDocumentosAPITestCase.test_advogado_com_oab_sem_uf_e_rejeitado — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-505 | Django | advocacia.tests.test_validacoes.ValidacaoDeDocumentosAPITestCase.test_advogado_com_oab_valida_e_aceito — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-506 | Django | advocacia.tests.test_validacoes.ValidacaoDeDocumentosAPITestCase.test_advogado_com_senha_fraca_e_rejeitado — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-507 | Django | advocacia.tests.test_validacoes.ValidacaoDeDocumentosAPITestCase.test_cliente_com_cpf_incompleto_e_rejeitado — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-508 | Django | advocacia.tests.test_validacoes.ValidacaoDeDocumentosAPITestCase.test_cliente_com_rg_curto_demais_e_rejeitado — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-509 | Django | advocacia.tests.test_validacoes.ValidacaoDeDocumentosAPITestCase.test_cliente_com_telefone_sem_ddd_e_rejeitado — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-510 | Django | advocacia.tests.test_validacoes.ValidadoresDeUploadTestCase.test_documento_acima_de_10mb_levanta_erro — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-511 | Django | advocacia.tests.test_validacoes.ValidadoresDeUploadTestCase.test_documento_dentro_do_limite_nao_levanta_erro — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-512 | Django | advocacia.tests.test_validacoes.ValidadoresDeUploadTestCase.test_docx_com_assinatura_correta_passa — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-513 | Django | advocacia.tests.test_validacoes.ValidadoresDeUploadTestCase.test_executavel_renomeado_para_pdf_e_recusado — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-514 | Django | advocacia.tests.test_validacoes.ValidadoresDeUploadTestCase.test_imagem_acima_de_5mb_levanta_erro — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-515 | Django | advocacia.tests.test_validacoes.ValidadoresDeUploadTestCase.test_imagem_dentro_do_limite_nao_levanta_erro — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-516 | Django | advocacia.tests.test_validacoes.ValidadoresDeUploadTestCase.test_jpeg_com_assinatura_correta_passa — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-517 | Django | advocacia.tests.test_validacoes.ValidadoresDeUploadTestCase.test_pdf_com_assinatura_correta_passa — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-518 | Django | advocacia.tests.test_validacoes.ValidadoresDeUploadTestCase.test_png_com_assinatura_correta_passa — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-519 | Django | advocacia.tests.test_validacoes.ValidadoresDeUploadTestCase.test_riff_que_nao_e_webp_e_recusado — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-520 | Django | advocacia.tests.test_validacoes.ValidadoresDeUploadTestCase.test_texto_renomeado_para_jpg_e_recusado — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-521 | Django | advocacia.tests.test_validacoes.ValidadoresDeUploadTestCase.test_validador_devolve_o_ponteiro_do_arquivo_para_o_inicio — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-522 | Django | advocacia.tests.test_validacoes.ValidadoresDeUploadTestCase.test_webp_com_assinatura_correta_passa — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-523 | Django | advocacia.tests.test_validacoes.ValidarEmailRealTestCase.test_cnpj_aceita_ambos_formatos_e_exige_dois_digitos_finais — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-524 | Django | advocacia.tests.test_validacoes.ValidarEmailRealTestCase.test_dominio_descartavel_levanta_erro — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-525 | Django | advocacia.tests.test_validacoes.ValidarEmailRealTestCase.test_dominio_sem_registro_mx_levanta_erro — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-526 | Django | advocacia.tests.test_validacoes.ValidarEmailRealTestCase.test_email_com_dominio_valido_e_aceito — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-527 | Django | advocacia.tests.test_validacoes.ValidarEmailRealTestCase.test_email_vazio_levanta_erro — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-528 | Django | advocacia.tests.test_validacoes.ValidarEmailRealTestCase.test_formato_invalido_levanta_erro — `backend/advocacia/tests/test_validacoes.py` | APROVADO |
| BE-529 | Django | advocacia.tests.test_deploy.ConfiguracaoPilotoTests.test_health_reporta_banco_disponivel — `backend/advocacia/tests/test_deploy.py` | APROVADO |
| BE-530 | Django | advocacia.tests.test_deploy.ConfiguracaoPilotoTests.test_health_reporta_banco_indisponivel — `backend/advocacia/tests/test_deploy.py` | APROVADO |
| BE-531 | Django | advocacia.tests.test_deploy.ConfiguracaoPilotoTests.test_senha_padrao_da_demo_e_recusada_em_producao — `backend/advocacia/tests/test_deploy.py` | APROVADO |
| BE-532 | Django | advocacia.tests.test_deploy.ConfiguracaoPilotoTests.test_url_da_foto_passa_pela_api_autenticada — `backend/advocacia/tests/test_deploy.py` | APROVADO |
| FE-001 | Jest | LoginForm sem duas etapas, entra direto com a senha — `frontend/src/components/forms/__tests__/LoginForm.test.js` | APROVADO |
| FE-002 | Jest | LoginForm com duas etapas, pede o código e só então abre a sessão — `frontend/src/components/forms/__tests__/LoginForm.test.js` | APROVADO |
| FE-003 | Jest | LoginForm código errado mostra o erro e limpa o campo — `frontend/src/components/forms/__tests__/LoginForm.test.js` | APROVADO |
| FE-004 | Jest | LoginForm dá para voltar e entrar com outra conta — `frontend/src/components/forms/__tests__/LoginForm.test.js` | APROVADO |
| FE-005 | Jest | LoginForm avisa quando o servidor demora para responder — `frontend/src/components/forms/__tests__/LoginForm.test.js` | APROVADO |
| FE-006 | Jest | login não envia senha na URL se o JavaScript falhar — `frontend/src/components/forms/__tests__/LoginForm.test.js` | APROVADO |
| FE-007 | Jest | useRecurso começa carregando e entrega os dados quando a API responde — `frontend/src/hooks/__tests__/useRecurso.test.js` | APROVADO |
| FE-008 | Jest | useRecurso não busca nada enquanto estiver inativo — `frontend/src/hooks/__tests__/useRecurso.test.js` | APROVADO |
| FE-009 | Jest | useRecurso refaz a consulta quando uma das chaves muda — `frontend/src/hooks/__tests__/useRecurso.test.js` | APROVADO |
| FE-010 | Jest | useRecurso resposta atrasada de uma consulta antiga não sobrescreve a atual — `frontend/src/hooks/__tests__/useRecurso.test.js` | APROVADO |
| FE-011 | Jest | useRecurso em caso de erro, guarda a mensagem e mantém os dados anteriores — `frontend/src/hooks/__tests__/useRecurso.test.js` | APROVADO |
| FE-012 | Jest | useRecurso recarregar busca de novo mesmo sem mudar as chaves — `frontend/src/hooks/__tests__/useRecurso.test.js` | APROVADO |
| FE-013 | Jest | useListaPaginada carrega a primeira página e informa o total do servidor — `frontend/src/hooks/__tests__/useRecurso.test.js` | APROVADO |
| FE-014 | Jest | useListaPaginada carregarMais junta as páginas seguintes até acabar — `frontend/src/hooks/__tests__/useRecurso.test.js` | APROVADO |
| FE-015 | Jest | useListaPaginada ao trocar o filtro, descarta as páginas extras do filtro anterior — `frontend/src/hooks/__tests__/useRecurso.test.js` | APROVADO |
| FE-016 | Jest | useListaPaginada aceita resposta sem paginação (lista simples) — `frontend/src/hooks/__tests__/useRecurso.test.js` | APROVADO |
| FE-017 | Jest | explica as etapas e atualiza o progresso dos obrigatórios — `frontend/src/components/panels/__tests__/ProcessoForm.test.jsx` | APROVADO |
| FE-018 | Jest | associa o erro da API ao campo e o limpa quando o usuário corrige — `frontend/src/components/panels/__tests__/ProcessoForm.test.jsx` | APROVADO |
| FE-019 | Jest | ReceitaDespesas sem movimento nos seis meses mostra o estado vazio, não um gráfico zerado — `frontend/src/components/dashboard/__tests__/ReceitaDespesas.test.js` | APROVADO |
| FE-020 | Jest | ReceitaDespesas resume o período com recebido, despesas e saldo — `frontend/src/components/dashboard/__tests__/ReceitaDespesas.test.js` | APROVADO |
| FE-021 | Jest | ReceitaDespesas oferece a mesma informação em tabela, para quem não enxerga o gráfico — `frontend/src/components/dashboard/__tests__/ReceitaDespesas.test.js` | APROVADO |
| FE-022 | Jest | useRascunhoFormulario restaura o rascunho privado vindo do servidor — `frontend/src/hooks/__tests__/useRascunhoFormulario.test.js` | APROVADO |
| FE-023 | Jest | useRascunhoFormulario salva alterações no servidor depois do intervalo — `frontend/src/hooks/__tests__/useRascunhoFormulario.test.js` | APROVADO |
| FE-024 | Jest | useRascunhoFormulario descarta o rascunho após o cadastro definitivo — `frontend/src/hooks/__tests__/useRascunhoFormulario.test.js` | APROVADO |
| FE-025 | Jest | useRascunhoFormulario rascunho atrasado não sobrescreve o que a pessoa já digitou — `frontend/src/hooks/__tests__/useRascunhoFormulario.test.js` | APROVADO |
| FE-026 | Jest | useRascunhoFormulario aguarda gravação em andamento antes de descartar o rascunho — `frontend/src/hooks/__tests__/useRascunhoFormulario.test.js` | APROVADO |
| FE-027 | Jest | cadastro do escritório preenchido pelo CNPJ preenche nome, telefone, endereço, cidade, UF e CEP com os dados da Receita — `frontend/src/components/forms/__tests__/RegisterFormCnpj.test.js` | APROVADO |
| FE-028 | Jest | cadastro do escritório preenchido pelo CNPJ não sobrescreve o que a pessoa já digitou — `frontend/src/components/forms/__tests__/RegisterFormCnpj.test.js` | APROVADO |
| FE-029 | Jest | cadastro do escritório preenchido pelo CNPJ CNPJ não encontrado só avisa; o formulário continua editável — `frontend/src/components/forms/__tests__/RegisterFormCnpj.test.js` | APROVADO |
| FE-030 | Jest | descreverData feriado anual mostra só dia e mês — `frontend/src/components/panels/__tests__/AgendaFeriados.test.js` | APROVADO |
| FE-031 | Jest | AgendaFeriados lista os feriados cadastrados — `frontend/src/components/panels/__tests__/AgendaFeriados.test.js` | APROVADO |
| FE-032 | Jest | AgendaFeriados sem feriados, avisa — `frontend/src/components/panels/__tests__/AgendaFeriados.test.js` | APROVADO |
| FE-033 | Jest | AgendaFeriados cadastra um feriado novo e recarrega — `frontend/src/components/panels/__tests__/AgendaFeriados.test.js` | APROVADO |
| FE-034 | Jest | AgendaFeriados perfil que só consulta não vê o formulário nem o excluir — `frontend/src/components/panels/__tests__/AgendaFeriados.test.js` | APROVADO |
| FE-035 | Jest | TarefasQuadro distribui os cartões nas colunas com a contagem — `frontend/src/components/panels/__tests__/TarefasQuadroComponente.test.js` | APROVADO |
| FE-036 | Jest | TarefasQuadro a seta move o cartão na hora e grava na API — `frontend/src/components/panels/__tests__/TarefasQuadroComponente.test.js` | APROVADO |
| FE-037 | Jest | TarefasQuadro se a API recusa, o cartão volta e o erro aparece — `frontend/src/components/panels/__tests__/TarefasQuadroComponente.test.js` | APROVADO |
| FE-038 | Jest | TarefasQuadro sem permissão de editar, não há setas nem arrastar — `frontend/src/components/panels/__tests__/TarefasQuadroComponente.test.js` | APROVADO |
| FE-039 | Jest | TarefasQuadro filtro 'Só as minhas' consulta só as do usuário — `frontend/src/components/panels/__tests__/TarefasQuadroComponente.test.js` | APROVADO |
| FE-040 | Jest | secretaria abre a ficha com resumo nulo e sem blocos não autorizados — `frontend/src/components/panels/__tests__/FichaProcesso.test.jsx` | APROVADO |
| FE-041 | Jest | estagiario vê horas e despesas permitidas sem contrato nem resumo financeiro — `frontend/src/components/panels/__tests__/FichaProcesso.test.jsx` | APROVADO |
| FE-042 | Jest | administrador continua vendo o resumo e o contrato — `frontend/src/components/panels/__tests__/FichaProcesso.test.jsx` | APROVADO |
| FE-043 | Jest | IntimacoesLista mostra só as não lidas por padrão, com o prazo estimado sinalizado — `frontend/src/components/panels/__tests__/IntimacoesListaComponente.test.js` | APROVADO |
| FE-044 | Jest | IntimacoesLista texto longo abre com 'Ler tudo' — `frontend/src/components/panels/__tests__/IntimacoesListaComponente.test.js` | APROVADO |
| FE-045 | Jest | IntimacoesLista buscar no DJEN avisa o resultado e marcar como lida grava — `frontend/src/components/panels/__tests__/IntimacoesListaComponente.test.js` | APROVADO |
| FE-046 | Jest | IntimacoesLista quem só consulta não busca nem marca como lida — `frontend/src/components/panels/__tests__/IntimacoesListaComponente.test.js` | APROVADO |
| FE-047 | Jest | precoDoPlano o plano sem preço aparece como grátis — `frontend/src/components/planos/__tests__/Planos.test.js` | APROVADO |
| FE-048 | Jest | CartoesDePlanos na página inicial destaca o primeiro plano pago e mostra todos — `frontend/src/components/planos/__tests__/Planos.test.js` | APROVADO |
| FE-049 | Jest | PlanosPanel mostra o plano atual e o uso dos limites — `frontend/src/components/planos/__tests__/Planos.test.js` | APROVADO |
| FE-050 | Jest | PlanosPanel os planos acima do atual levam ao contato comercial — `frontend/src/components/planos/__tests__/Planos.test.js` | APROVADO |
| FE-051 | Jest | PlanosPanel sem contato comercial orienta a falar com o administrador — `frontend/src/components/planos/__tests__/Planos.test.js` | APROVADO |
| FE-052 | Jest | PlanosPanel avisa quando o plano pago venceu — `frontend/src/components/planos/__tests__/Planos.test.js` | APROVADO |
| FE-053 | Jest | PlanosPanel plano ilimitado não mostra barra — `frontend/src/components/planos/__tests__/Planos.test.js` | APROVADO |
| FE-054 | Jest | situacaoDoDia feriado nacional dentro do recesso — `frontend/src/components/dashboard/__tests__/MiniCalendar.test.js` | APROVADO |
| FE-055 | Jest | situacaoDoDia feriado local e dia comum — `frontend/src/components/dashboard/__tests__/MiniCalendar.test.js` | APROVADO |
| FE-056 | Jest | situacaoDoDia sem dados da API não marca nada — `frontend/src/components/dashboard/__tests__/MiniCalendar.test.js` | APROVADO |
| FE-057 | Jest | MiniCalendar marca o feriado e mostra o nome ao clicar no dia — `frontend/src/components/dashboard/__tests__/MiniCalendar.test.js` | APROVADO |
| FE-058 | Jest | AppSidebar fora da dashboard pré-carrega a dashboard e navega antes de abrir um painel — `frontend/src/components/shell/__tests__/AppSidebar.test.jsx` | APROVADO |
| FE-059 | Jest | AppSidebar fora da dashboard na dashboard abre o painel sem navegar — `frontend/src/components/shell/__tests__/AppSidebar.test.jsx` | APROVADO |
| FE-060 | Jest | RotulosAutomaticos — tabelas copia o cabeçalho de cada coluna para o data-label da célula — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-061 | Jest | RotulosAutomaticos — tabelas linha que ocupa a tabela inteira (vazio, carregando) fica sem rótulo — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-062 | Jest | RotulosAutomaticos — tabelas rotula também as linhas que aparecem depois — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-063 | Jest | RotulosAutomaticos — formulários liga o label ao campo do mesmo bloco — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-064 | Jest | RotulosAutomaticos — formulários respeita o id que o campo já tem — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-065 | Jest | RotulosAutomaticos — formulários não mexe em label que já envolve o campo — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-066 | Jest | RotulosAutomaticos — formulários mostra e associa a orientação de campos complexos — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-067 | Jest | RotulosAutomaticos — formulários identifica visualmente campos obrigatórios sem duplicar o marcador — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-068 | Jest | RotulosAutomaticos — formulários explica o erro junto ao campo e move o foco para ele — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-069 | Jest | RotulosAutomaticos — formulários remove a mensagem quando o valor fica válido — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-070 | Jest | RotulosAutomaticos — formulários preserva o erro retornado pela API até o formulário limpar o estado — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-071 | Jest | RotulosAutomaticos — formulários associa automaticamente erros da API ao campo com o mesmo name — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-072 | Jest | RotulosAutomaticos — formulários permite voltar uma etapa que preserva os dados sem pedir descarte — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-073 | Jest | RotulosAutomaticos — formulários avisa antes de cancelar um formulário com alterações — `frontend/src/components/shell/__tests__/RotulosAutomaticos.test.js` | APROVADO |
| FE-074 | Jest | ResumoParaCliente mostra o texto, diz de onde veio e envia a versão editada — `frontend/src/components/panels/__tests__/ResumoParaClienteComponente.test.js` | APROVADO |
| FE-075 | Jest | ResumoParaCliente sem telefone, não oferece WhatsApp e explica — `frontend/src/components/panels/__tests__/ResumoParaClienteComponente.test.js` | APROVADO |
| FE-076 | Jest | ResumoParaCliente gerar de novo pede outro texto à API — `frontend/src/components/panels/__tests__/ResumoParaClienteComponente.test.js` | APROVADO |
| FE-077 | Jest | permite iniciar um novo cadastro mesmo após abrir a edição — `frontend/src/components/panels/__tests__/AdvogadosPanel.test.jsx` | APROVADO |
| FE-078 | Jest | administrador pode desativar e excluir outro usuário, mas não a própria conta — `frontend/src/components/panels/__tests__/EquipeSection.test.jsx` | APROVADO |
| FE-079 | Jest | cancelar a confirmação não exclui o usuário — `frontend/src/components/panels/__tests__/EquipeSection.test.jsx` | APROVADO |
| FE-080 | Jest | NotificationBell expõe quantidade, gravidade e detalhes dos alertas — `frontend/src/components/shell/__tests__/NotificationBell.test.jsx` | APROVADO |
| FE-081 | Jest | NotificationBell fecha com Escape e devolve o foco ao sino — `frontend/src/components/shell/__tests__/NotificationBell.test.jsx` | APROVADO |
| FE-082 | Jest | NotificationBell abre a agenda completa pelo rodapé — `frontend/src/components/shell/__tests__/NotificationBell.test.jsx` | APROVADO |
| FE-083 | Jest | ConfirmacaoContext resolve true ao confirmar e fecha a janela — `frontend/src/contexts/__tests__/ConfirmacaoContext.test.js` | APROVADO |
| FE-084 | Jest | ConfirmacaoContext Esc e Cancelar resolvem false — `frontend/src/contexts/__tests__/ConfirmacaoContext.test.js` | APROVADO |
| FE-085 | Jest | ConfirmacaoContext em ação destrutiva o foco começa no Cancelar — `frontend/src/contexts/__tests__/ConfirmacaoContext.test.js` | APROVADO |
| FE-086 | Jest | Janela é um diálogo com título e recebe o foco ao abrir — `frontend/src/components/ui/__tests__/Janela.test.js` | APROVADO |
| FE-087 | Jest | Janela fecha no Esc, no X e no fundo — `frontend/src/components/ui/__tests__/Janela.test.js` | APROVADO |
| FE-088 | Jest | Janela devolve o foco a quem abriu — `frontend/src/components/ui/__tests__/Janela.test.js` | APROVADO |
| FE-089 | Jest | resolverApiUrl usa o proxy de mesma origem nos domínios da Vercel — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-090 | Jest | resolverApiUrl preserva a API configurada fora da Vercel — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-091 | Jest | erros de validação da API normaliza mensagens por campo e ignora erros gerais — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-092 | Jest | erros de validação da API mantém mensagem, status e campos no erro lançado — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-093 | Jest | normalizarLista retorna a própria lista quando os dados já são um array — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-094 | Jest | normalizarLista extrai 'results' de uma resposta paginada — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-095 | Jest | normalizarLista retorna lista vazia para dados inválidos — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-096 | Jest | getUsuarioLogado retorna null em ambiente sem 'window' (SSR) — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-097 | Jest | buildQuery retorna string vazia sem parâmetros — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-098 | Jest | buildQuery monta a query string a partir dos parâmetros informados — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-099 | Jest | buildQuery ignora valores undefined, null ou vazios — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-100 | Jest | redefinição de senha solicitarRedefinicaoSenha faz POST para o endpoint correto — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-101 | Jest | redefinição de senha redefinirSenha faz POST com token e senhas para o endpoint correto — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-102 | Jest | auditoria getAuditoria consulta o endpoint de auditoria do escritório — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-103 | Jest | auditoria getMasterAuditoria consulta o endpoint de auditoria da plataforma — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-104 | Jest | renovação automática do access token expirado ao receber 401, renova o access token e repete a requisição original — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-105 | Jest | renovação automática do access token expirado se a renovação falhar, propaga o erro original em vez de travar — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-106 | Jest | renovação automática do access token expirado guarda o refresh novo quando o backend faz a rotação — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-107 | Jest | renovação automática do access token expirado várias chamadas com 401 ao mesmo tempo compartilham uma única renovação — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-108 | Jest | renovação automática do access token expirado se outra aba já rotacionou o refresh, tenta de novo com o refresh atual — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-109 | Jest | revogação do refresh token no logout logout envia o refresh token pra revogação e limpa o localStorage — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-110 | Jest | revogação do refresh token no logout logout sem refresh token guardado não chama a API — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-111 | Jest | revogação do refresh token no logout masterLogout envia o master_refresh pra revogação e limpa o localStorage — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-112 | Jest | calcularPrazo consulta o endpoint de cálculo de prazo com os parâmetros corretos — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-113 | Jest | calcularPrazo assume dias_uteis=true quando não informado — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-114 | Jest | apontamento de horas e despesas getApontamentos monta a query só com os filtros preenchidos — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-115 | Jest | apontamento de horas e despesas getApontamentos sem filtros não acrescenta '?' — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-116 | Jest | apontamento de horas e despesas createApontamento envia o corpo em JSON — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-117 | Jest | apontamento de horas e despesas getDespesas repassa os filtros booleanos — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-118 | Jest | tempo de uso do sistema registrarAtividade faz POST no endpoint de atividade — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-119 | Jest | tempo de uso do sistema getTempoDeUso repassa o mês quando informado — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-120 | Jest | tempo de uso do sistema getTempoDeUso sem mês consulta o padrão do servidor — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-121 | Jest | modelos de documento getVariaveisDocumento consulta o catálogo de variáveis — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-122 | Jest | modelos de documento gerarDocumento envia o processo e deixa o cliente nulo — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-123 | Jest | modelos de documento gerarDocumento envia o cliente e deixa o processo nulo — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-124 | Jest | modelos de documento createModeloDocumento envia o conteúdo em JSON — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-125 | Jest | consulta ao DataJud consultarDataJud faz POST no endpoint do processo — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-126 | Jest | ficha do processo getFichaProcesso consulta o endpoint de ficha do processo — `frontend/src/services/__tests__/api.test.js` | APROVADO |
| FE-127 | Jest | Avatar busca foto protegida com a API e libera o blob ao desmontar — `frontend/src/components/ui/__tests__/Avatar.test.jsx` | APROVADO |
| FE-128 | Jest | Avatar mostra inicial enquanto não há foto — `frontend/src/components/ui/__tests__/Avatar.test.jsx` | APROVADO |
| FE-129 | Jest | consulta inicial atrasada não reverte uma preferência escolhida pelo usuário — `frontend/src/contexts/__tests__/PreferencesContext.test.jsx` | APROVADO |
| FE-130 | Jest | usePermissoes segue a matriz gravada no login — `frontend/src/hooks/__tests__/usePermissoes.test.js` | APROVADO |
| FE-131 | Jest | usePermissoes sem permissões gravadas deixa a decisão para a API — `frontend/src/hooks/__tests__/usePermissoes.test.js` | APROVADO |
| FE-132 | Jest | usePermissoes acompanha a troca de perfil sem recarregar a página — `frontend/src/hooks/__tests__/usePermissoes.test.js` | APROVADO |
| FE-133 | Jest | código de demonstração nunca vira mensagem de cobrança — `frontend/src/components/panels/__tests__/PixDaParcela.test.js` | APROVADO |
| FE-134 | Jest | mensagem do WhatsApp leva valor, vencimento e o copia e cola — `frontend/src/components/panels/__tests__/PixDaParcela.test.js` | APROVADO |
| FE-135 | Jest | inativo não altera a rolagem de outra janela — `frontend/src/hooks/__tests__/useBloqueioRolagem.test.js` | APROVADO |
| FE-136 | Jest | bloqueia html e body e restaura os eixos e prioridades anteriores — `frontend/src/hooks/__tests__/useBloqueioRolagem.test.js` | APROVADO |
| FE-137 | Jest | fechar uma de duas janelas não libera o documento — `frontend/src/hooks/__tests__/useBloqueioRolagem.test.js` | APROVADO |
| FE-138 | Jest | ativa e desativa conforme o estado da janela — `frontend/src/hooks/__tests__/useBloqueioRolagem.test.js` | APROVADO |
| FE-139 | Jest | não deixa bloqueios pendurados no StrictMode — `frontend/src/hooks/__tests__/useBloqueioRolagem.test.js` | APROVADO |
| FE-140 | Jest | explica de onde veio o texto, no singular e no plural — `frontend/src/components/panels/__tests__/ResumoParaCliente.test.js` | APROVADO |
| FE-141 | Jest | conteúdo da ajuda toda seção tem título, resumo e ao menos um tópico — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-142 | Jest | conteúdo da ajuda os identificadores não se repetem — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-143 | Jest | conteúdo da ajuda todo painel citado existe de verdade — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-144 | Jest | conteúdo da ajuda os painéis da barra lateral com conteúdo próprio estão cobertos — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-145 | Jest | secaoDoPainel encontra a seção do painel aberto — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-146 | Jest | secaoDoPainel sem painel aberto, não força nenhuma seção — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-147 | Jest | secaoDaAjuda aceita tanto o id da seção quanto o nome do painel — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-148 | Jest | secaoDaAjuda usa a visão geral quando o assunto não existe — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-149 | Jest | buscarNaAjuda busca vazia devolve tudo — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-150 | Jest | buscarNaAjuda acha pelo texto de um tópico, não só pelo título — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-151 | Jest | buscarNaAjuda devolve só os tópicos que casam, para a leitura ir direto ao ponto — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-152 | Jest | buscarNaAjuda quando o termo casa com o título da seção, mantém todos os tópicos — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-153 | Jest | buscarNaAjuda ignora maiúsculas e minúsculas — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-154 | Jest | buscarNaAjuda termo sem correspondência devolve lista vazia — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-155 | Jest | buscarNaAjuda não altera o conteúdo original — `frontend/src/lib/__tests__/ajuda.test.js` | APROVADO |
| FE-156 | Jest | mostra o progresso e identifica os itens concluídos — `frontend/src/components/ui/__tests__/ProgressoFormulario.test.jsx` | APROVADO |
| FE-157 | Jest | gerarHtmlRelatorioCliente mostra contratos, horas e despesas do cliente — `frontend/src/utils/__tests__/relatorio.test.js` | APROVADO |
| FE-158 | Jest | gerarHtmlRelatorioCliente formata os totais em reais — `frontend/src/utils/__tests__/relatorio.test.js` | APROVADO |
| FE-159 | Jest | gerarHtmlRelatorioCliente não desloca datas sem hora para o dia anterior — `frontend/src/utils/__tests__/relatorio.test.js` | APROVADO |
| FE-160 | Jest | gerarHtmlRelatorioCliente marca hora de cortesia em vez de mostrar valor — `frontend/src/utils/__tests__/relatorio.test.js` | APROVADO |
| FE-161 | Jest | gerarHtmlRelatorioCliente avisa quando não há nada lançado — `frontend/src/utils/__tests__/relatorio.test.js` | APROVADO |
| FE-162 | Jest | gerarHtmlRelatorioCliente escapa conteúdo vindo do usuário — `frontend/src/utils/__tests__/relatorio.test.js` | APROVADO |
| FE-163 | Jest | gerarHtmlRelatorioProcesso mostra o bloco financeiro do processo — `frontend/src/utils/__tests__/relatorio.test.js` | APROVADO |
| FE-164 | Jest | gerarHtmlRelatorioProcesso omite a coluna de processo, que repetiria o mesmo número — `frontend/src/utils/__tests__/relatorio.test.js` | APROVADO |
| FE-165 | Jest | gerarHtmlRelatorioProcesso mantém a coluna de processo no relatório do cliente — `frontend/src/utils/__tests__/relatorio.test.js` | APROVADO |
| FE-166 | Jest | cobertura dos grupos cobre as oito áreas com conteúdo pesquisável — `frontend/src/lib/__tests__/busca.test.js` | APROVADO |
| FE-167 | Jest | cobertura dos grupos todo grupo aponta para um painel que existe — `frontend/src/lib/__tests__/busca.test.js` | APROVADO |
| FE-168 | Jest | cobertura dos grupos as chaves não se repetem — `frontend/src/lib/__tests__/busca.test.js` | APROVADO |
| FE-169 | Jest | agruparResultados o mínimo de letras para buscar é dois — `frontend/src/lib/__tests__/busca.test.js` | APROVADO |
| FE-170 | Jest | agruparResultados mantém a ordem das áreas definida em GRUPOS_BUSCA — `frontend/src/lib/__tests__/busca.test.js` | APROVADO |
| FE-171 | Jest | agruparResultados área sem resultado não aparece na lista — `frontend/src/lib/__tests__/busca.test.js` | APROVADO |
| FE-172 | Jest | agruparResultados resposta vazia ou ausente não quebra — `frontend/src/lib/__tests__/busca.test.js` | APROVADO |
| FE-173 | Jest | agruparResultados limita a quatro resultados por grupo — `frontend/src/lib/__tests__/busca.test.js` | APROVADO |
| FE-174 | Jest | agruparResultados o título e o detalhe de cada resultado saem do próprio grupo — `frontend/src/lib/__tests__/busca.test.js` | APROVADO |
| FE-175 | Jest | agruparResultados cliente pessoa jurídica mostra o CNPJ como detalhe — `frontend/src/lib/__tests__/busca.test.js` | APROVADO |
| FE-176 | Jest | contarResultados soma os itens de todos os grupos — `frontend/src/lib/__tests__/busca.test.js` | APROVADO |
| FE-177 | Jest | agruparPorColuna separa por situação e deixa cancelada fora do quadro — `frontend/src/components/panels/__tests__/TarefasQuadro.test.js` | APROVADO |
| FE-178 | Jest | agruparPorColuna o cartão muda de coluna antes da API responder — `frontend/src/components/panels/__tests__/TarefasQuadro.test.js` | APROVADO |
| FE-179 | Jest | descreverPrazo mostra dias, tipo e vencimento — `frontend/src/components/panels/__tests__/IntimacoesLista.test.js` | APROVADO |
| FE-180 | Jest | descreverPrazo avisa quando o prazo foi estimado — `frontend/src/components/panels/__tests__/IntimacoesLista.test.js` | APROVADO |
| FE-181 | Jest | descreverPrazo sem prazo, nada — `frontend/src/components/panels/__tests__/IntimacoesLista.test.js` | APROVADO |
| FE-182 | Jest | status do processo cobre os quatro status do modelo — `frontend/src/lib/__tests__/statusProcesso.test.js` | APROVADO |
| FE-183 | Jest | status do processo acentua Concluído, que no banco é gravado sem acento — `frontend/src/lib/__tests__/statusProcesso.test.js` | APROVADO |
| FE-184 | Jest | status do processo cada status tem um selo próprio — nenhum par se confunde — `frontend/src/lib/__tests__/statusProcesso.test.js` | APROVADO |
| FE-185 | Jest | status do processo a cor vem da identidade do status, não da posição na lista — `frontend/src/lib/__tests__/statusProcesso.test.js` | APROVADO |
| FE-186 | Jest | status do processo cada tema tem sua própria cor, validada contra o fundo dele — `frontend/src/lib/__tests__/statusProcesso.test.js` | APROVADO |
| FE-187 | Jest | status do processo status desconhecido não quebra nem rouba a cor de outro — `frontend/src/lib/__tests__/statusProcesso.test.js` | APROVADO |
| FE-188 | Jest | status do processo a ordem mantém verde e ameixa longe do âmbar — `frontend/src/lib/__tests__/statusProcesso.test.js` | APROVADO |
| FE-189 | Jest | limparTelefone remove tudo que não é dígito — `frontend/src/utils/__tests__/whatsapp.test.js` | APROVADO |
| FE-190 | Jest | limparTelefone retorna string vazia para valores nulos/indefinidos — `frontend/src/utils/__tests__/whatsapp.test.js` | APROVADO |
| FE-191 | Jest | construirLinkWhatsApp adiciona o prefixo 55 para números com DDD (11 dígitos) — `frontend/src/utils/__tests__/whatsapp.test.js` | APROVADO |
| FE-192 | Jest | construirLinkWhatsApp não duplica o código do país quando o número já é longo — `frontend/src/utils/__tests__/whatsapp.test.js` | APROVADO |
| FE-193 | Jest | construirLinkWhatsApp retorna null quando o telefone está vazio — `frontend/src/utils/__tests__/whatsapp.test.js` | APROVADO |
| FE-194 | Jest | montarMensagemCliente monta a mensagem com os dados do cliente — `frontend/src/utils/__tests__/whatsapp.test.js` | APROVADO |
| FE-195 | Jest | montarMensagemCliente usa travessão para campos ausentes e trata cliente inativo — `frontend/src/utils/__tests__/whatsapp.test.js` | APROVADO |
| FE-196 | Jest | montarMensagemCliente mostra CNPJ em vez de CPF para cliente pessoa jurídica — `frontend/src/utils/__tests__/whatsapp.test.js` | APROVADO |
| FE-197 | Jest | montarMensagemProcesso traduz o status 'Concluido' para 'Concluído' — `frontend/src/utils/__tests__/whatsapp.test.js` | APROVADO |
| FE-198 | Jest | montarMensagemProcesso omite advogado responsável quando não informado — `frontend/src/utils/__tests__/whatsapp.test.js` | APROVADO |
| FE-199 | Jest | REQUISITOS_SENHA tem os 4 requisitos esperados — `frontend/src/utils/__tests__/senha.test.js` | APROVADO |
| FE-200 | Jest | senhaAtendeRequisitos rejeita senha vazia — `frontend/src/utils/__tests__/senha.test.js` | APROVADO |
| FE-201 | Jest | senhaAtendeRequisitos rejeita senha sem maiúscula — `frontend/src/utils/__tests__/senha.test.js` | APROVADO |
| FE-202 | Jest | senhaAtendeRequisitos rejeita senha sem número — `frontend/src/utils/__tests__/senha.test.js` | APROVADO |
| FE-203 | Jest | senhaAtendeRequisitos rejeita senha sem caractere especial — `frontend/src/utils/__tests__/senha.test.js` | APROVADO |
| FE-204 | Jest | senhaAtendeRequisitos rejeita senha com menos de 8 caracteres — `frontend/src/utils/__tests__/senha.test.js` | APROVADO |
| FE-205 | Jest | senhaAtendeRequisitos aceita senha que atende todos os requisitos — `frontend/src/utils/__tests__/senha.test.js` | APROVADO |
| FE-206 | Jest | formatarCPF organiza os dígitos em ###.###.###-## — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-207 | Jest | formatarCPF ignora caracteres não numéricos e limita a 11 dígitos — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-208 | Jest | formatarCPF formata progressivamente enquanto o usuário digita — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-209 | Jest | formatarCNPJ preserva letras em maiúsculas e permite digitação parcial — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-210 | Jest | formatarCNPJ organiza os dígitos em ##.###.###/####-## — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-211 | Jest | formatarCNPJ limita a 14 dígitos — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-212 | Jest | formatarTelefone formata celular (11 dígitos) com hífen após o 5º dígito — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-213 | Jest | formatarTelefone formata fixo (10 dígitos) com hífen após o 4º dígito — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-214 | Jest | formatarTelefone limita a 11 dígitos — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-215 | Jest | formatarRG organiza os dígitos em XX.XXX.XXX — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-216 | Jest | formatarRG aceita X maiúsculo ou minúsculo como dígito verificador final — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-217 | Jest | formatarRG limita a 8 dígitos além do dígito verificador — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-218 | Jest | formatarOAB organiza número e UF no formato número/UF — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-219 | Jest | formatarOAB mantém só os números enquanto a UF não é digitada — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-220 | Jest | formatarOAB limita o número a 6 dígitos e a UF a 2 letras — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-221 | Jest | formatarCEP organiza os dígitos em #####-### — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-222 | Jest | formatarCEP ignora caracteres não numéricos e limita a 8 dígitos — `frontend/src/utils/__tests__/mascaras.test.js` | APROVADO |
| FE-223 | Jest | service worker registra os ciclos de vida e os eventos de notificação — `frontend/src/lib/__tests__/service-worker.test.js` | APROVADO |
| FE-224 | Jest | service worker nunca intercepta chamadas de API — `frontend/src/lib/__tests__/service-worker.test.js` | APROVADO |
| FE-225 | Jest | service worker nem mesmo uma navegação para /api/ é servida do cache — `frontend/src/lib/__tests__/service-worker.test.js` | APROVADO |
| FE-226 | Jest | service worker deixa passar requisição para outra origem — `frontend/src/lib/__tests__/service-worker.test.js` | APROVADO |
| FE-227 | Jest | service worker ignora tudo que não seja GET — `frontend/src/lib/__tests__/service-worker.test.js` | APROVADO |
| FE-228 | Jest | service worker assume os estáticos versionados do build — `frontend/src/lib/__tests__/service-worker.test.js` | APROVADO |
| FE-229 | Jest | service worker assume a navegação para poder mostrar a tela de offline — `frontend/src/lib/__tests__/service-worker.test.js` | APROVADO |
| FE-230 | Jest | service worker mostra a notificação push com título, texto e destino — `frontend/src/lib/__tests__/service-worker.test.js` | APROVADO |
| FE-231 | Jest | service worker clique na notificação abre o sistema quando não há aba aberta — `frontend/src/lib/__tests__/service-worker.test.js` | APROVADO |
| FE-232 | Jest | formatarMoeda formata número e texto no padrão brasileiro — `frontend/src/utils/__tests__/formato.test.js` | APROVADO |
| FE-233 | Jest | formatarMoeda zero é um valor, não uma ausência — `frontend/src/utils/__tests__/formato.test.js` | APROVADO |
| FE-234 | Jest | formatarMoeda devolve travessão quando não há valor — `frontend/src/utils/__tests__/formato.test.js` | APROVADO |
| FE-235 | Jest | formatarHoras converte minutos em horas e minutos — `frontend/src/utils/__tests__/formato.test.js` | APROVADO |
| FE-236 | Jest | formatarHoras trata ausência de valor como zero — `frontend/src/utils/__tests__/formato.test.js` | APROVADO |
| FE-237 | Jest | data de formulário usa o dia local na virada UTC — `frontend/src/utils/__tests__/formato.test.js` | APROVADO |
| FE-238 | Jest | capitalizarNome deixa os nomes legíveis e mantém as siglas societárias — `frontend/src/utils/__tests__/cnpj.test.js` | APROVADO |
| FE-239 | Jest | interpretarEmpresa converte a resposta do BrasilAPI para os campos do formulário — `frontend/src/utils/__tests__/cnpj.test.js` | APROVADO |
| FE-240 | Jest | interpretarEmpresa não repete o tipo quando o logradouro já começa com ele, e trata s/n — `frontend/src/utils/__tests__/cnpj.test.js` | APROVADO |
| FE-241 | Jest | interpretarEmpresa campos ausentes viram texto vazio; sem razão social não há empresa — `frontend/src/utils/__tests__/cnpj.test.js` | APROVADO |
| FE-242 | Jest | buscarEmpresaPorCnpj consulta CNPJ alfanumérico sem apagar letras — `frontend/src/utils/__tests__/cnpj.test.js` | APROVADO |
| FE-243 | Jest | buscarEmpresaPorCnpj não chama a API com CNPJ incompleto — `frontend/src/utils/__tests__/cnpj.test.js` | APROVADO |
| FE-244 | Jest | buscarEmpresaPorCnpj consulta o BrasilAPI só com os dígitos — `frontend/src/utils/__tests__/cnpj.test.js` | APROVADO |
| FE-245 | Jest | buscarEmpresaPorCnpj CNPJ não encontrado, erro de rede ou resposta inválida devolvem null sem quebrar — `frontend/src/utils/__tests__/cnpj.test.js` | APROVADO |
| FE-246 | Jest | enderecoDaEmpresa e avisoDaEmpresa monta a linha de endereço — `frontend/src/utils/__tests__/cnpj.test.js` | APROVADO |
| FE-247 | Jest | enderecoDaEmpresa e avisoDaEmpresa avisa quando não encontrou e quando a situação não é ativa, sem impedir nada — `frontend/src/utils/__tests__/cnpj.test.js` | APROVADO |
| FE-248 | Jest | converte a chave pública VAPID (base64url) para bytes — `frontend/src/utils/__tests__/push.test.js` | APROVADO |
| FE-249 | Jest | buscarEnderecoPorCep retorna null sem chamar a API quando o CEP não tem 8 dígitos — `frontend/src/utils/__tests__/cep.test.js` | APROVADO |
| FE-250 | Jest | buscarEnderecoPorCep retorna o endereço formatado a partir da resposta da API — `frontend/src/utils/__tests__/cep.test.js` | APROVADO |
| FE-251 | Jest | buscarEnderecoPorCep retorna null quando a API informa CEP inexistente — `frontend/src/utils/__tests__/cep.test.js` | APROVADO |
| FE-252 | Jest | buscarEnderecoPorCep retorna null quando a requisição falha — `frontend/src/utils/__tests__/cep.test.js` | APROVADO |
| FE-253 | Jest | montarEnderecoCompleto junta logradouro e bairro separados por vírgula — `frontend/src/utils/__tests__/cep.test.js` | APROVADO |
| FE-254 | Jest | montarEnderecoCompleto omite partes vazias — `frontend/src/utils/__tests__/cep.test.js` | APROVADO |
| FE-255 | Jest | getSaudacao às 6 horas retorna 'Bom dia' — `frontend/src/utils/__tests__/greeting.test.js` | APROVADO |
| FE-256 | Jest | getSaudacao às 11 horas retorna 'Bom dia' — `frontend/src/utils/__tests__/greeting.test.js` | APROVADO |
| FE-257 | Jest | getSaudacao às 12 horas retorna 'Boa tarde' — `frontend/src/utils/__tests__/greeting.test.js` | APROVADO |
| FE-258 | Jest | getSaudacao às 17 horas retorna 'Boa tarde' — `frontend/src/utils/__tests__/greeting.test.js` | APROVADO |
| FE-259 | Jest | getSaudacao às 18 horas retorna 'Boa noite' — `frontend/src/utils/__tests__/greeting.test.js` | APROVADO |
| FE-260 | Jest | getSaudacao às 23 horas retorna 'Boa noite' — `frontend/src/utils/__tests__/greeting.test.js` | APROVADO |
| FE-261 | Jest | getSaudacao às 3 horas retorna 'Boa noite' — `frontend/src/utils/__tests__/greeting.test.js` | APROVADO |
| FE-262 | Jest | getSaudacaoCompleta usa apenas o primeiro nome — `frontend/src/utils/__tests__/greeting.test.js` | APROVADO |
| FE-263 | Jest | getSaudacaoCompleta retorna só a saudação quando não há nome — `frontend/src/utils/__tests__/greeting.test.js` | APROVADO |
| FE-264 | Jest | onboarding calcula o progresso a partir dos dados reais do escritório — `frontend/src/lib/__tests__/onboarding.test.js` | APROVADO |
| FE-265 | Jest | onboarding orienta a cadastrar cliente antes do processo — `frontend/src/lib/__tests__/onboarding.test.js` | APROVADO |
| FE-266 | Jest | onboarding não oferece etapas que o perfil não pode criar — `frontend/src/lib/__tests__/onboarding.test.js` | APROVADO |
| FE-267 | Jest | onboarding identifica um escritório sem dados operacionais — `frontend/src/lib/__tests__/onboarding.test.js` | APROVADO |
| FE-268 | Jest | alertas da agenda explica hoje, amanhã e vencimento sem depender de cor — `frontend/src/lib/__tests__/alertasAgenda.test.js` | APROVADO |
| FE-269 | Jest | alertas da agenda prioriza prazo fatal vencido e remove o que foi cumprido — `frontend/src/lib/__tests__/alertasAgenda.test.js` | APROVADO |
| FE-270 | Jest | alertas da agenda pode limitar a lista a prazos dentro da janela escolhida — `frontend/src/lib/__tests__/alertasAgenda.test.js` | APROVADO |
| FE-271 | Jest | IDIOMAS_SUPORTADOS inclui português, inglês e espanhol — `frontend/src/lib/__tests__/i18n.test.js` | APROVADO |
| FE-272 | Jest | traduzir retorna a tradução correta para cada idioma suportado — `frontend/src/lib/__tests__/i18n.test.js` | APROVADO |
| FE-273 | Jest | traduzir recai para pt-BR quando o idioma não é suportado — `frontend/src/lib/__tests__/i18n.test.js` | APROVADO |
| FE-274 | Jest | traduzir recai para a própria chave quando ela não existe em nenhum dicionário — `frontend/src/lib/__tests__/i18n.test.js` | APROVADO |
| FE-275 | Jest | traduzir a aba de auditoria está traduzida em todos os idiomas suportados — `frontend/src/lib/__tests__/i18n.test.js` | APROVADO |
| E2E-001 | Playwright | baixa a agenda em .ics com o prazo fatal — `frontend/e2e/agenda.spec.js` | APROVADO |
| E2E-002 | Playwright | sem sessão, dashboard redireciona para login — `frontend/e2e/auditoria.spec.js` | APROVADO |
| E2E-003 | Playwright | logout encerra a navegação autenticada — `frontend/e2e/auditoria.spec.js` | APROVADO |
| E2E-004 | Playwright | ficha respeita o acesso financeiro de estagiario — `frontend/e2e/auditoria.spec.js` | APROVADO |
| E2E-005 | Playwright | ficha respeita o acesso financeiro de secretaria — `frontend/e2e/auditoria.spec.js` | APROVADO |
| E2E-006 | Playwright | falha simulada de clientes aparece e recupera ao reabrir — `frontend/e2e/auditoria.spec.js` | APROVADO |
| E2E-007 | Playwright | rascunho atrasado preserva a digitação de um evento novo — `frontend/e2e/auditoria.spec.js` | APROVADO |
| E2E-008 | Playwright | horas e despesas iniciam com o dia de São Paulo na virada UTC — `frontend/e2e/auditoria.spec.js` | APROVADO |
| E2E-009 | Playwright | sem JavaScript, senha de login não é enviada na URL — `frontend/e2e/auditoria.spec.js` | APROVADO |
| E2E-010 | Playwright | cadastra um cliente e encontra na busca — `frontend/e2e/clientes.spec.js` | APROVADO |
| E2E-011 | Playwright | cadastro avança por etapas, conserva os dados e aceita CNPJ com letras — `frontend/e2e/evolucao.spec.js` | APROVADO |
| E2E-012 | Playwright | busca abre diretamente o cliente escolhido — `frontend/e2e/evolucao.spec.js` | APROVADO |
| E2E-013 | Playwright | menu recolhido e densidade sobrevivem ao recarregamento sem cortar controles — `frontend/e2e/evolucao.spec.js` | APROVADO |
| E2E-014 | Playwright | advogado confere uma intimação e a revisão fica identificada — `frontend/e2e/evolucao.spec.js` | APROVADO |
| E2E-015 | Playwright | gera o PIX copia e cola de uma parcela pendente — `frontend/e2e/financeiro.spec.js` | APROVADO |
| E2E-016 | Playwright | Pix de teste confirma honorários sem dar baixa na parcela — `frontend/e2e/financeiro.spec.js` | APROVADO |
| E2E-017 | Playwright | Pix de teste dos planos confirma sem ativar assinatura — `frontend/e2e/financeiro.spec.js` | APROVADO |
| E2E-018 | Playwright | senha errada mostra o erro e não entra — `frontend/e2e/login.spec.js` | APROVADO |
| E2E-019 | Playwright | entra e chega na dashboard sem violações de acessibilidade — `frontend/e2e/login.spec.js` | APROVADO |
| E2E-020 | Playwright | a tela de login também passa na checagem de acessibilidade — `frontend/e2e/login.spec.js` | APROVADO |
| E2E-021 | Playwright | navega de Compromissos para o Assistente IA sem ficar preso — `frontend/e2e/navegacao.spec.js` | APROVADO |
| E2E-022 | Playwright | estagiário não vê o financeiro nem o processo sigiloso — `frontend/e2e/perfis.spec.js` | APROVADO |
| E2E-023 | Playwright | administrador vê o sigiloso com o selo de segredo de justiça — `frontend/e2e/perfis.spec.js` | APROVADO |
| E2E-024 | Playwright | foto é salva separadamente e continua disponível após recarregar — `frontend/e2e/preferencias.spec.js` | APROVADO |
| E2E-025 | Playwright | modo compacto reduz visivelmente as linhas e mantém a escolha — `frontend/e2e/preferencias.spec.js` | APROVADO |
| E2E-026 | Playwright | orienta o cadastro, mostra o progresso e explica campos obrigatórios — `frontend/e2e/processos.spec.js` | APROVADO |
| E2E-027 | Playwright | abre a ficha do processo e gera a atualização para o cliente — `frontend/e2e/processos.spec.js` | APROVADO |
| E2E-028 | Playwright | dashboard cabe em notebook com escala de 125% — `frontend/e2e/responsividade.spec.js` | APROVADO |
| E2E-029 | Playwright | painel bloqueia a dashboard ao fundo e devolve sua posição ao fechar — `frontend/e2e/rolagem.spec.js` | APROVADO |
| E2E-030 | Playwright | só o conteúdo do painel rola e fechar a ajuda não libera a página de trás — `frontend/e2e/rolagem.spec.js` | APROVADO |
| E2E-031 | Playwright | move um cartão no quadro Kanban e volta — `frontend/e2e/tarefas.spec.js` | APROVADO |
| E2E-032 | Playwright | no celular, o menu abre em gaveta e a lista cabe na tela — `frontend/e2e/celular.spec.js` | APROVADO |
| E2E-033 | Playwright | telas principais cabem no celular e mantêm os controles acessíveis — `frontend/e2e/celular.spec.js` | APROVADO |
| E2E-034 | Playwright | gaveta e painel mantêm a dashboard parada no celular — `frontend/e2e/celular.spec.js` | APROVADO |

## Complemento de 28/10/2026 — navegação da dashboard

Os casos E2E-001–034 acima foram reexecutados e passaram. Acrescentaram-se os
casos abaixo em `frontend/e2e/preferencias.spec.js`; ambos passaram após a
correção A13, totalizando 36 cenários na rodada atual. O catálogo JSON da
rodada original continua histórico. Evidência atual:
[regressao-dashboard-2026-10-28.json](evidencias/regressao-dashboard-2026-10-28.json).

| ID | Runner | Cenário | Resultado |
|---|---|---|---|
| E2E-035 | Playwright computador | Compromissos mantém densidade compact e menu expandido durante a navegação | APROVADO |
| E2E-036 | Playwright computador | Compromissos mantém densidade comfortable e menu recolhido durante a navegação | APROVADO |
