# LexOffice — ERP Jurídico

[![CI](https://github.com/guimunhoz13/TCCrepository/actions/workflows/ci.yml/badge.svg)](https://github.com/guimunhoz13/TCCrepository/actions/workflows/ci.yml)

Sistema de gestão para escritórios de advocacia (ERP jurídico): cadastro de
clientes, advogados e processos, agenda com prazos e audiências, upload e
organização de documentos, geração de relatórios (com envio por e-mail e
WhatsApp), notícias do mundo jurídico e criminal, e um assistente com IA —
tudo isolado por escritório (multi-tenant).

Projeto acadêmico (TCC) desenvolvido em dupla, para a disciplina de
Tecnologia em Desenvolvimento de Sistemas.

## Stack

- **Backend**: Django 6 + Django REST Framework, autenticação via JWT
  (`djangorestframework_simplejwt`), Postgres (hospedado no
  [Supabase](https://supabase.com), banco compartilhado pela dupla).
- **Frontend**: Next.js 16 (App Router) + React 19, CSS puro (design system
  próprio).

## Estrutura

```
backend/    API Django (advocacia/, api/, core/)
frontend/   Aplicação Next.js (src/app, src/components, src/services)
```

## Rodando localmente

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # preencha com os dados do projeto Supabase (só na 1ª vez)
python manage.py migrate
python manage.py runserver
```

O banco (Postgres) é o mesmo projeto Supabase para toda a dupla — as
credenciais ficam em `backend/.env` (não versionado; veja
`backend/.env.example`). Peça a string de conexão pra quem já tiver
criado o projeto no Supabase, ou crie um novo em
[supabase.com](https://supabase.com) → New Project → região
**"South America (São Paulo)"** (uma região distante adiciona latência
perceptível em toda consulta) → Connect → "Session pooler" (não o
"Transaction pooler" — veja o comentário em `.env.example` sobre
`CONN_MAX_AGE`), e compartilhe os dados com a dupla.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Segurança em produção

- Sem `DEBUG=True` o backend sobe em modo produção: exige `SECRET_KEY`
  (recusa subir sem ela), redireciona para HTTPS, liga HSTS e marca os
  cookies como seguros. No `.env` local mantenha `DEBUG=True`.
- O CI roda `manage.py check --deploy --fail-level WARNING` e falha em
  qualquer aviso de segurança de deploy.
- O frontend envia CSP, `X-Frame-Options`, `Referrer-Policy` e
  `Permissions-Policy` em todas as páginas (`frontend/next.config.mjs`).
- O refresh token é trocado a cada renovação e o anterior é revogado.
- O assistente de IA tem limite próprio (20 chamadas/minuto por usuário) e
  aceita mensagens de até 4000 caracteres.

## Tarefas agendadas

Os lembretes de agenda e o resumo semanal são enviados por um comando que
precisa ser executado uma vez por dia por um agendador externo (não há
Celery no projeto):

```bash
cd backend && python manage.py enviar_lembretes
```

O comando é idempotente — cada aviso fica registrado em `NotificacaoEnviada`,
então rodar duas vezes no mesmo dia não reenvia nada. Opções:

- `--dry-run`: mostra o que seria enviado, sem enviar e sem registrar.
- `--resumo-semanal`: força o resumo fora da segunda-feira (útil para demonstrar).

O que ele envia depende das preferências de cada usuário (Configurações →
Notificações): `lembrete_audiencia` e `antecedencia_audiencia` para
compromissos, `lembrete_prazo` para prazos, e `resumo_semanal` para o
resumo das segundas.

Há também a consulta automática ao DataJud, que percorre os processos
ativos, importa os andamentos novos e avisa quem optou por receber:

```bash
cd backend && python manage.py sincronizar_datajud
```

Ela é um comando separado de propósito: cada processo é uma chamada HTTP a
um serviço externo, então a rotina é lenta e sujeita a falhas que não devem
atrapalhar o envio dos lembretes. Opções: `--dry-run`, `--limite N`
(máximo de processos por execução, padrão 50) e `--intervalo-horas N`
(não reconsulta um processo visto há menos de N horas, padrão 12).
Processos concluídos ou arquivados não são consultados, e a rotina exige
`DATAJUD_API_KEY` configurada.

As intimações publicadas no Diário de Justiça Eletrônico Nacional (DJEN)
são buscadas pela OAB de cada advogado (no formato `123456/SP`). Cada uma é
ligada ao processo cadastrado, o prazo é lido do texto (ou estimado em 5
dias úteis, CPC art. 218 § 3º) e lançado na agenda:

```bash
cd backend && python manage.py buscar_intimacoes   # --dias N (padrão 7)
```

Exemplo de agendamento no cron — intimações às 6h, lembretes às 7h,
sincronização às 5h:

```cron
0 6 * * * cd /caminho/para/backend && /caminho/para/python manage.py buscar_intimacoes
0 7 * * * cd /caminho/para/backend && /caminho/para/python manage.py enviar_lembretes
0 5 * * * cd /caminho/para/backend && /caminho/para/python manage.py sincronizar_datajud
```

Sem SMTP configurado (`EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD`), o Django cai
no backend de console e apenas imprime os e-mails — veja `backend/.env.example`.

## Cálculo de prazos e feriados locais

A calculadora da agenda e as intimações do DJEN contam os prazos em dias
úteis. Elas pulam os fins de semana, os feriados nacionais (inclusive os
móveis, calculados a partir da Páscoa) e o recesso forense de 20/12 a 20/01.
Feriados municipais e estaduais e suspensões de expediente variam por comarca
e são cadastrados pelo escritório em **Agenda › Feriados locais**. Um feriado
pode valer só naquela data ou repetir todo ano. O sistema não traz uma lista
pronta, porque quem define o calendário forense é cada tribunal. A calculadora
mostra quais feriados locais mudaram a contagem.

## Planos

Todo escritório novo entra no plano **Gratuito**, sem pagamento nem cartão. Os
planos pagos ampliam os limites e trazem as automações e a IA:

| | Gratuito | Básico (R$ 79/mês) | Profissional (R$ 199/mês) |
|---|---|---|---|
| Usuários ativos | até 3 | até 10 | ilimitados |
| Processos ativos | até 30 | até 300 | ilimitados |
| Clientes, agenda, tarefas, documentos, DataJud (consulta), PIX, 2FA, LGPD | sim | sim | sim |
| Intimações do DJEN e sincronização automática do DataJud | — | sim | sim |
| Assistente de IA e mensagens ao cliente escritas pela IA | — | — | sim |

O catálogo fica em `backend/advocacia/planos.py`, e a API aplica os limites.
Passar do limite só impede criar mais; nada é apagado. Processos concluídos ou
arquivados não contam. Um plano pago com validade vencida vale como Gratuito
até ser renovado. O plano e a validade de cada escritório são definidos pelo
administrador da plataforma no painel mestre (`/master`). A cobrança online
ainda não está ligada a um meio de pagamento: o botão "Quero este plano"
abre um e-mail para `CONTATO_COMERCIAL` (variável de ambiente do backend).

## Dados de demonstração

```bash
cd backend && python manage.py popular_demo   # --recriar para começar do zero
```

Cria o escritório "Silva & Sabino Advocacia (demonstração)" com clientes,
processos (um em segredo de justiça), agenda, tarefas, contrato com parcelas
e chave PIX. Todos entram com a senha `Demo@1234`: `admin@`, `advogada@`,
`estagiario@`, `financeiro@` e `secretaria@demo.lexoffice.app` — um de cada
perfil de acesso.

## Testes de ponta a ponta (E2E)

Com o back-end (porta 8000, `LIMITES_DESLIGADOS=True`) e o front (porta
3000) rodando sobre os dados de `popular_demo`:

```bash
cd frontend && npm run e2e
```

O Playwright usa o sistema como uma pessoa usaria — login, cadastro de
cliente, ficha do processo, perfis de acesso, Kanban, PIX, agenda .ics e
celular — e checa acessibilidade (WCAG AA) com axe. No CI, o job
"E2E (Playwright)" sobe Postgres, API e front sozinho.

## Documentação da API

Com o back-end rodando, a documentação interativa (OpenAPI 3, gerada com
drf-spectacular a partir das próprias views e serializers) fica em:

- `http://localhost:8000/api/docs/` — Swagger UI (clique em **Authorize** e
  cole o `access` devolvido por `POST /api/login/` para testar as rotas);
- `http://localhost:8000/api/redoc/` — ReDoc;
- `http://localhost:8000/api/schema/` — o arquivo OpenAPI.

Para esconder a documentação em produção, defina `API_DOCS_PUBLICAS=False`.

## Testes

```bash
# Backend (Django)
cd backend && python manage.py test

# Frontend (Jest)
cd frontend && npm test
```

## CI

A cada push/PR para `main`, o GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))
roda automaticamente:

- **Backend**: instala as dependências, roda os testes contra um Postgres
  de serviço (efêmero, não é o Supabase do projeto) e valida o projeto
  (`manage.py check`).
- **Frontend**: instala as dependências, roda os testes (Jest) e faz o
  build de produção (`next build`).
