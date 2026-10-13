"""
Django settings for core project.
"""

from datetime import timedelta
from pathlib import Path
import os
import sys

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

# `manage.py test` roda dezenas de casos de teste contra os mesmos endpoints
# sensíveis (login, cadastro) em segundos — bem abaixo da janela de 1 minuto
# do rate limiting. Sem isso, a suíte de testes ficaria instável (passa ou
# falha dependendo da ordem/velocidade de execução) por um motivo que nada
# tem a ver com o comportamento sendo testado.
TESTING = "test" in sys.argv


# DEBUG só liga quando pedido explicitamente (DEBUG=True no .env local, como
# no .env.example). Antes o padrão era ligado: um deploy que esquecesse a
# variável subia com páginas de erro detalhadas e a SECRET_KEY de exemplo.
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

_CHAVE_DE_DESENVOLVIMENTO = 'django-insecure-chave-apenas-para-desenvolvimento-local'
SECRET_KEY = os.environ.get('SECRET_KEY') or ''
if not SECRET_KEY:
    if not (DEBUG or TESTING):
        raise ImproperlyConfigured(
            "Defina SECRET_KEY no ambiente: sem DEBUG=True o sistema não sobe "
            "com uma chave conhecida publicamente."
        )
    SECRET_KEY = _CHAVE_DE_DESENVOLVIMENTO


ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get('ALLOWED_HOSTS', '').split(',')
    if host.strip()
]
if DEBUG and not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# URL do frontend, usada para montar links (ex.: redefinição de senha)
# enviados por e-mail.
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Chave pública da API do DataJud (CNJ), divulgada pelo próprio CNJ.
# Sem ela, a consulta de processo é recusada com uma mensagem explicativa.
DATAJUD_API_KEY = os.getenv("DATAJUD_API_KEY", "")
DATAJUD_URL_BASE = os.getenv("DATAJUD_URL_BASE", "")
# Intimações do Diário de Justiça Eletrônico Nacional (consulta pública, sem
# chave). Configurável para apontar a um servidor de teste.
DJEN_API_URL = os.getenv("DJEN_API_URL", "")

# Notificações push (Web Push/VAPID). Gere o par com
# `python manage.py gerar_chaves_vapid`. Sem as chaves, o push fica
# desligado e o sistema segue só com e-mail.
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_EMAIL = os.getenv("VAPID_EMAIL", "")


# APPLICATIONS

INSTALLED_APPS = [

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',


    # externos
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'drf_spectacular',


    # projeto
    'advocacia',

]


# MIDDLEWARE

MIDDLEWARE = [

    'corsheaders.middleware.CorsMiddleware',

    'django.middleware.security.SecurityMiddleware',

    'django.contrib.sessions.middleware.SessionMiddleware',

    'django.middleware.common.CommonMiddleware',

    'django.middleware.csrf.CsrfViewMiddleware',

    'django.contrib.auth.middleware.AuthenticationMiddleware',

    'django.contrib.messages.middleware.MessageMiddleware',

    'django.middleware.clickjacking.XFrameOptionsMiddleware',

]


ROOT_URLCONF = 'core.urls'


# TEMPLATES

TEMPLATES = [

    {

        'BACKEND': 'django.template.backends.django.DjangoTemplates',

        'DIRS': [],

        'APP_DIRS': True,

        'OPTIONS': {

            'context_processors': [

                'django.template.context_processors.request',

                'django.contrib.auth.context_processors.auth',

                'django.contrib.messages.context_processors.messages',

            ],

        },

    },

]


WSGI_APPLICATION = 'core.wsgi.application'


# DATABASE
#
# Banco compartilhado (Supabase/Postgres) — as credenciais reais vêm de
# variáveis de ambiente (arquivo .env local, não versionado; ou variáveis
# de ambiente reais em CI/produção), nunca ficam fixas no código. Copie
# backend/.env.example para backend/.env e preencha com os dados do
# projeto Supabase (Project Settings → Database).

