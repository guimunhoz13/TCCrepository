import base64
import json
import os
from io import StringIO
from unittest.mock import MagicMock, patch

import http_ece
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from django.core.management import call_command
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import InscricaoPush, Tarefa
from ..push import gerar_chaves, notificar_usuario
from .base import _EquipeDoEscritorio

PUBLICA, PRIVADA = gerar_chaves()


def _b64(dados):
    return base64.urlsafe_b64encode(dados).rstrip(b"=").decode()


class AparelhoFalso:
    """Faz o papel do navegador: tem as chaves da inscrição e decifra."""

    def __init__(self, endpoint="https://fcm.googleapis.com/fcm/send/abc"):
        self.chave = ec.generate_private_key(ec.SECP256R1())
        self.auth = os.urandom(16)
        self.inscricao = {
            "endpoint": endpoint,
            "keys": {
                "p256dh": _b64(self.chave.public_key().public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)),
                "auth": _b64(self.auth),
            },
        }

    def decifrar(self, corpo):
        return json.loads(http_ece.decrypt(corpo, private_key=self.chave, auth_secret=self.auth, version="aes128gcm"))


def _resposta(codigo=201):
    resposta = MagicMock(status_code=codigo, text="", headers={})
    return resposta


@override_settings(VAPID_PUBLIC_KEY=PUBLICA, VAPID_PRIVATE_KEY=PRIVADA, VAPID_EMAIL="ti@escritorio.com")
class NotificacoesPushAPITestCase(_EquipeDoEscritorio, APITestCase):

    def setUp(self):
        self._equipe()
        self.aparelho = AparelhoFalso()

    def _inscrever(self, perfil="advogado"):
        self._como(perfil)
        return self.client.post("/api/push/inscrever/", self.aparelho.inscricao, format="json")

    def test_situacao_traz_a_chave_publica(self):
        self._como("advogado")
        dados = self.client.get("/api/push/").data
        self.assertTrue(dados["ativo"])
        self.assertEqual(dados["chave_publica"], PUBLICA)
        self.assertEqual(dados["aparelhos"], 0)

    def test_inscreve_e_a_mensagem_chega_cifrada_e_assinada(self):
        self.assertEqual(self._inscrever().status_code, status.HTTP_201_CREATED)
        with patch("requests.post", return_value=_resposta()) as post:
            enviados = notificar_usuario(self.membros["advogado"], "Prazo amanhã", "Contestação", url="/dashboard")
        self.assertEqual(enviados, 1)
        endpoint = post.call_args[0][0]
        self.assertEqual(endpoint, self.aparelho.inscricao["endpoint"])
        cabecalhos = post.call_args[1]["headers"]
        self.assertTrue(cabecalhos["Authorization"].startswith("vapid t="))
        self.assertIn(f"k={PUBLICA}", cabecalhos["Authorization"])
        self.assertEqual(cabecalhos["content-encoding"], "aes128gcm")
        conteudo = self.aparelho.decifrar(post.call_args[1]["data"])
        self.assertEqual(conteudo, {"titulo": "Prazo amanhã", "corpo": "Contestação", "url": "/dashboard"})

    def test_inscricao_expirada_e_apagada(self):
        self._inscrever()
        with patch("requests.post", return_value=_resposta(410)):
            self.assertEqual(notificar_usuario(self.membros["advogado"], "x", "y"), 0)
        self.assertFalse(InscricaoPush.objects.exists())

    def test_tarefa_atribuida_avisa_o_responsavel_no_celular(self):
        self._inscrever("advogado")
        self._como("admin")
        with patch("requests.post", return_value=_resposta()) as post:
            resposta = self.client.post(
                "/api/tarefas/",
                {"titulo": "Revisar minuta", "responsavel": self.membros["advogado"].id},
                format="json",
            )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        conteudo = self.aparelho.decifrar(post.call_args[1]["data"])
        self.assertEqual(conteudo["titulo"], "Nova tarefa para você")
        self.assertIn("Revisar minuta", conteudo["corpo"])

    def test_cancelar_remove_so_o_aparelho_da_pessoa(self):
        self._inscrever()
        self._como("estagiario")
        self.client.post("/api/push/cancelar/", {"endpoint": self.aparelho.inscricao["endpoint"]}, format="json")
        self.assertEqual(InscricaoPush.objects.count(), 1)
        self._como("advogado")
        self.client.post("/api/push/cancelar/", {"endpoint": self.aparelho.inscricao["endpoint"]}, format="json")
        self.assertFalse(InscricaoPush.objects.exists())

    def test_mesmo_aparelho_passa_para_quem_entrou_nele(self):
        self._inscrever("advogado")
        self._inscrever("estagiario")
        self.assertEqual(InscricaoPush.objects.get().usuario, self.membros["estagiario"])

    def test_inscricao_sem_https_ou_sem_chaves_e_recusada(self):
        self._como("advogado")
        ruim = {"endpoint": "http://exemplo.com", "keys": {"p256dh": "a", "auth": "b"}}
        self.assertEqual(self.client.post("/api/push/inscrever/", ruim, format="json").status_code, 400)
        self.assertEqual(
            self.client.post("/api/push/inscrever/", {"endpoint": "https://x"}, format="json").status_code, 400
        )

    def test_testar_sem_aparelho_explica(self):
        self._como("advogado")
        self.assertEqual(self.client.post("/api/push/testar/").status_code, status.HTTP_400_BAD_REQUEST)


@override_settings(VAPID_PUBLIC_KEY="", VAPID_PRIVATE_KEY="")
class PushDesligadoAPITestCase(_EquipeDoEscritorio, APITestCase):

    def test_sem_chaves_o_sistema_avisa_e_nao_tenta_enviar(self):
        self._equipe()
        self._como("advogado")
        self.assertFalse(self.client.get("/api/push/").data["ativo"])
        resposta = self.client.post("/api/push/inscrever/", AparelhoFalso().inscricao, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        with patch("requests.post") as post:
            Tarefa.objects.create(escritorio=self.escritorio, titulo="x", responsavel=self.membros["advogado"])
            self.assertEqual(notificar_usuario(self.membros["advogado"], "a", "b"), 0)
        post.assert_not_called()

    def test_comando_gera_par_de_chaves(self):
        saida = StringIO()
        call_command("gerar_chaves_vapid", stdout=saida)
        linhas = saida.getvalue().splitlines()
        self.assertTrue(linhas[0].startswith("VAPID_PUBLIC_KEY="))
        self.assertEqual(len(base64.urlsafe_b64decode(linhas[0].split("=", 1)[1] + "==")), 65)
        self.assertEqual(len(base64.urlsafe_b64decode(linhas[1].split("=", 1)[1] + "==")), 32)
