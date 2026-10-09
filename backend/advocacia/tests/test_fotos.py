"""Fotos servidas com autenticação; documentos não têm URL direta."""

from tempfile import TemporaryDirectory

from django.core.files.base import ContentFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import Cliente
from .base import _criar_escritorio, _criar_usuario, _gerar_token_de_acesso


class FotosProtegidasAPITestCase(APITestCase):
    def setUp(self):
        temporario = self.enterContext(TemporaryDirectory())
        self.enterContext(override_settings(MEDIA_ROOT=temporario))
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)
        self.usuario.foto.save("perfil.png", ContentFile(b"\x89PNG\r\n\x1a\nfoto"), save=True)
        self.cliente = Cliente.objects.create(escritorio=self.escritorio, nome="Cliente")
        self.cliente.foto.save("cliente.png", ContentFile(b"\x89PNG\r\n\x1a\ncliente"), save=True)

    def test_foto_exige_login_e_escritorio_correto(self):
        url = self.usuario.foto.url
        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)

        outro = _criar_escritorio(nome="Outro", cnpj="99888777000166", email="o@o.com")
        estranho = _criar_usuario(outro, email="estranho@outro.com")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(estranho)}")
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.usuario)}")
        resposta = self.client.get(url)
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta["Content-Type"], "image/png")
        self.assertEqual(b"".join(resposta.streaming_content), b"\x89PNG\r\n\x1a\nfoto")
        self.assertEqual(self.client.get(self.cliente.foto.url).status_code, status.HTTP_200_OK)

    def test_documento_e_rota_antiga_nao_sao_publicos(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.usuario)}")
        self.assertEqual(
            self.client.get("/api/fotos/usuarios/documentos/identidade.pdf").status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.get("/media/usuarios/fotos/perfil.png").status_code,
            status.HTTP_404_NOT_FOUND,
        )
