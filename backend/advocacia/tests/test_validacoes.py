"""Modelos, validadores (e-mail, documentos, upload) e paginação."""

from unittest.mock import patch

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import (
    Cliente,
)
from ..validators import (
    validar_assinatura_arquivo,
    validar_email_real,
    validar_tamanho_documento,
    validar_tamanho_imagem,
)
from .base import _criar_escritorio, _criar_usuario, _gerar_token_de_acesso


class ModelosTestCase(TestCase):
    """Testes unitários dos modelos principais."""

    def setUp(self):
        self.escritorio = _criar_escritorio()

    def test_str_do_escritorio_retorna_o_nome(self):
        self.assertEqual(str(self.escritorio), "Escritorio Teste & Associados")

    def test_usuario_e_criado_com_valores_padrao_esperados(self):
        usuario = _criar_usuario(self.escritorio)
        self.assertEqual(str(usuario), "Ana Admin")
        self.assertTrue(usuario.ativo)
        self.assertEqual(usuario.nacionalidade, "Brasileira")
        self.assertEqual(usuario.rg, "")

    def test_cliente_nao_permite_cpf_duplicado_no_mesmo_escritorio(self):
        Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Um",
            cpf="11122233344",
            email="cliente1@teste.com",
            telefone="11988887777",
            endereco="Rua A, 1",
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Cliente.objects.create(
                    escritorio=self.escritorio,
                    nome="Cliente Dois",
                    cpf="11122233344",
                    email="cliente2@teste.com",
                    telefone="11988887778",
                    endereco="Rua B, 2",
                )

    def test_mesmo_cpf_e_permitido_em_escritorios_diferentes(self):
        outro_escritorio = _criar_escritorio(
            nome="Outro Escritorio",
            cnpj="98765432000188",
            email="contato@outro.com",
        )
        Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Um",
            cpf="11122233344",
            email="cliente1@teste.com",
            telefone="11988887777",
            endereco="Rua A, 1",
        )

        cliente_em_outro_escritorio = Cliente.objects.create(
            escritorio=outro_escritorio,
            nome="Cliente Um (outro escritório)",
            cpf="11122233344",
            email="cliente1@outro.com",
            telefone="11988887777",
            endereco="Rua A, 1",
        )
        self.assertIsNotNone(cliente_em_outro_escritorio.id)


class ValidarEmailRealTestCase(TestCase):
    """Testa o validador de e-mail isoladamente, sem depender de rede/DNS."""

    def test_formato_invalido_levanta_erro(self):
        with self.assertRaises(ValidationError):
            validar_email_real("isso-nao-e-um-email")

    def test_email_vazio_levanta_erro(self):
        with self.assertRaises(ValidationError):
            validar_email_real("")

    def test_dominio_descartavel_levanta_erro(self):
        with self.assertRaises(ValidationError):
            validar_email_real("qualquer@mailinator.com")

    @patch("advocacia.validators._dominio_tem_mx", return_value=True)
    def test_email_com_dominio_valido_e_aceito(self, _mock_mx):
        resultado = validar_email_real("pessoa@gmail.com")
        self.assertEqual(resultado, "pessoa@gmail.com")

    @patch("advocacia.validators._dominio_tem_mx", return_value=False)
    def test_dominio_sem_registro_mx_levanta_erro(self, _mock_mx):
        with self.assertRaises(ValidationError):
            validar_email_real("pessoa@dominio-sem-email-valido.com")


