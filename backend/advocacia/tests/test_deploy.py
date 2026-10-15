"""Proteções necessárias para o piloto publicado."""

from unittest.mock import MagicMock, patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import OperationalError
from django.test import RequestFactory, SimpleTestCase, override_settings

from core.storage import PrivateMediaStorage
from core.urls import health


class ConfiguracaoPilotoTests(SimpleTestCase):
    def test_url_da_foto_passa_pela_api_autenticada(self):
        armazenamento = PrivateMediaStorage(
            bucket_name='piloto',
            endpoint_url='https://example.storage.supabase.co/storage/v1/s3',
            region_name='sa-east-1',
            access_key='teste',
            secret_key='teste',
        )
        self.assertEqual(
            armazenamento.url('clientes/fotos/retrato.png'),
            '/api/fotos/clientes/fotos/retrato.png',
        )

    @override_settings(DEBUG=False, TESTING=False)
    @patch.dict('os.environ', {'DEMO_PASSWORD': ''})
    def test_senha_padrao_da_demo_e_recusada_em_producao(self):
        with self.assertRaisesMessage(CommandError, 'DEMO_PASSWORD'):
            call_command('popular_demo')

    def test_health_reporta_banco_disponivel(self):
        with patch('core.urls.connection') as banco:
            banco.cursor.return_value.__enter__.return_value = MagicMock()
            resposta = health(RequestFactory().get('/api/health/'))
        self.assertEqual(resposta.status_code, 200)

    def test_health_reporta_banco_indisponivel(self):
        with patch('core.urls.connection') as banco:
            banco.cursor.side_effect = OperationalError
            resposta = health(RequestFactory().get('/api/health/'))
        self.assertEqual(resposta.status_code, 503)
