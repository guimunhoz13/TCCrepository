"""Cadastro do escritório e dos advogados."""

from unittest.mock import patch

from django.contrib.auth.hashers import make_password
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import (
    Advogado,
    Escritorio,
    TokenVerificacaoEmail,
    Usuario,
)
from .base import _criar_escritorio, _criar_usuario, _gerar_token_de_acesso


@patch("advocacia.validators._dominio_tem_mx", return_value=True)
class EscritorioRegistroAPITestCase(APITestCase):
    """Testa o cadastro inicial de um novo escritório (auto-registro)."""

    def _payload_valido(self, **overrides):
        dados = {
            "nome_escritorio": "Novo Escritorio",
            "cnpj": "33333333000144",
            "email_escritorio": "contato@novoescritorio.com",
            "telefone_escritorio": "11966665555",
            "endereco_escritorio": "Rua Nova, 200",
            "nome_admin": "Novo Admin",
            "email_admin": "admin@novoescritorio.com",
            "senha_admin": "Senha123!",
        }
        dados.update(overrides)
        return dados

    def test_registro_cria_escritorio_e_admin(self, _mock_mx):
        resposta = self.client.post(
            "/api/escritorios/registrar/", self._payload_valido(), format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Escritorio.objects.filter(cnpj="33333333000144").exists()
        )
        usuario = Usuario.objects.get(email="admin@novoescritorio.com")
        self.assertEqual(usuario.tipo_usuario, "admin")

    def test_registro_com_cnpj_duplicado_e_rejeitado(self, _mock_mx):
        _criar_escritorio(cnpj="33333333000144")
        resposta = self.client.post(
            "/api/escritorios/registrar/", self._payload_valido(), format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registro_com_cnpj_com_poucos_digitos_e_rejeitado(self, _mock_mx):
        resposta = self.client.post(
            "/api/escritorios/registrar/",
            self._payload_valido(cnpj="333333330001"),
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cnpj", resposta.data)

    def test_registro_com_telefone_com_poucos_digitos_e_rejeitado(self, _mock_mx):
        resposta = self.client.post(
            "/api/escritorios/registrar/",
            self._payload_valido(telefone_escritorio="1199999"),
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("telefone_escritorio", resposta.data)

    def test_registro_com_senha_fraca_e_rejeitado(self, _mock_mx):
        resposta = self.client.post(
            "/api/escritorios/registrar/",
            self._payload_valido(senha_admin="senha12345"),  # sem maiúscula/especial
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("senha_admin", resposta.data)

    @override_settings(DEBUG=True)
    def test_em_desenvolvimento_nao_exige_verificacao_de_email(self, _mock_mx):
        """Com DEBUG=True (o padrão em desenvolvimento), o cadastro fica
        liberado de imediato — não travar quem usa e-mails fictícios pra
        testar. O runner de testes do Django força DEBUG=False durante
        `manage.py test` mesmo com DEBUG=True no .env, então este teste
        precisa reativar DEBUG=True explicitamente para simular o cenário
        real de desenvolvimento local."""
        resposta = self.client.post(
            "/api/escritorios/registrar/", self._payload_valido(), format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertFalse(resposta.data["requer_verificacao_email"])

        usuario = Usuario.objects.get(email="admin@novoescritorio.com")
        self.assertTrue(usuario.email_verificado)

        login = self.client.post(
            "/api/login/",
            {"email": "admin@novoescritorio.com", "senha": "Senha123!"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    @override_settings(DEBUG=False)
    def test_em_producao_exige_verificacao_de_email_antes_do_login(self, _mock_mx):
        resposta = self.client.post(
            "/api/escritorios/registrar/", self._payload_valido(), format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertTrue(resposta.data["requer_verificacao_email"])

        usuario = Usuario.objects.get(email="admin@novoescritorio.com")
        self.assertFalse(usuario.email_verificado)
        self.assertTrue(
            TokenVerificacaoEmail.objects.filter(usuario=usuario).exists()
        )

        login_antes = self.client.post(
            "/api/login/",
            {"email": "admin@novoescritorio.com", "senha": "Senha123!"},
            format="json",
        )
        self.assertEqual(login_antes.status_code, status.HTTP_403_FORBIDDEN)

        token = TokenVerificacaoEmail.objects.get(usuario=usuario)
        confirmacao = self.client.post(
            "/api/escritorios/confirmar-email/",
            {"token": token.token},
            format="json",
        )
        self.assertEqual(confirmacao.status_code, status.HTTP_200_OK)

        usuario.refresh_from_db()
        self.assertTrue(usuario.email_verificado)

        login_depois = self.client.post(
            "/api/login/",
            {"email": "admin@novoescritorio.com", "senha": "Senha123!"},
            format="json",
        )
        self.assertEqual(login_depois.status_code, status.HTTP_200_OK)

    @override_settings(DEBUG=False)
    def test_confirmar_email_com_token_invalido_e_rejeitado(self, _mock_mx):
        resposta = self.client.post(
            "/api/escritorios/confirmar-email/",
            {"token": "token-que-nao-existe"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(DEBUG=False)
    def test_confirmar_email_com_token_ja_usado_e_rejeitado(self, _mock_mx):
        self.client.post(
            "/api/escritorios/registrar/", self._payload_valido(), format="json"
        )
        usuario = Usuario.objects.get(email="admin@novoescritorio.com")
        token = TokenVerificacaoEmail.objects.get(usuario=usuario)
        token.usado = True
        token.save(update_fields=["usado"])

        resposta = self.client.post(
            "/api/escritorios/confirmar-email/",
            {"token": token.token},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)


class AdvogadosAPITestCase(APITestCase):
    """Testa a edição de advogados, incluindo o erro de OAB duplicada."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)

        def _criar_advogado(nome, email, oab):
            usuario = Usuario.objects.create(
                escritorio=self.escritorio,
                nome=nome,
                email=email,
                senha=make_password("senha12345"),
                tipo_usuario="advogado",
            )
            return Advogado.objects.create(
                escritorio=self.escritorio, usuario=usuario, oab=oab, especialidade="Civil"
            )

        self.advogado_a = _criar_advogado("Advogado A", "advogado.a@teste.com", "111111/SP")
        self.advogado_b = _criar_advogado("Advogado B", "advogado.b@teste.com", "222222/SP")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_editar_advogado_para_oab_de_outro_retorna_erro_especifico(self):
        """Antes, a OAB duplicada ao editar caía no perform_update padrão do
        ModelViewSet, sem checagem, derrubando um IntegrityError não tratado
        (500 genérico). Agora deve voltar um 400 claro, no campo "oab"."""
        resposta = self.client.patch(
            f"/api/advogados/{self.advogado_b.id}/",
            {"oab": self.advogado_a.oab},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("oab", resposta.data)
