"""Registro de auditoria e painel mestre."""


from django.contrib.auth.hashers import make_password
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import (
    Cliente,
    RegistroAuditoria,
    SuperAdmin,
)
from .base import (
    _criar_escritorio,
    _criar_usuario,
    _gerar_token_de_acesso,
    _gerar_token_master,
)


class PainelMestreAPITestCase(APITestCase):
    """Testa a autenticação e o isolamento do painel mestre (superadmin)."""

    def setUp(self):
        self.escritorio_a = _criar_escritorio(cnpj="11111111000111", nome="Escritorio A")
        self.escritorio_b = _criar_escritorio(
            cnpj="22222222000122", nome="Escritorio B", email="b@escritorio.com"
        )
        self.admin_a = _criar_usuario(self.escritorio_a)
        self.superadmin = SuperAdmin.objects.create(
            nome="Dev",
            email="dev@lexoffice.com",
            senha=make_password("masterpass123"),
        )

    def test_login_master_com_credenciais_corretas(self):
        resposta = self.client.post(
            "/api/master/login/",
            {"email": "dev@lexoffice.com", "senha": "masterpass123"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertIn("access", resposta.data)

    def test_login_master_com_senha_incorreta_e_negado(self):
        resposta = self.client.post(
            "/api/master/login/",
            {"email": "dev@lexoffice.com", "senha": "senha-errada"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_master_lista_todos_os_escritorios(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_master(self.superadmin)}"
        )
        resposta = self.client.get("/api/master/escritorios/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        nomes = {e["nome"] for e in resposta.data["results"]}
        self.assertIn("Escritorio A", nomes)
        self.assertIn("Escritorio B", nomes)

    def test_master_pode_inativar_escritorio(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_master(self.superadmin)}"
        )
        resposta = self.client.patch(
            f"/api/master/escritorios/{self.escritorio_a.id}/",
            {"ativo": False},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.escritorio_a.refresh_from_db()
        self.assertFalse(self.escritorio_a.ativo)

    def test_usuario_comum_nao_acessa_painel_mestre(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.get("/api/master/escritorios/")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_acesso_sem_token_e_negado(self):
        resposta = self.client.get("/api/master/escritorios/")
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_master_nao_enxerga_dados_de_tenant(self):
        Cliente.objects.create(
            escritorio=self.escritorio_a,
            nome="Cliente X",
            cpf="55555555555",
            email="x@teste.com",
            telefone="11955555555",
            endereco="Rua E",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_master(self.superadmin)}"
        )
        resposta = self.client.get("/api/clientes/")
        # O token mestre não tem perfil de escritório, então a matriz de
        # permissões recusa antes mesmo de chegar ao filtro por escritório.
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotIn("Cliente X", str(resposta.data))


class AuditoriaLoginAPITestCase(APITestCase):
    """Testa que eventos de login (sucesso, falha, bloqueio) geram registros de auditoria."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)
        self.superadmin = SuperAdmin.objects.create(
            nome="Dev Master",
            email="dev.audit@lexoffice.com",
            senha=make_password("senha-master-123"),
        )

    def test_login_bem_sucedido_gera_registro_de_auditoria(self):
        resposta = self.client.post(
            "/api/login/",
            {"email": "ana@escritorio.com", "senha": "senha12345"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        registro = RegistroAuditoria.objects.filter(acao="login_sucesso").latest("id")
        self.assertEqual(registro.usuario, self.usuario)
        self.assertEqual(registro.escritorio, self.escritorio)

    def test_login_com_senha_errada_gera_registro_de_falha(self):
        resposta = self.client.post(
            "/api/login/",
            {"email": "ana@escritorio.com", "senha": "senha-errada"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)
        registro = RegistroAuditoria.objects.filter(acao="login_falha").latest("id")
        self.assertEqual(registro.usuario, self.usuario)

    def test_bloqueio_apos_3_tentativas_gera_registro_de_bloqueio(self):
        for _ in range(3):
            self.client.post(
                "/api/login/",
                {"email": "ana@escritorio.com", "senha": "senha-errada"},
                format="json",
            )
        registro = RegistroAuditoria.objects.filter(acao="login_bloqueado").latest("id")
        self.assertEqual(registro.usuario, self.usuario)

    def test_login_master_bem_sucedido_gera_registro_de_auditoria(self):
        resposta = self.client.post(
            "/api/master/login/",
            {"email": "dev.audit@lexoffice.com", "senha": "senha-master-123"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        registro = RegistroAuditoria.objects.filter(acao="login_sucesso", superadmin=self.superadmin).latest("id")
        self.assertIsNotNone(registro)


class AuditoriaVisualizacaoAPITestCase(APITestCase):
    """Testa a visibilidade e o isolamento multi-tenant do painel de auditoria."""

    def setUp(self):
        self.escritorio_a = _criar_escritorio(nome="Escritorio A", cnpj="11111111000111", email="a@teste.com")
        self.escritorio_b = _criar_escritorio(nome="Escritorio B", cnpj="22222222000122", email="b@teste.com")

        self.admin_a = _criar_usuario(self.escritorio_a, email="admin.a@teste.com")
        self.advogado_a = _criar_usuario(
            self.escritorio_a,
            nome="Advogado A",
            email="adv.a@teste.com",
            tipo_usuario="advogado",
        )
        self.admin_b = _criar_usuario(self.escritorio_b, email="admin.b@teste.com")

        self.superadmin = SuperAdmin.objects.create(
            nome="Dev Master",
            email="dev.view@lexoffice.com",
            senha=make_password("senha-master-123"),
        )

        RegistroAuditoria.objects.create(
            escritorio=self.escritorio_a,
            usuario=self.admin_a,
            acao="login_sucesso",
            descricao="Login de teste — escritório A",
        )
        RegistroAuditoria.objects.create(
            escritorio=self.escritorio_b,
            usuario=self.admin_b,
            acao="login_sucesso",
            descricao="Login de teste — escritório B",
        )

    def test_admin_ve_apenas_registros_do_proprio_escritorio(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.get("/api/auditoria/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        descricoes = [r["descricao"] for r in resposta.data["results"]]
        self.assertIn("Login de teste — escritório A", descricoes)
        self.assertNotIn("Login de teste — escritório B", descricoes)

    def test_advogado_comum_nao_ve_registros_de_auditoria(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.advogado_a)}"
        )
        resposta = self.client.get("/api/auditoria/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resposta.data["results"]), 0)

    def test_master_ve_registros_de_todos_os_escritorios(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_master(self.superadmin)}"
        )
        resposta = self.client.get("/api/master/auditoria/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        descricoes = [r["descricao"] for r in resposta.data["results"]]
        self.assertIn("Login de teste — escritório A", descricoes)
        self.assertIn("Login de teste — escritório B", descricoes)

    def test_tenant_nao_acessa_auditoria_master(self):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.get("/api/master/auditoria/")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)
