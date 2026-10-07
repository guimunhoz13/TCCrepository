from datetime import timedelta
from unittest.mock import patch

from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Agenda, Movimentacao
from .resumo_cliente import traduzir_andamento
from .tests import _EquipeDoEscritorio, _resposta_openai


class ResumoParaClienteAPITestCase(_EquipeDoEscritorio, APITestCase):

    def setUp(self):
        self._equipe()
        self.cliente.nome = "Maria Fernanda Costa"
        self.cliente.cpf = "12345678900"
        self.cliente.telefone = "18999990000"
        self.cliente.save()
        self.processo = self._processo(self.escritorio, self.cliente, self.advogado, "0001234-56.2026.8.26.0100")
        agora = timezone.now()
        Movimentacao.objects.create(processo=self.processo, descricao="Conclusos para despacho", data_movimentacao=agora - timedelta(days=2))
        Movimentacao.objects.create(processo=self.processo, descricao="Juntada de Petição de contestação", data_movimentacao=agora - timedelta(days=5))
        Agenda.objects.create(
            escritorio=self.escritorio, processo=self.processo, titulo="Audiência de conciliação",
            descricao="", data_evento=agora + timedelta(days=10),
        )
        self.url = f"/api/processos/{self.processo.id}/resumo-cliente/"

    def test_traduz_os_andamentos_mais_comuns(self):
        self.assertEqual(traduzir_andamento("Conclusos para decisão"), "o processo foi para o juiz analisar")
        self.assertEqual(traduzir_andamento("Expedição de sentença"), "o juiz deu a sentença do processo")
        self.assertIsNone(traduzir_andamento("Mero expediente interno"))

    def test_sem_ia_configurada_usa_o_modelo_em_linguagem_simples(self):
        self._como("advogado")
        resposta = self.client.post(self.url)
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(resposta.data["fonte"], "modelo")
        texto = resposta.data["texto"]
        self.assertIn("Olá, Maria!", texto)
        self.assertIn("O processo foi para o juiz analisar", texto)
        self.assertIn("Um documento foi incluído no processo", texto)
        self.assertIn("Audiência de conciliação", texto)
        self.assertNotIn("Conclusos", texto)
        self.assertEqual(resposta.data["cliente_telefone"], "18999990000")

    @override_settings(OPENAI_API_KEY="chave-de-teste")
    @patch("openai.OpenAI")
    def test_com_ia_manda_so_o_minimo_e_devolve_o_texto_dela(self, openai):
        openai.return_value.chat.completions.create.return_value = _resposta_openai("Olá, Maria! Novidades…")
        self._como("advogado")
        resposta = self.client.post(self.url)
        self.assertEqual(resposta.data["fonte"], "ia")
        self.assertEqual(resposta.data["texto"], "Olá, Maria! Novidades…")
        enviado = str(openai.return_value.chat.completions.create.call_args)
        self.assertIn("Conclusos para despacho", enviado)
        self.assertNotIn("12345678900", enviado)
        self.assertNotIn("Fernanda Costa", enviado)

    @override_settings(OPENAI_API_KEY="chave-de-teste")
    @patch("openai.OpenAI")
    def test_se_a_ia_falha_cai_no_modelo(self, openai):
        openai.return_value.chat.completions.create.side_effect = RuntimeError("fora do ar")
        self._como("advogado")
        resposta = self.client.post(self.url)
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["fonte"], "modelo")

    @override_settings(OPENAI_API_KEY="chave-de-teste")
    @patch("openai.OpenAI")
    def test_secretaria_sem_acesso_a_ia_recebe_o_modelo(self, openai):
        self._como("secretaria")
        resposta = self.client.post(self.url)
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["fonte"], "modelo")
        openai.assert_not_called()

    def test_processo_sigiloso_de_outro_advogado_nao_e_acessivel(self):
        self.processo.sigiloso = True
        self.processo.save()
        self._como("estagiario")
        self.assertEqual(self.client.post(self.url).status_code, status.HTTP_404_NOT_FOUND)
