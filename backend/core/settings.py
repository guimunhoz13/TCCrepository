"""
Django settings for core project.
"""

from datetime import timedelta
from pathlib import Path
import os
import sys

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

# `manage.py test` roda dezenas de casos de teste contra os mesmos endpoints
# sensíveis (login, cadastro) em segundos — bem abaixo da janela de 1 minuto
# do rate limiting. Sem isso, a suíte de testes ficaria instável (passa ou
# falha dependendo da ordem/velocidade de execução) por um motivo que nada
# tem a ver com o comportamento sendo testado.
TESTING = "test" in sys.argv


# Em produção, SECRET_KEY/DEBUG/ALLOWED_HOSTS DEVEM vir de variáveis de
# ambiente reais — os valores abaixo são apenas fallback para desenvolvimento
# local, nunca usados quando as variáveis são definidas (.env local ou
# ambiente de produção/CI).
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-=eb#qqbxlkt$51anhk95b6t0d0b0fa-29kugu#7^8+axaztbv+',
)


DEBUG = os.environ.get('DEBUG', 'True') == 'True'


ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get('ALLOWED_HOSTS', '').split(',')
    if host.strip()
]

# URL do frontend, usada para montar links (ex.: redefinição de senha)
# enviados por e-mail.
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')


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


    # projeto
    'advocacia',
    'api',

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


# LANGUAGE

LANGUAGE_CODE = 'pt-br'


TIME_ZONE = 'America/Sao_Paulo'


USE_I18N = True


USE_TZ = True



# STATIC

STATIC_URL = 'static/'

MEDIA_URL = 'media/'
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

        "rest_framework_simplejwt.authentication.JWTStatelessUserAuthentication",

    ),

    "DEFAULT_PERMISSION_CLASSES": (

        "rest_framework.permissions.IsAuthenticated",

    ),

    "DEFAULT_PAGINATION_CLASS": "advocacia.pagination.PaginacaoPadrao",

    "DEFAULT_THROTTLE_CLASSES": () if TESTING else (

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

    },

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