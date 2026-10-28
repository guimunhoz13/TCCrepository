"""Ambiente descartável de auditoria. Nunca lê o .env nem usa banco remoto.

Uso: python manage.py test --settings=core.settings_auditoria
PostgreSQL local exclusivo: porta AUDIT_DB_PORT (padrão 55439), banco
lexnexo_auditoria, usuário AUDIT_DB_USER (padrão do usuário do sistema).
Não usar este módulo em produção.
"""
import getpass
import os
import tempfile
from pathlib import Path

os.environ["LEXNEXO_ENV_FILE"] = os.devnull
os.environ["DEBUG"] = "True"
os.environ["SECRET_KEY"] = "auditoria-local-descartavel-sem-uso-em-producao-2026"
os.environ["ALLOWED_HOSTS"] = "localhost,127.0.0.1,testserver"
os.environ["MEDIA_STORAGE"] = "filesystem"
os.environ["LIMITES_DESLIGADOS"] = "True"
for _nome in (
    "OPENAI_API_KEY", "DATAJUD_API_KEY", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY",
    "VAPID_EMAIL", "EMAIL_HOST_USER", "EMAIL_HOST_PASSWORD", "DB_SSLMODE",
    "RENDER_EXTERNAL_HOSTNAME",
):
    os.environ[_nome] = ""

from .settings import *  # noqa: E402,F403

DATABASES = {"default": {
    "ENGINE": "django.db.backends.postgresql",
    "HOST": "127.0.0.1",
    "PORT": os.environ.get("AUDIT_DB_PORT", "55439"),
    "NAME": "lexnexo_auditoria",
    "USER": os.environ.get("AUDIT_DB_USER", getpass.getuser()),
    "PASSWORD": os.environ.get("AUDIT_DB_PASSWORD", ""),
    "CONN_MAX_AGE": 0,
    "TEST": {"NAME": "test_lexnexo_auditoria"},
}}
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
MEDIA_ROOT = Path(tempfile.gettempdir()) / "lexnexo-auditoria-media"
_porta_frontend = os.environ.get("AUDIT_FRONTEND_PORT", "3000")
FRONTEND_URL = f"http://localhost:{_porta_frontend}"
CORS_ALLOWED_ORIGINS = [FRONTEND_URL, f"http://127.0.0.1:{_porta_frontend}"]
# Evita rede/DNS durante cadastro e notícias; integrações são testadas com mocks.
DATAJUD_URL_BASE = "http://127.0.0.1:9"
DJEN_API_URL = "http://127.0.0.1:9"
