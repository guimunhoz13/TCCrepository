"""Fotos servidas com autenticação; documentos não têm URL direta."""

from tempfile import TemporaryDirectory
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import Cliente, FotoPersistente
from core.storage import PersistentPhotoStorage
from PIL import Image
from .base import _criar_escritorio, _criar_usuario, _gerar_token_de_acesso


class FotosProtegidasAPITestCase(APITestCase):
    def setUp(self):
        temporario = self.enterContext(TemporaryDirectory())
        self.enterContext(override_settings(MEDIA_ROOT=temporario))
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)
        imagem = BytesIO()
        Image.new("RGB", (800, 600), "navy").save(imagem, format="PNG")
        self.png = imagem.getvalue()
        self.usuario.foto.save("perfil.png", ContentFile(self.png), save=True)
        self.cliente = Cliente.objects.create(escritorio=self.escritorio, nome="Cliente")
        self.cliente.foto.save("cliente.png", ContentFile(self.png), save=True)

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
        self.assertEqual(resposta["Content-Type"], "image/webp")
        imagem = Image.open(BytesIO(b"".join(resposta.streaming_content)))
        self.assertEqual(imagem.size, (512, 384))
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

    def test_foto_persiste_com_nova_instancia_sem_arquivo_no_disco(self):
        self.assertTrue(FotoPersistente.objects.filter(nome=self.usuario.foto.name).exists())
        with TemporaryDirectory() as disco_vazio:
            storage = PersistentPhotoStorage("django.core.files.storage.FileSystemStorage", {"location": disco_vazio})
            with storage.open(self.usuario.foto.name) as arquivo:
                self.assertEqual(Image.open(arquivo).size, (512, 384))
            self.assertTrue(storage.exists(self.usuario.foto.name))

    def test_envio_de_foto_na_conta_persiste_e_e_devolvido_na_proxima_consulta(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.usuario)}")
        resposta = self.client.patch("/api/configuracoes/conta/", {
            "foto": SimpleUploadedFile("nova.png", self.png, content_type="image/png"),
        }, format="multipart")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        url = resposta.data["usuario"]["foto"]
        self.assertIn("/api/fotos/usuarios/fotos/", url)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get("/api/configuracoes/").data["usuario"]["foto"], url)

    def test_foto_invalida_retorna_erro_sem_trocar_a_atual(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.usuario)}")
        anterior = self.usuario.foto.name
        resposta = self.client.patch("/api/configuracoes/conta/", {
            "foto": SimpleUploadedFile("falsa.png", b"nao e imagem", content_type="image/png"),
        }, format="multipart")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.usuario.refresh_from_db()
        self.assertEqual(self.usuario.foto.name, anterior)

    def test_foto_legada_ainda_pode_ser_lida_do_storage_anterior(self):
        nome = self.usuario.foto.storage.arquivos.save("usuarios/fotos/legada.png", ContentFile(self.png))
        self.usuario.foto = nome
        self.usuario.save(update_fields=["foto"])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.usuario)}")
        resposta = self.client.get(self.usuario.foto.url)
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(b"".join(resposta.streaming_content), self.png)

    def test_tabela_de_fotos_tem_rls_no_postgresql(self):
        if connection.vendor != "postgresql":
            self.skipTest("Proteção específica do PostgreSQL/Supabase")
        with connection.cursor() as cursor:
            cursor.execute("SELECT relrowsecurity FROM pg_class WHERE oid = 'advocacia_fotopersistente'::regclass")
            self.assertTrue(cursor.fetchone()[0])
