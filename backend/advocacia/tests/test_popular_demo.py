from io import StringIO

from django.core.management import call_command
from rest_framework.test import APITestCase

from ..models import Escritorio, Processo, Usuario


class PopularDemonstracaoTestCase(APITestCase):

    def _entrar(self, quem):
        resposta = self.client.post(
            "/api/login/", {"email": f"{quem}@demo.lexoffice.app", "senha": "Demo@1234"}, format="json"
        )
        self.assertEqual(resposta.status_code, 200, resposta.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resposta.data['access']}")

    def test_cria_um_escritorio_completo_e_utilizavel(self):
        call_command("popular_demo", stdout=StringIO())
        escritorio = Escritorio.objects.get(cnpj="00.000.000/0001-91")
        self.assertEqual(Usuario.objects.filter(escritorio=escritorio).count(), 5)
        self.assertEqual(Processo.objects.filter(escritorio=escritorio).count(), 4)

        self._entrar("admin")
        painel = self.client.get("/api/dashboard/").data
        self.assertIn("financeiro", painel)
        self.assertEqual(len(self.client.get("/api/processos/").data["results"]), 4)

        # O processo de família é sigiloso e de outra advogada.
        self._entrar("estagiario")
        self.assertEqual(len(self.client.get("/api/processos/").data["results"]), 3)

    def test_nao_duplica_e_recria_quando_pedido(self):
        call_command("popular_demo", stdout=StringIO())
        saida = StringIO()
        call_command("popular_demo", stdout=saida)
        self.assertIn("já existe", saida.getvalue())
        call_command("popular_demo", "--recriar", "--senha", "Outra@2026", stdout=StringIO())
        self.assertEqual(Escritorio.objects.filter(cnpj="00.000.000/0001-91").count(), 1)
        resposta = self.client.post(
            "/api/login/", {"email": "admin@demo.lexoffice.app", "senha": "Outra@2026"}, format="json"
        )
        self.assertEqual(resposta.status_code, 200)