DATABASES = {

    'default': {

        'ENGINE': 'django.db.backends.postgresql',

        'NAME': os.environ.get('DB_NAME', 'postgres'),

        'USER': os.environ.get('DB_USER', 'postgres'),

        'PASSWORD': os.environ.get('DB_PASSWORD', ''),

        'HOST': os.environ.get('DB_HOST', 'localhost'),

        'PORT': os.environ.get('DB_PORT', '5432'),

        # Sem isso, o Django abre e fecha uma conexão nova (handshake TLS
        # completo) a cada request — em localhost isso é barato, mas contra
        # um Postgres remoto (Supabase) deixa o site perceptivelmente lento.
        # Reaproveita a mesma conexão por até 60s entre requests.
        'CONN_MAX_AGE': int(os.environ.get('DB_CONN_MAX_AGE', '60')),

        'CONN_HEALTH_CHECKS': True,

    }

}


# PASSWORD VALIDATION

AUTH_PASSWORD_VALIDATORS = [

    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },

    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },

    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },

    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },

]


# O PBKDF2 padrão é lento de propósito (centenas de milhares de iterações por
# senha). Nos testes, que criam usuários e fazem login o tempo todo, isso
# levava a suíte a ~8 minutos; MD5 aqui só vale para senhas descartáveis de
# teste e nunca é usado fora de `manage.py test`.
if TESTING:
    PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


# LANGUAGE

LANGUAGE_CODE = 'pt-br'


TIME_ZONE = 'America/Sao_Paulo'


USE_I18N = True


USE_TZ = True



# STATIC

STATIC_URL = 'static/'

# URLs de fotos passam pela API autenticada. Arquivos de documentos ficam
# apenas no MEDIA_ROOT e são obtidos pelas rotas de download com permissão.
MEDIA_URL = '/api/fotos/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# OpenAI — chave exclusivamente no backend (variável de ambiente)
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")


# E-MAIL
# Sem EMAIL_HOST_USER/EMAIL_HOST_PASSWORD configurados (variáveis de
# ambiente), o sistema usa o backend "console": os e-mails são impressos
# no terminal do backend em vez de enviados de verdade — útil em
# desenvolvimento e não quebra nada sem credenciais.
#
# Para enviar e-mails de verdade com uma conta Gmail:
#   1. Ative a verificação em duas etapas na conta Google.
#   2. Gere uma "senha de app" em https://myaccount.google.com/apppasswords
#   3. Defina as variáveis de ambiente:
#      EMAIL_HOST_USER=seuemail@gmail.com
#      EMAIL_HOST_PASSWORD=<senha de app gerada, sem espaços>
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True") == "True"
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER or "no-reply@lexoffice.local")

# E-mail para quem quer contratar um plano pago (aparece no botão da tela de
# planos). Em branco, a tela orienta a falar com o administrador da plataforma.
CONTATO_COMERCIAL = os.environ.get("CONTATO_COMERCIAL", "")

if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"



# CORS

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
    if origin.strip()
]



# DJANGO REST FRAMEWORK

REST_FRAMEWORK = {

    "DEFAULT_AUTHENTICATION_CLASSES": (

        "advocacia.autenticacao.AutenticacaoContaAtiva",

    ),

    "DEFAULT_PERMISSION_CLASSES": (

        "rest_framework.permissions.IsAuthenticated",

    ),

    "DEFAULT_PAGINATION_CLASS": "advocacia.pagination.PaginacaoPadrao",

    # Documentação OpenAPI gerada a partir das próprias views e serializers
    # (ver SPECTACULAR_SETTINGS e /api/docs/).
    "DEFAULT_SCHEMA_CLASS": "advocacia.esquema_api.EsquemaLexOffice",

    # LIMITES_DESLIGADOS=True só para os testes de ponta a ponta (E2E), que
    # entram e saem do sistema dezenas de vezes por minuto.
    "DEFAULT_THROTTLE_CLASSES": () if TESTING or os.environ.get("LIMITES_DESLIGADOS") == "True" else (

        "rest_framework.throttling.AnonRateThrottle",

        "rest_framework.throttling.UserRateThrottle",

        "rest_framework.throttling.ScopedRateThrottle",

    ),

    # "sensivel" cobre endpoints propensos a abuso mesmo sem autenticação
    # (verificação de e-mail, cadastro, redefinição de senha — todos usados
    # por quem ainda não tem uma sessão para ser limitado por "user").
    # "login" é mais permissivo que "sensivel" para não travar um usuário
    # legítimo errando a senha algumas vezes antes do bloqueio de conta.
    "DEFAULT_THROTTLE_RATES": {

        "anon": "100/minute",

        "user": "1000/minute",

        "login": "20/minute",

        "sensivel": "10/minute",

        "ia": "20/minute",

    },

}


