#!/usr/bin/env bash
set -euo pipefail

# No plano gratuito não há etapa pre-deploy. A migração idempotente roda antes
# de cada inicialização, inclusive após o serviço acordar de uma pausa.
python manage.py migrate --noinput
exec gunicorn core.wsgi:application --bind "0.0.0.0:${PORT:-10000}" --workers 1 --threads 4 --timeout 120
