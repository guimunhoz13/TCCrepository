from rest_framework import status
from rest_framework.test import APITestCase

from ..models import RascunhoFormulario
from .base import _criar_escritorio, _criar_usuario, _gerar_token_de_acesso


class RascunhoFormularioAPITestCase(APITestCase):
    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.usuario)}"
        )

    def test_cria_e_atualiza_o_mesmo_rascunho(self):
        resposta = self.client.post(
            "/api/rascunhos/", {"chave": "novo-cliente", "dados": {"nome": "Ana"}}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)

        resposta = self.client.post(
            "/api/rascunhos/", {"chave": "novo-cliente", "dados": {"nome": "Ana Maria"}}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(RascunhoFormulario.objects.count(), 1)
        self.assertEqual(resposta.data["dados"]["nome"], "Ana Maria")

    def test_rascunho_e_privado_ate_no_mesmo_escritorio(self):
        self.client.post(
            "/api/rascunhos/", {"chave": "novo-processo", "dados": {"titulo": "Sigiloso"}}, format="json"
        )
        outro_usuario = _criar_usuario(self.escritorio, email="colega@escritorio.com")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(outro_usuario)}"
        )

        resposta = self.client.get("/api/rascunhos/novo-processo/")
        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    def test_recusa_conteudo_que_nao_seja_objeto(self):
        resposta = self.client.post(
            "/api/rascunhos/", {"chave": "novo-cliente", "dados": ["indevido"]}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("dados", resposta.data)

    def test_recusa_rascunho_maior_que_64_kb(self):
        resposta = self.client.post(
            "/api/rascunhos/",
            {"chave": "novo-cliente", "dados": {"texto": "x" * (65 * 1024)}},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("dados", resposta.data)

    def test_recusa_chave_fora_do_formato_seguro(self):
        resposta = self.client.post(
            "/api/rascunhos/",
            {"chave": "../../outro", "dados": {"nome": "Teste"}},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("chave", resposta.data)

    def test_usuario_pode_excluir_o_proprio_rascunho(self):
        RascunhoFormulario.objects.create(
            escritorio=self.escritorio,
            usuario=self.usuario,
            chave="nova-tarefa",
            dados={"titulo": "Revisar"},
        )
        resposta = self.client.delete("/api/rascunhos/nova-tarefa/")
        self.assertEqual(resposta.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(RascunhoFormulario.objects.exists())
