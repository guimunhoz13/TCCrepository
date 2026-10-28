"""Medição leve exclusiva do banco local de auditoria; sem rede externa."""
import json
import math
import os
from pathlib import Path
import statistics
import sys
import time

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
os.environ["DJANGO_SETTINGS_MODULE"] = "core.settings_auditoria"
import django
django.setup()

from django.conf import settings
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient
from advocacia.models import Processo, Usuario
from advocacia.tests.base import _gerar_token_de_acesso

assert settings.DATABASES["default"]["HOST"] == "127.0.0.1"
assert settings.DATABASES["default"]["NAME"] == "lexnexo_auditoria"
usuario = Usuario.objects.get(email="admin@demo.lexnexo.app")
base = Processo.objects.filter(escritorio=usuario.escritorio).first()
for indice in range(20):
    Processo.objects.get_or_create(
        escritorio=usuario.escritorio, numero_processo=f"AUDITORIA-PERF-{indice:02}",
        defaults={"cliente": base.cliente, "advogado": base.advogado, "titulo": "Caso sintético de medição"},
    )
cliente = APIClient()
cliente.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(usuario)}")
resultados = []
for rota in ("clientes/", "processos/?page_size=5", "processos/?page_size=25", "dashboard/", "agenda/"):
    url = "/api/" + rota
    cliente.get(url)  # aquecimento
    tempos, consultas = [], []
    for _ in range(12):
        inicio = time.perf_counter()
        with CaptureQueriesContext(connection) as capturadas:
            resposta = cliente.get(url)
        assert resposta.status_code == 200, (rota, resposta.status_code)
        tempos.append((time.perf_counter() - inicio) * 1000)
        consultas.append(len(capturadas))
    resultados.append({
        "rota": url, "amostras": len(tempos), "status": 200,
        "mediana_ms": round(statistics.median(tempos), 2),
        "p95_ms": round(sorted(tempos)[math.ceil(len(tempos) * .95) - 1], 2),
        "consultas_min": min(consultas), "consultas_max": max(consultas),
    })
print(json.dumps({
    "ambiente": "PostgreSQL local; APIClient em processo; 20 processos sintéticos adicionais",
    "limites": "12 amostras, com instrumentação SQL; não mede rede, TLS, navegador ou produção",
    "resultados": resultados,
}, indent=2, ensure_ascii=False))
