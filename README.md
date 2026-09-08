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
  (`djangorestframework_simplejwt`), MySQL.
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
python manage.py migrate
python manage.py runserver
```

Requer um MySQL local rodando (usuário/senha/banco configurados em
`backend/core/settings.py`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

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

- **Backend**: instala as dependências, roda os testes contra um MySQL de
  serviço e valida o projeto (`manage.py check`).
- **Frontend**: instala as dependências, roda os testes (Jest) e faz o
  build de produção (`next build`).