@patch("advocacia.validators._dominio_tem_mx", return_value=True)
class ValidacaoDeDocumentosAPITestCase(APITestCase):
    """Testa a validação de quantidade de dígitos de CPF, RG, telefone, CNPJ e OAB."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)

    def _autenticar_como_admin(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_cliente_com_cpf_incompleto_e_rejeitado(self, _mock_mx):
        self._autenticar_como_admin()
        resposta = self.client.post(
            "/api/clientes/",
            {
                "nome": "Cliente Teste",
                "cpf": "1234567890",  # 10 dígitos, falta 1
                "email": "cliente.teste@gmail.com",
                "telefone": "11977776666",
                "endereco": "Rua Teste, 1",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cpf", resposta.data)

    def test_cliente_com_telefone_sem_ddd_e_rejeitado(self, _mock_mx):
        self._autenticar_como_admin()
        resposta = self.client.post(
            "/api/clientes/",
            {
                "nome": "Cliente Teste",
                "cpf": "11122233355",
                "email": "cliente.teste2@gmail.com",
                "telefone": "988887777",  # 9 dígitos, sem DDD
                "endereco": "Rua Teste, 1",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("telefone", resposta.data)

    def test_cliente_com_rg_curto_demais_e_rejeitado(self, _mock_mx):
        self._autenticar_como_admin()
        resposta = self.client.post(
            "/api/clientes/",
            {
                "nome": "Cliente Teste",
                "cpf": "11122233366",
                "email": "cliente.teste3@gmail.com",
                "telefone": "11977776666",
                "endereco": "Rua Teste, 1",
                "rg": "1234",  # 4 dígitos, mínimo é 5
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("rg", resposta.data)

    def test_advogado_com_oab_sem_uf_e_rejeitado(self, _mock_mx):
        self._autenticar_como_admin()
        resposta = self.client.post(
            "/api/advogados/registrar/",
            {
                "nome": "Advogado Teste",
                "email": "advogado.teste@gmail.com",
                "senha": "Senha123!",
                "oab": "123456",  # falta a UF
                "especialidade": "Civil",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("oab", resposta.data)

    def test_advogado_com_oab_valida_e_aceito(self, _mock_mx):
        self._autenticar_como_admin()
        resposta = self.client.post(
            "/api/advogados/registrar/",
            {
                "nome": "Advogado Teste",
                "email": "advogado.valido@gmail.com",
                "senha": "Senha123!",
                "oab": "123456/SP",
                "especialidade": "Civil",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)

    def test_advogado_com_senha_fraca_e_rejeitado(self, _mock_mx):
        self._autenticar_como_admin()
        resposta = self.client.post(
            "/api/advogados/registrar/",
            {
                "nome": "Advogado Teste",
                "email": "advogado.senhafraca@gmail.com",
                "senha": "senha12345",  # sem maiúscula/especial
                "oab": "654321/SP",
                "especialidade": "Civil",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("senha", resposta.data)


class ValidadoresDeUploadTestCase(TestCase):
    """Testa os validadores de tamanho de arquivo isoladamente."""

    class _ArquivoFalso:
        def __init__(self, size):
            self.size = size

    def test_imagem_dentro_do_limite_nao_levanta_erro(self):
        validar_tamanho_imagem(self._ArquivoFalso(1024))

    def test_imagem_acima_de_5mb_levanta_erro(self):
        with self.assertRaises(ValidationError):
            validar_tamanho_imagem(self._ArquivoFalso(6 * 1024 * 1024))

    def test_documento_dentro_do_limite_nao_levanta_erro(self):
        validar_tamanho_documento(self._ArquivoFalso(1024))

    def test_documento_acima_de_10mb_levanta_erro(self):
        with self.assertRaises(ValidationError):
            validar_tamanho_documento(self._ArquivoFalso(11 * 1024 * 1024))

    def test_pdf_com_assinatura_correta_passa(self):
        arquivo = SimpleUploadedFile("contrato.pdf", b"%PDF-1.4\n%\xe2\xe3\xcf\xd3 resto do arquivo")
        validar_assinatura_arquivo(arquivo)

    def test_jpeg_com_assinatura_correta_passa(self):
        arquivo = SimpleUploadedFile("foto.jpg", b"\xff\xd8\xff\xe0resto")
        validar_assinatura_arquivo(arquivo)

    def test_png_com_assinatura_correta_passa(self):
        arquivo = SimpleUploadedFile("foto.png", b"\x89PNG\r\n\x1a\nresto")
        validar_assinatura_arquivo(arquivo)

    def test_webp_com_assinatura_correta_passa(self):
        arquivo = SimpleUploadedFile("foto.webp", b"RIFF\x00\x00\x00\x00WEBPresto")
        validar_assinatura_arquivo(arquivo)

    def test_docx_com_assinatura_correta_passa(self):
        arquivo = SimpleUploadedFile("peticao.docx", b"PK\x03\x04resto")
        validar_assinatura_arquivo(arquivo)

    def test_executavel_renomeado_para_pdf_e_recusado(self):
        arquivo = SimpleUploadedFile("malicioso.pdf", b"MZ\x90\x00\x03\x00\x00\x00resto de um executavel")
        with self.assertRaises(ValidationError):
            validar_assinatura_arquivo(arquivo)

    def test_texto_renomeado_para_jpg_e_recusado(self):
        arquivo = SimpleUploadedFile("nao-e-foto.jpg", b"isso aqui e so um texto qualquer")
        with self.assertRaises(ValidationError):
            validar_assinatura_arquivo(arquivo)

    def test_riff_que_nao_e_webp_e_recusado(self):
        # RIFF é o contêiner de vários formatos (WAV, AVI...); só o
        # marcador WEBP no offset 8 confirma que é mesmo uma imagem WebP.
        arquivo = SimpleUploadedFile("audio.webp", b"RIFF\x00\x00\x00\x00WAVEresto")
        with self.assertRaises(ValidationError):
            validar_assinatura_arquivo(arquivo)

    def test_validador_devolve_o_ponteiro_do_arquivo_para_o_inicio(self):
        # O upload real é lido de novo (tamanho, salvamento) depois deste
        # validador — se o ponteiro não voltar ao início, o arquivo salvo
        # sai truncado.
        arquivo = SimpleUploadedFile("contrato.pdf", b"%PDF-1.4\nresto do conteudo")
        validar_assinatura_arquivo(arquivo)
        self.assertEqual(arquivo.tell(), 0)


class PaginacaoAPITestCase(APITestCase):
    """Testa que os endpoints de listagem retornam o formato paginado do DRF."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        for i in range(3):
            Cliente.objects.create(
                escritorio=self.escritorio,
                nome=f"Cliente {i}",
                cpf=f"1000000000{i}",
                email=f"cliente{i}@teste.com",
                telefone="11966666699",
                endereco="Rua H",
            )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_listagem_retorna_envelope_paginado(self):
        resposta = self.client.get("/api/clientes/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        for chave in ("count", "next", "previous", "results"):
            self.assertIn(chave, resposta.data)
        self.assertEqual(resposta.data["count"], 3)

    def test_page_size_customizado_e_respeitado(self):
        resposta = self.client.get("/api/clientes/", {"page_size": 1})
        self.assertEqual(len(resposta.data["results"]), 1)
        self.assertIsNotNone(resposta.data["next"])