# Documentação da API (OpenAPI 3 / Swagger)
#
# /api/docs/ (Swagger UI), /api/redoc/ e /api/schema/ (o arquivo OpenAPI).
# O esquema descreve rotas e campos, nunca dados: para chamar uma rota pela
# própria página é preciso colar um token de acesso em "Authorize". Para
# esconder a documentação em produção, API_DOCS_PUBLICAS=False.
API_DOCS_PUBLICAS = os.environ.get("API_DOCS_PUBLICAS", "True") == "True"

SPECTACULAR_SETTINGS = {
    "TITLE": "LexOffice API",
    "DESCRIPTION": (
        "API do ERP jurídico LexOffice: clientes, processos, agenda, documentos, "
        "contratos e honorários, tarefas, horas e despesas, intimações do DJEN, "
        "PIX, IA e configurações do escritório.\n\n"
        "**Autenticação:** `POST /api/login/` devolve `access` e `refresh` "
        "(ou um desafio de verificação em duas etapas, concluído em "
        "`POST /api/login/2fa/`). Envie `Authorization: Bearer <access>`.\n\n"
        "**Escopo:** toda rota enxerga só o escritório de quem está logado; o "
        "perfil de acesso (administrador, advogado, estagiário, financeiro, "
        "secretária) limita o que cada um pode ver e alterar, e processos em "
        "segredo de justiça só aparecem para o administrador e o advogado "
        "responsável."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    # Versões fixas da interface (CDN), para a página não mudar sozinha.
    "SWAGGER_UI_DIST": "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5",
    "SWAGGER_UI_FAVICON_HREF": "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/favicon-32x32.png",
    "REDOC_DIST": "https://cdn.jsdelivr.net/npm/redoc@2",
    "SWAGGER_UI_SETTINGS": {"persistAuthorization": True, "displayRequestDuration": True},
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": r"/api/",
    "TAGS": [
        {"name": "autenticacao", "description": "Login, verificação em duas etapas, renovação e logout."},
        {"name": "clientes", "description": "Cadastro de clientes e pedidos da LGPD."},
        {"name": "processos", "description": "Processos, ficha completa, DataJud e resumo para o cliente."},
        {"name": "intimacoes", "description": "Intimações do Diário de Justiça Eletrônico Nacional."},
        {"name": "agenda", "description": "Compromissos e prazos, cálculo de prazo e calendário .ics."},
        {"name": "financeiro", "description": "Contratos, parcelas e PIX."},
    ],
}


# JWT
#
# O padrão da biblioteca (5 minutos de access token, sem rotação de refresh)
# é curto demais para o uso real do sistema: o frontend não tinha nenhuma
# lógica de renovação automática, então o access token expirava no meio do
# uso e toda chamada à API passava a falhar com "Given token not valid for
# any token type" até o usuário atualizar a página e logar de novo. Agora o
# frontend renova o access token automaticamente via /api/token/refresh/
# quando recebe 401 (ver services/api.js), mas mesmo assim um access token
# de vida mais longa reduz a frequência dessas renovações.
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}


# PRODUÇÃO (HTTPS)
#
# Só vale fora do DEBUG e fora dos testes: o cliente de testes do Django fala
# HTTP, e o redirecionamento para HTTPS faria toda requisição de teste virar
# um 301.
if not DEBUG and not TESTING:
    # Plataformas como Render/Railway terminam o TLS no proxy e repassam a
    # requisição em HTTP com este cabeçalho; sem ele o Django acharia que
    # toda requisição é insegura e entraria em loop de redirecionamento.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "True") == "True"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", str(60 * 60 * 24 * 30)))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# O preload inscreve o domínio na lista embutida dos navegadores, uma decisão
# difícil de desfazer e que cabe ao dono do domínio, não ao código.
SILENCED_SYSTEM_CHECKS = ["security.W021"]


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simples": {"format": "{asctime} {levelname} {name}: {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "simples"},
    },
    "root": {"handlers": ["console"], "level": "WARNING"},
    "loggers": {
        "advocacia": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}
