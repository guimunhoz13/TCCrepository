import csv
import io
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch
import urllib.error

from django.contrib.auth.hashers import check_password, make_password
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings

from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from django.utils import timezone

from .feriados import calcular_prazo, eh_dia_util, feriados_nacionais
from .modelos_documento import montar_contexto, preencher
from .datajud import ErroDataJud, alias_do_tribunal, interpretar_resposta, partes_do_numero
from .models import (
    Escritorio,
    Usuario,
    Cliente,
    Advogado,
    Processo,
    Documento,
    Movimentacao,
    Agenda,
    Contrato,
    Parcela,
    ApontamentoHora,
    Despesa,
    Tarefa,
    SessaoUso,
    ModeloDocumento,
    JANELA_SESSAO_MINUTOS,
    SuperAdmin,
    NotificacaoEnviada,
    PreferenciasUsuario,
    RegistroAuditoria,
    TokenRedefinicaoSenha,
    TokenVerificacaoEmail,
)
from .validators import (
    validar_assinatura_arquivo,
    validar_email_real,
    validar_tamanho_documento,
    validar_tamanho_imagem,
)
from .views import SolicitarRedefinicaoSenhaView


def _criar_escritorio(**overrides):
    dados = {
        "nome": "Escritorio Teste & Associados",
        "cnpj": "12345678000199",
        "email": "contato@escritorio.com",
        "telefone": "11999999999",
        "endereco": "Rua Teste, 100",
    }
    dados.update(overrides)
    return Escritorio.objects.create(**dados)


def _criar_usuario(escritorio, **overrides):
    dados = {
        "escritorio": escritorio,
        "nome": "Ana Admin",
        "email": "ana@escritorio.com",
        "senha": make_password("senha12345"),
        "tipo_usuario": "admin",
    }
    dados.update(overrides)
    return Usuario.objects.create(**dados)


def _gerar_token_de_acesso(usuario):
    """Gera um access token JWT com as mesmas claims usadas pelo LoginView."""
    refresh = RefreshToken()
    refresh["user_id"] = usuario.id
    refresh["nome"] = usuario.nome
    refresh["email"] = usuario.email
    refresh["tipo_usuario"] = usuario.tipo_usuario
    refresh["escritorio_id"] = usuario.escritorio_id
    refresh["escritorio_nome"] = usuario.escritorio.nome
    refresh["session_version"] = usuario.session_version
    return str(refresh.access_token)


def _gerar_refresh_token(usuario):
    """Gera o refresh token com as mesmas claims do LoginView."""
    refresh = RefreshToken()
    refresh["user_id"] = usuario.id
    refresh["nome"] = usuario.nome
    refresh["email"] = usuario.email
    refresh["tipo_usuario"] = usuario.tipo_usuario
    refresh["escritorio_id"] = usuario.escritorio_id
    refresh["escritorio_nome"] = usuario.escritorio.nome
    refresh["session_version"] = usuario.session_version
    return str(refresh)


def _gerar_token_master(superadmin):
    """Gera um access token JWT com as mesmas claims usadas pelo MasterLoginView."""
    refresh = RefreshToken()
    refresh["user_id"] = f"master-{superadmin.id}"
    refresh["is_master"] = True
    refresh["superadmin_id"] = superadmin.id
    refresh["nome"] = superadmin.nome
    refresh["email"] = superadmin.email
    return str(refresh.access_token)


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
class LoginAPITestCase(APITestCase):
    """Testa o fluxo de autenticação via /api/login/."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)

    def test_login_com_credenciais_corretas_retorna_tokens(self, _mock_mx):
        resposta = self.client.post(
            "/api/login/",
            {"email": "ana@escritorio.com", "senha": "senha12345"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertIn("access", resposta.data)
        self.assertIn("refresh", resposta.data)
        self.assertEqual(resposta.data["usuario"]["nome"], "Ana Admin")

    def test_login_com_senha_incorreta_e_negado(self, _mock_mx):
        resposta = self.client.post(
            "/api/login/",
            {"email": "ana@escritorio.com", "senha": "senha-errada"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_com_usuario_inexistente_e_negado(self, _mock_mx):
        resposta = self.client.post(
            "/api/login/",
            {"email": "ninguem@escritorio.com", "senha": "qualquer"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_de_usuario_desativado_e_negado(self, _mock_mx):
        _criar_usuario(
            self.escritorio,
            nome="Inativo",
            email="inativo@escritorio.com",
            ativo=False,
        )
        resposta = self.client.post(
            "/api/login/",
            {"email": "inativo@escritorio.com", "senha": "senha12345"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)


class RenovacaoDeTokenAPITestCase(APITestCase):
    """Testa /api/token/refresh/: sem essa renovação, o access token (que
    dura poucos minutos) expira no meio do uso do sistema e toda chamada
    à API passa a falhar com "Given token not valid for any token type"
    até o usuário logar de novo — o frontend agora chama esse endpoint
    automaticamente quando recebe 401 (ver services/api.js)."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)

    def test_refresh_token_gera_um_access_token_valido(self):
        login = self.client.post(
            "/api/login/",
            {"email": "ana@escritorio.com", "senha": "senha12345"},
            format="json",
        )
        refresh_token = login.data["refresh"]

        resposta = self.client.post(
            "/api/token/refresh/",
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertIn("access", resposta.data)

        novo_access = resposta.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {novo_access}")
        resposta_protegida = self.client.get("/api/clientes/")
        self.assertEqual(resposta_protegida.status_code, status.HTTP_200_OK)

    def test_refresh_token_invalido_e_rejeitado(self):
        resposta = self.client.post(
            "/api/token/refresh/",
            {"refresh": "token-invalido"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_token_renovado_preserva_as_claims_do_usuario(self):
        login = self.client.post(
            "/api/login/",
            {"email": "ana@escritorio.com", "senha": "senha12345"},
            format="json",
        )
        refresh_token = login.data["refresh"]

        resposta = self.client.post(
            "/api/token/refresh/",
            {"refresh": refresh_token},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resposta.data['access']}")

        # Só um usuário do próprio escritório aparece — prova que o novo
        # access token carrega a claim escritorio_id corretamente.
        outro_escritorio = _criar_escritorio(
            nome="Outro Escritório", cnpj="99999999000199", email="outro@teste.com"
        )
        Cliente.objects.create(
            escritorio=outro_escritorio,
            nome="Cliente de outro escritório",
            cpf="12312312312",
            email="x@teste.com",
            telefone="11955555555",
            endereco="Rua X",
        )
        resposta_clientes = self.client.get("/api/clientes/")
        self.assertEqual(resposta_clientes.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta_clientes.data["count"], 0)


class LogoutAPITestCase(APITestCase):
    """Testa /api/logout/: sem revogar o refresh token, "sair" só apagava
    os tokens do navegador — uma cópia do refresh token (notebook
    compartilhado, XSS) continuava válida por até 7 dias mesmo depois do
    usuário ter clicado em "Sair"."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)
        self.superadmin = SuperAdmin.objects.create(
            nome="Dev Master",
            email="dev.logout@lexoffice.com",
            senha=make_password("senha-master-123"),
        )

    def test_logout_revoga_o_refresh_token(self):
        login = self.client.post(
            "/api/login/",
            {"email": "ana@escritorio.com", "senha": "senha12345"},
            format="json",
        )
        refresh_token = login.data["refresh"]

        resposta = self.client.post(
            "/api/logout/", {"refresh": refresh_token}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

        # O refresh token revogado não pode mais ser usado pra renovar o
        # access token — é exatamente esse o objetivo do logout de verdade.
        tentativa_renovacao = self.client.post(
            "/api/token/refresh/", {"refresh": refresh_token}, format="json"
        )
        self.assertEqual(tentativa_renovacao.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_gera_registro_de_auditoria(self):
        login = self.client.post(
            "/api/login/",
            {"email": "ana@escritorio.com", "senha": "senha12345"},
            format="json",
        )
        self.client.post("/api/logout/", {"refresh": login.data["refresh"]}, format="json")

        registro = RegistroAuditoria.objects.filter(acao="logout").latest("id")
        self.assertEqual(registro.usuario, self.usuario)
        self.assertEqual(registro.escritorio, self.escritorio)

    def test_logout_do_painel_mestre_revoga_o_refresh_token(self):
        login = self.client.post(
            "/api/master/login/",
            {"email": "dev.logout@lexoffice.com", "senha": "senha-master-123"},
            format="json",
        )
        refresh_token = login.data["refresh"]

        resposta = self.client.post(
            "/api/logout/", {"refresh": refresh_token}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

        tentativa_renovacao = self.client.post(
            "/api/token/refresh/", {"refresh": refresh_token}, format="json"
        )
        self.assertEqual(tentativa_renovacao.status_code, status.HTTP_401_UNAUTHORIZED)

        registro = RegistroAuditoria.objects.filter(acao="logout", superadmin=self.superadmin).latest("id")
        self.assertIsNotNone(registro)

    def test_logout_sem_refresh_token_e_rejeitado(self):
        resposta = self.client.post("/api/logout/", {}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_com_token_ja_invalido_nao_gera_erro(self):
        resposta = self.client.post(
            "/api/logout/", {"refresh": "token-invalido"}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

    def test_access_token_emitido_antes_do_logout_continua_valido_ate_expirar(self):
        """Limitação conhecida e documentada: a blacklist só afeta o
        refresh token. Um access token já emitido continua funcionando até
        expirar naturalmente (até 30 min) porque a autenticação é
        stateless e não consulta a blacklist a cada requisição."""
        login = self.client.post(
            "/api/login/",
            {"email": "ana@escritorio.com", "senha": "senha12345"},
            format="json",
        )
        access_token = login.data["access"]

        self.client.post("/api/logout/", {"refresh": login.data["refresh"]}, format="json")

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        resposta = self.client.get("/api/clientes/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)


class ValidacaoDeSenhaAPITestCase(APITestCase):
    """
    TDD — testes escritos a partir dos requisitos de senha forte pedidos
    na atividade:

      1) mínimo de 8 caracteres
      2) pelo menos uma letra maiúscula
      3) pelo menos um número
      4) pelo menos um caractere especial

    Alvo: ConfiguracoesSenhaView (POST /api/configuracoes/senha/), a
    função responsável por definir/alterar a senha de um usuário já
    autenticado (o caminho de troca de senha da autenticação). As 3
    checagens que faltavam (fase "red", ver relatorio-tdd-ia.md para a
    execução original com as falhas reais capturadas) foram implementadas
    em validators.validar_senha_forte — fase "green" do TDD.
    """

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.usuario)}"
        )

    def _tentar_trocar_senha(self, nova_senha):
        return self.client.post(
            "/api/configuracoes/senha/",
            {
                "senha_atual": "senha12345",
                "nova_senha": nova_senha,
                "confirmar_senha": nova_senha,
            },
            format="json",
        )

    def test_senha_com_menos_de_8_caracteres_e_rejeitada(self):
        resposta = self._tentar_trocar_senha("Ab1!ab")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_senha_sem_letra_maiuscula_e_rejeitada(self):
        resposta = self._tentar_trocar_senha("abcdefg1!")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_senha_sem_numero_e_rejeitada(self):
        resposta = self._tentar_trocar_senha("Abcdefgh!")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_senha_sem_caractere_especial_e_rejeitada(self):
        resposta = self._tentar_trocar_senha("Abcdefg1")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_senha_que_atende_todos_os_requisitos_e_aceita(self):
        resposta = self._tentar_trocar_senha("Abcdefg1!")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)


@patch("advocacia.validators._dominio_tem_mx", return_value=True)
class ClientesAPITestCase(APITestCase):
    """Testa o CRUD de clientes e o isolamento multi-tenant por escritório."""

    def setUp(self):
        self.escritorio_a = _criar_escritorio(
            nome="Escritorio A", cnpj="11111111000111", email="a@teste.com",
        )
        self.escritorio_b = _criar_escritorio(
            nome="Escritorio B", cnpj="22222222000122", email="b@teste.com",
        )
        self.admin_a = _criar_usuario(
            self.escritorio_a, nome="Admin A", email="admin.a@teste.com",
        )
        self.admin_b = _criar_usuario(
            self.escritorio_b, nome="Admin B", email="admin.b@teste.com",
        )
        self.cliente_a = Cliente.objects.create(
            escritorio=self.escritorio_a,
            nome="Cliente A",
            cpf="11122233344",
            email="cliente.a@teste.com",
            telefone="11988887777",
            endereco="Rua Cliente A",
        )

    def test_listar_clientes_sem_autenticacao_e_negado(self, _mock_mx):
        resposta = self.client.get("/api/clientes/")
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_cliente_autenticado(self, _mock_mx):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.post(
            "/api/clientes/",
            {
                "nome": "Novo Cliente",
                "cpf": "55566677788",
                "email": "novo@gmail.com",
                "telefone": "11977776666",
                "endereco": "Rua Nova, 10",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Cliente.objects.filter(escritorio=self.escritorio_a).count(), 2
        )

    def test_criar_cliente_com_cpf_duplicado_retorna_erro_especifico(self, _mock_mx):
        """Antes, um CPF duplicado (unique_together com escritorio, campo
        que não está no serializer) derrubava um IntegrityError não tratado
        (500 genérico). Agora deve voltar um 400 claro, no campo "cpf"."""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.post(
            "/api/clientes/",
            {
                "nome": "Outro Cliente",
                "cpf": "11122233344",  # mesmo CPF do cliente_a
                "email": "outro@gmail.com",
                "telefone": "11977776666",
                "endereco": "Rua Nova, 10",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cpf", resposta.data)

    def test_editar_cliente_para_cpf_de_outro_retorna_erro_especifico(self, _mock_mx):
        outro_cliente = Cliente.objects.create(
            escritorio=self.escritorio_a,
            nome="Cliente C",
            cpf="99988877766",
            email="cliente.c@teste.com",
            telefone="11988887779",
            endereco="Rua Cliente C",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.patch(
            f"/api/clientes/{outro_cliente.id}/",
            {"cpf": self.cliente_a.cpf},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cpf", resposta.data)

    def test_isolamento_multi_tenant_entre_escritorios(self, _mock_mx):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_b)}"
        )
        resposta = self.client.get("/api/clientes/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        nomes = [cliente["nome"] for cliente in resposta.data["results"]]
        self.assertNotIn("Cliente A", nomes)
        self.assertEqual(len(resposta.data["results"]), 0)

    def test_criar_cliente_pessoa_juridica_com_cnpj(self, _mock_mx):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.post(
            "/api/clientes/",
            {
                "tipo_pessoa": "juridica",
                "nome": "Empresa Cliente Ltda",
                "cnpj": "12345678000199",
                "email": "empresa@teste.com",
                "telefone": "11977776666",
                "endereco": "Av. Empresarial, 500",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["tipo_pessoa"], "juridica")
        self.assertEqual(resposta.data["cnpj"], "12345678000199")
        self.assertEqual(resposta.data["cpf"], "")

    def test_criar_cliente_com_cnpj_duplicado_retorna_erro_especifico(self, _mock_mx):
        Cliente.objects.create(
            escritorio=self.escritorio_a,
            tipo_pessoa="juridica",
            nome="Empresa Existente",
            cnpj="99988877000166",
            email="existente@teste.com",
            telefone="11988887779",
            endereco="Rua Empresa",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.post(
            "/api/clientes/",
            {
                "tipo_pessoa": "juridica",
                "nome": "Outra Empresa",
                "cnpj": "99988877000166",  # mesmo CNPJ
                "email": "outra@teste.com",
                "telefone": "11977776666",
                "endereco": "Rua Nova, 10",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cnpj", resposta.data)

    def test_dois_clientes_pessoa_juridica_sem_cpf_nao_colidem(self, _mock_mx):
        """cpf="" para dois clientes PJ no mesmo escritório não pode ser
        tratado como CPF duplicado — só o unique_together antigo faria isso,
        por isso virou um UniqueConstraint condicional (cpf != "")."""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        for indice in range(2):
            resposta = self.client.post(
                "/api/clientes/",
                {
                    "tipo_pessoa": "juridica",
                    "nome": f"Empresa {indice}",
                    "cnpj": f"1111111100010{indice}",
                    "email": f"empresa{indice}@teste.com",
                    "telefone": "11977776666",
                    "endereco": "Rua Empresarial",
                },
                format="json",
            )
            self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)

    def test_dois_clientes_pessoa_fisica_sem_cnpj_nao_colidem(self, _mock_mx):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        for indice in range(2):
            resposta = self.client.post(
                "/api/clientes/",
                {
                    "nome": f"Pessoa {indice}",
                    "cpf": f"1234567890{indice}",
                    "email": f"pessoa{indice}@teste.com",
                    "telefone": "11977776666",
                    "endereco": "Rua Pessoal",
                },
                format="json",
            )
            self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)

    def test_admin_ve_apenas_clientes_do_proprio_escritorio(self, _mock_mx):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.get("/api/clientes/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        nomes = [cliente["nome"] for cliente in resposta.data["results"]]
        self.assertEqual(nomes, ["Cliente A"])


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


class ProcessosAPITestCase(APITestCase):
    """Testa o CRUD de processos, incluindo o erro de número duplicado."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Processo",
            cpf="22233344455",
            email="cliente.processo@teste.com",
            telefone="11988887777",
            endereco="Rua Cliente, 1",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Processo",
            email="advogado.processo@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="111111/SP",
            especialidade="Civil",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def _payload_valido(self, **overrides):
        dados = {
            "numero_processo": "PROC-0001",
            "titulo": "Processo Teste",
            "descricao": "Descrição do processo.",
            "status": "Em andamento",
            "cliente": self.cliente.id,
            "advogado": self.advogado.id,
        }
        dados.update(overrides)
        return dados

    def test_criar_processo(self):
        resposta = self.client.post("/api/processos/", self._payload_valido(), format="json")
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)

    def test_criar_processo_com_numero_duplicado_retorna_erro_especifico(self):
        """Antes, o número duplicado (unique_together com escritorio, campo
        que não está no serializer) derrubava um IntegrityError não tratado
        (500 genérico). Agora deve voltar um 400 claro, no campo
        "numero_processo"."""
        Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-0001",
            titulo="Processo Original",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        resposta = self.client.post("/api/processos/", self._payload_valido(), format="json")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("numero_processo", resposta.data)

    def test_editar_processo_para_numero_de_outro_retorna_erro_especifico(self):
        Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-0001",
            titulo="Processo Original",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        outro = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-0002",
            titulo="Processo Dois",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        resposta = self.client.patch(
            f"/api/processos/{outro.id}/",
            {"numero_processo": "PROC-0001"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("numero_processo", resposta.data)

    def test_criar_processo_com_dados_juridicos_adicionais(self):
        resposta = self.client.post(
            "/api/processos/",
            self._payload_valido(
                area_direito="trabalhista",
                vara="3ª Vara do Trabalho",
                comarca="Araçatuba",
                valor_causa="50000.00",
                nome_parte_contraria="Empresa Ré Ltda",
                nome_advogado_adverso="Dr. Advogado Adverso",
                oab_advogado_adverso="654321/SP",
                percentual_honorarios_sucumbencia="15.00",
            ),
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["area_direito"], "trabalhista")
        self.assertEqual(resposta.data["vara"], "3ª Vara do Trabalho")
        self.assertEqual(resposta.data["nome_parte_contraria"], "Empresa Ré Ltda")
        self.assertEqual(resposta.data["valor_estimado_honorarios_sucumbencia"], "7500.00")

    def test_processo_sem_dados_juridicos_adicionais_tem_estimativa_nula(self):
        resposta = self.client.post("/api/processos/", self._payload_valido(), format="json")
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(resposta.data["valor_estimado_honorarios_sucumbencia"])

    def test_valor_da_causa_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/processos/",
            self._payload_valido(valor_causa="0.00"),
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("valor_causa", resposta.data)

    def test_percentual_honorarios_sucumbencia_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/processos/",
            self._payload_valido(percentual_honorarios_sucumbencia="0"),
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("percentual_honorarios_sucumbencia", resposta.data)


class CalculoDePrazoTestCase(TestCase):
    """Testa o cálculo de prazo em dias úteis/corridos (advocacia/feriados.py),
    incluindo os feriados nacionais móveis (baseados na Páscoa)."""

    def test_pascoa_bate_com_datas_conhecidas(self):
        from advocacia.feriados import _pascoa
        self.assertEqual(_pascoa(2024), date(2024, 3, 31))
        self.assertEqual(_pascoa(2025), date(2025, 4, 20))
        self.assertEqual(_pascoa(2026), date(2026, 4, 5))

    def test_feriados_nacionais_inclui_fixos_e_moveis(self):
        feriados = feriados_nacionais(2026)
        self.assertIn(date(2026, 1, 1), feriados)  # Confraternização
        self.assertIn(date(2026, 4, 21), feriados)  # Tiradentes
        self.assertIn(date(2026, 12, 25), feriados)  # Natal
        self.assertIn(date(2026, 4, 3), feriados)  # Sexta-feira Santa (Páscoa - 2)

    def test_eh_dia_util_rejeita_fim_de_semana_e_feriado(self):
        self.assertFalse(eh_dia_util(date(2026, 12, 25)))  # sexta, Natal
        self.assertFalse(eh_dia_util(date(2026, 12, 26)))  # sábado
        self.assertFalse(eh_dia_util(date(2026, 12, 27)))  # domingo
        self.assertTrue(eh_dia_util(date(2026, 12, 28)))  # segunda, útil

    def test_calcular_prazo_em_dias_uteis_pula_feriado_e_fim_de_semana(self):
        # 22/12/2026 é terça-feira; contando 5 dias úteis, pula o Natal
        # (25/12, sexta) e o fim de semana seguinte (26 e 27/12).
        inicio = date(2026, 12, 22)
        final = calcular_prazo(inicio, 5, dias_uteis=True)
        self.assertEqual(final, date(2026, 12, 30))

    def test_calcular_prazo_em_dias_corridos_conta_todos_os_dias(self):
        inicio = date(2026, 12, 22)
        final = calcular_prazo(inicio, 5, dias_uteis=False)
        self.assertEqual(final, date(2026, 12, 27))


class CalcularPrazoAPITestCase(APITestCase):
    """Testa /api/agenda/calcular-prazo/, usado para preencher o prazo na
    agenda a partir de uma data de início e uma quantidade de dias."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_calcula_prazo_em_dias_uteis(self):
        resposta = self.client.post(
            "/api/agenda/calcular-prazo/",
            {"data_inicio": "2026-12-22", "dias": 5, "dias_uteis": True},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["data_final"], "2026-12-30")

    def test_calcula_prazo_em_dias_corridos(self):
        resposta = self.client.post(
            "/api/agenda/calcular-prazo/",
            {"data_inicio": "2026-12-22", "dias": 5, "dias_uteis": False},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["data_final"], "2026-12-27")

    def test_sem_dados_e_rejeitado(self):
        resposta = self.client.post("/api/agenda/calcular-prazo/", {}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_dias_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/agenda/calcular-prazo/",
            {"data_inicio": "2026-12-22", "dias": 0},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_sem_autenticacao_e_negado(self):
        self.client.credentials()
        resposta = self.client.post(
            "/api/agenda/calcular-prazo/",
            {"data_inicio": "2026-12-22", "dias": 5},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)


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


class LoginBloqueioAPITestCase(APITestCase):
    """Testa o bloqueio de login após 3 tentativas de senha inválidas."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)

    def _tentar_login(self, senha):
        return self.client.post(
            "/api/login/",
            {"email": "ana@escritorio.com", "senha": senha},
            format="json",
        )

    def test_bloqueia_apos_3_tentativas_erradas(self):
        for _ in range(2):
            resposta = self._tentar_login("senha-errada")
            self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

        resposta = self._tentar_login("senha-errada")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

        self.usuario.refresh_from_db()
        self.assertIsNotNone(self.usuario.bloqueado_ate)
        self.assertEqual(self.usuario.tentativas_login, 0)

    def test_tentativa_errada_isolada_nao_bloqueia(self):
        resposta = self._tentar_login("senha-errada")
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

        self.usuario.refresh_from_db()
        self.assertEqual(self.usuario.tentativas_login, 1)
        self.assertIsNone(self.usuario.bloqueado_ate)

    def test_login_correto_e_negado_enquanto_bloqueado(self):
        self.usuario.bloqueado_ate = timezone.now() + timezone.timedelta(minutes=15)
        self.usuario.save()

        resposta = self._tentar_login("senha12345")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_correto_funciona_apos_bloqueio_expirar(self):
        self.usuario.bloqueado_ate = timezone.now() - timezone.timedelta(minutes=1)
        self.usuario.tentativas_login = 2
        self.usuario.save()

        resposta = self._tentar_login("senha12345")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

        self.usuario.refresh_from_db()
        self.assertIsNone(self.usuario.bloqueado_ate)
        self.assertEqual(self.usuario.tentativas_login, 0)


class FiltroBuscaAPITestCase(APITestCase):
    """Testa os filtros de busca em clientes e processos."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

        self.cliente_joao = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="João Silva",
            cpf="11111111111",
            email="joao@teste.com",
            telefone="11999999999",
            endereco="Rua A",
        )
        self.cliente_maria = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Maria Souza",
            cpf="22222222222",
            email="maria@teste.com",
            telefone="11888888888",
            endereco="Rua B",
        )

        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Filtro",
            email="advogado.filtro@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="333333/SP",
            especialidade="Civil",
        )

        self.processo_andamento = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-0001",
            titulo="Ação de Cobrança",
            descricao="Descrição.",
            status="Em andamento",
            cliente=self.cliente_joao,
            advogado=self.advogado,
        )
        self.processo_concluido = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-0002",
            titulo="Ação Trabalhista",
            descricao="Descrição.",
            status="Concluido",
            cliente=self.cliente_maria,
            advogado=self.advogado,
        )

    def test_busca_clientes_por_nome(self):
        resposta = self.client.get("/api/clientes/", {"busca": "João"})
        nomes = [c["nome"] for c in resposta.data["results"]]
        self.assertIn("João Silva", nomes)
        self.assertNotIn("Maria Souza", nomes)

    def test_busca_clientes_sem_correspondencia_retorna_vazio(self):
        resposta = self.client.get("/api/clientes/", {"busca": "Inexistente"})
        self.assertEqual(len(resposta.data["results"]), 0)

    def test_filtro_processos_por_status(self):
        resposta = self.client.get("/api/processos/", {"status": "Concluido"})
        numeros = [p["numero_processo"] for p in resposta.data["results"]]
        self.assertEqual(numeros, ["PROC-0002"])

    def test_filtro_processos_por_cliente(self):
        resposta = self.client.get("/api/processos/", {"cliente": self.cliente_joao.id})
        numeros = [p["numero_processo"] for p in resposta.data["results"]]
        self.assertEqual(numeros, ["PROC-0001"])

    def test_busca_processos_por_titulo(self):
        resposta = self.client.get("/api/processos/", {"busca": "Trabalhista"})
        numeros = [p["numero_processo"] for p in resposta.data["results"]]
        self.assertEqual(numeros, ["PROC-0002"])


class AgendaPrazoAPITestCase(APITestCase):
    """Testa o tipo Prazo/Compromisso, o cálculo de atraso e os filtros da agenda."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Agenda",
            cpf="33333333333",
            email="cliente.agenda@teste.com",
            telefone="11977777777",
            endereco="Rua C",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Agenda",
            email="advogado.agenda@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="444444/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-AG-1",
            titulo="Processo Agenda",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_criar_prazo_atrasado_e_sinalizado(self):
        resposta = self.client.post(
            "/api/agenda/",
            {
                "processo": self.processo.id,
                "tipo": "prazo",
                "titulo": "Prazo recursal",
                "descricao": "Descrição.",
                "data_evento": "2020-01-01T10:00:00Z",
                "local_evento": "",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["tipo"], "prazo")
        self.assertTrue(resposta.data["atrasado"])
        self.assertEqual(resposta.data["prioridade"], "normal")

    def test_criar_prazo_fatal(self):
        resposta = self.client.post(
            "/api/agenda/",
            {
                "processo": self.processo.id,
                "tipo": "prazo",
                "prioridade": "fatal",
                "titulo": "Prazo fatal recursal",
                "descricao": "Descrição.",
                "data_evento": "2030-01-01T10:00:00Z",
                "local_evento": "",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["prioridade"], "fatal")

    def test_prazo_cumprido_nao_e_sinalizado_como_atrasado(self):
        evento = Agenda.objects.create(
            processo=self.processo,
            tipo="prazo",
            titulo="Prazo cumprido",
            descricao="Descrição.",
            data_evento=timezone.now() - timezone.timedelta(days=1),
            cumprido=True,
        )
        resposta = self.client.get(f"/api/agenda/{evento.id}/")
        self.assertFalse(resposta.data["atrasado"])

    def test_marcar_evento_como_cumprido(self):
        evento = Agenda.objects.create(
            processo=self.processo,
            tipo="compromisso",
            titulo="Audiência",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
        )
        resposta = self.client.patch(
            f"/api/agenda/{evento.id}/", {"cumprido": True}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        evento.refresh_from_db()
        self.assertTrue(evento.cumprido)

    def test_filtro_agenda_por_tipo(self):
        Agenda.objects.create(
            processo=self.processo,
            tipo="compromisso",
            titulo="Reunião",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
        )
        Agenda.objects.create(
            processo=self.processo,
            tipo="prazo",
            titulo="Prazo X",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=2),
        )
        resposta = self.client.get("/api/agenda/", {"tipo": "prazo"})
        self.assertEqual(len(resposta.data["results"]), 1)
        self.assertEqual(resposta.data["results"][0]["titulo"], "Prazo X")

    def test_criar_compromisso_sem_processo(self):
        resposta = self.client.post(
            "/api/agenda/",
            {
                "tipo": "compromisso",
                "titulo": "Reunião interna",
                "descricao": "Descrição.",
                "data_evento": "2030-01-01T10:00:00Z",
                "local_evento": "",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(resposta.data["processo"])
        self.assertIsNone(resposta.data["numero_processo"])
        self.assertIsNone(resposta.data["cliente_nome"])

    def test_compromisso_sem_processo_e_gravado_no_escritorio_de_quem_criou(self):
        Agenda.objects.create(
            escritorio=self.escritorio,
            tipo="compromisso",
            titulo="Reunião sem processo",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
        )
        resposta = self.client.get("/api/agenda/")
        titulos = [item["titulo"] for item in resposta.data["results"]]
        self.assertIn("Reunião sem processo", titulos)

    def test_compromisso_sem_processo_de_outro_escritorio_fica_isolado(self):
        outro_escritorio = _criar_escritorio(nome="Outro Escritório Agenda", cnpj="22222222000122")
        Agenda.objects.create(
            escritorio=outro_escritorio,
            tipo="compromisso",
            titulo="Reunião de outro escritório",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
        )
        resposta = self.client.get("/api/agenda/")
        titulos = [item["titulo"] for item in resposta.data["results"]]
        self.assertNotIn("Reunião de outro escritório", titulos)

    def test_editar_titulo_e_reagendar_data_do_evento(self):
        evento = Agenda.objects.create(
            processo=self.processo,
            tipo="compromisso",
            titulo="Audiência",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
        )
        nova_data = "2031-05-20T14:30:00Z"
        resposta = self.client.patch(
            f"/api/agenda/{evento.id}/",
            {"titulo": "Audiência remarcada", "data_evento": nova_data},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        evento.refresh_from_db()
        self.assertEqual(evento.titulo, "Audiência remarcada")
        self.assertEqual(evento.data_evento.isoformat(), "2031-05-20T14:30:00+00:00")

    def test_reabrir_evento_marcado_como_cumprido(self):
        evento = Agenda.objects.create(
            processo=self.processo,
            tipo="compromisso",
            titulo="Audiência",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
            cumprido=True,
        )
        resposta = self.client.patch(
            f"/api/agenda/{evento.id}/", {"cumprido": False}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        evento.refresh_from_db()
        self.assertFalse(evento.cumprido)

    def test_remover_vinculo_de_processo_de_um_evento_existente(self):
        evento = Agenda.objects.create(
            processo=self.processo,
            tipo="compromisso",
            titulo="Audiência",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
        )
        resposta = self.client.patch(
            f"/api/agenda/{evento.id}/", {"processo": None}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        evento.refresh_from_db()
        self.assertIsNone(evento.processo)
        self.assertEqual(evento.escritorio_id, self.escritorio.id)


class ContratoHonorarioAPITestCase(APITestCase):
    """Testa a criação de contratos e a geração automática de parcelas."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Contrato",
            cpf="44444444444",
            email="cliente.contrato@teste.com",
            telefone="11966666666",
            endereco="Rua D",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Contrato",
            email="advogado.contrato@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="555555/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-CT-1",
            titulo="Processo Contrato",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_contrato_a_vista_gera_uma_unica_parcela(self):
        resposta = self.client.post(
            "/api/contratos/",
            {
                "processo": self.processo.id,
                "tipo_honorario": "fixo",
                "valor_total": "1500.00",
                "forma_pagamento": "avista",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(resposta.data["parcelas"]), 1)
        self.assertEqual(resposta.data["parcelas"][0]["valor"], "1500.00")

    def test_contrato_parcelado_divide_o_valor_total_sem_perder_centavos(self):
        resposta = self.client.post(
            "/api/contratos/",
            {
                "processo": self.processo.id,
                "tipo_honorario": "fixo",
                "valor_total": "1000.00",
                "forma_pagamento": "parcelado",
                "numero_parcelas": 3,
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        parcelas = resposta.data["parcelas"]
        self.assertEqual(len(parcelas), 3)
        soma = sum(float(p["valor"]) for p in parcelas)
        self.assertAlmostEqual(soma, 1000.00, places=2)

    def test_marcar_parcela_como_paga_atualiza_status_e_data(self):
        contrato = Contrato.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo_honorario="fixo",
            valor_total=500,
            forma_pagamento="avista",
        )
        parcela = contrato.parcelas.create(
            numero=1, valor=500, data_vencimento=timezone.now().date()
        )
        resposta = self.client.patch(
            f"/api/parcelas/{parcela.id}/", {"status": "pago"}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(resposta.data["pago_em"])
        parcela.refresh_from_db()
        self.assertEqual(parcela.status, "pago")

    def test_nao_e_possivel_criar_dois_contratos_para_o_mesmo_processo(self):
        Contrato.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo_honorario="fixo",
            valor_total=500,
            forma_pagamento="avista",
        )
        resposta = self.client.post(
            "/api/contratos/",
            {
                "processo": self.processo.id,
                "tipo_honorario": "fixo",
                "valor_total": "300.00",
                "forma_pagamento": "avista",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)


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
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resposta.data["results"]), 0)


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


class ContratoValorMinimoAPITestCase(APITestCase):
    """Testa que valores não positivos em Contrato/Parcela são rejeitados."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Valor",
            cpf="66666666666",
            email="cliente.valor@teste.com",
            telefone="11966666677",
            endereco="Rua F",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Valor",
            email="advogado.valor@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="666666/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-VAL-1",
            titulo="Processo Valor",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_contrato_com_valor_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/contratos/",
            {
                "processo": self.processo.id,
                "tipo_honorario": "fixo",
                "valor_total": "0.00",
                "forma_pagamento": "avista",
                "numero_parcelas": 1,
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("valor_total", resposta.data)

    def test_contrato_com_numero_de_parcelas_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/contratos/",
            {
                "processo": self.processo.id,
                "tipo_honorario": "fixo",
                "valor_total": "1000.00",
                "forma_pagamento": "parcelado",
                "numero_parcelas": 0,
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("numero_parcelas", resposta.data)


class MovimentacaoCriadoPorAPITestCase(APITestCase):
    """Testa que uma movimentação registra quem a criou."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Mov",
            cpf="77777777777",
            email="cliente.mov@teste.com",
            telefone="11966666688",
            endereco="Rua G",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Mov",
            email="advogado.mov@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="777777/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-MOV-1",
            titulo="Processo Movimentação",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_movimentacao_registra_o_usuario_que_criou(self):
        resposta = self.client.post(
            "/api/movimentacoes/",
            {"processo": self.processo.id, "descricao": "Petição protocolada."},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["criado_por_nome"], "Ana Admin")

        movimentacao = Movimentacao.objects.get(id=resposta.data["id"])
        self.assertEqual(movimentacao.criado_por, self.admin)


class MovimentacaoManualAPITestCase(APITestCase):
    """A ficha do processo só tinha andamento vindo do DataJud — não havia
    como lançar à mão nem apagar o que foi lançado errado. Cobre as duas
    pontas, e a regra que protege o histórico oficial: só o que foi
    lançado manualmente pode ser excluído."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio, nome="Cliente Mov Manual", cpf="66677788899",
            email="cliente.movmanual@teste.com", telefone="11955554444", endereco="Rua H",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio, nome="Advogado Mov Manual",
            email="advogado.movmanual@teste.com", senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio, usuario=usuario_advogado, oab="888888/SP", especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio, numero_processo="PROC-MOV-MANUAL-1",
            titulo="Processo Movimentação Manual", descricao="Descrição.",
            cliente=self.cliente, advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_movimentacao_criada_pela_api_nasce_com_origem_manual(self):
        resposta = self.client.post(
            "/api/movimentacoes/",
            {"processo": self.processo.id, "descricao": "Cliente enviou novos documentos."},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["origem"], "manual")

    def test_exclui_movimentacao_lancada_manualmente(self):
        movimentacao = Movimentacao.objects.create(
            processo=self.processo, criado_por=self.admin, descricao="Lançamento por engano.",
        )
        resposta = self.client.delete(f"/api/movimentacoes/{movimentacao.id}/")
        self.assertEqual(resposta.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Movimentacao.objects.filter(id=movimentacao.id).exists())

    def test_nao_exclui_movimentacao_importada_do_datajud(self):
        movimentacao = Movimentacao.objects.create(
            processo=self.processo, descricao="Juntada de petição.",
            origem="datajud", identificador_externo="mov-datajud-1",
        )
        resposta = self.client.delete(f"/api/movimentacoes/{movimentacao.id}/")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Movimentacao.objects.filter(id=movimentacao.id).exists())


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


class RedefinicaoSenhaAPITestCase(APITestCase):
    """Testa o fluxo de "esqueci minha senha"."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)

    def test_solicitar_com_email_existente_cria_token_e_retorna_generico(self):
        resposta = self.client.post(
            "/api/login/esqueci-senha/",
            {"email": "ana@escritorio.com"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertTrue(TokenRedefinicaoSenha.objects.filter(usuario=self.usuario).exists())

    def test_solicitar_com_email_inexistente_retorna_a_mesma_resposta_generica(self):
        resposta_existente = self.client.post(
            "/api/login/esqueci-senha/",
            {"email": "ana@escritorio.com"},
            format="json",
        )
        resposta_inexistente = self.client.post(
            "/api/login/esqueci-senha/",
            {"email": "nao-existe@teste.com"},
            format="json",
        )
        self.assertEqual(resposta_existente.status_code, resposta_inexistente.status_code)
        self.assertEqual(resposta_existente.data, resposta_inexistente.data)

    def test_redefinir_com_token_valido_altera_a_senha(self):
        token = TokenRedefinicaoSenha.objects.create(
            usuario=self.usuario,
            token="token-valido-123",
            expira_em=timezone.now() + timezone.timedelta(hours=1),
        )
        resposta = self.client.post(
            "/api/login/redefinir-senha/",
            {
                "token": token.token,
                "nova_senha": "NovaSenha@123",
                "confirmar_senha": "NovaSenha@123",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

        self.usuario.refresh_from_db()
        self.assertTrue(check_password("NovaSenha@123", self.usuario.senha))

        token.refresh_from_db()
        self.assertTrue(token.usado)

    def test_redefinir_com_token_ja_usado_e_rejeitado(self):
        token = TokenRedefinicaoSenha.objects.create(
            usuario=self.usuario,
            token="token-usado-123",
            expira_em=timezone.now() + timezone.timedelta(hours=1),
            usado=True,
        )
        resposta = self.client.post(
            "/api/login/redefinir-senha/",
            {
                "token": token.token,
                "nova_senha": "NovaSenha@123",
                "confirmar_senha": "NovaSenha@123",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_redefinir_com_token_expirado_e_rejeitado(self):
        token = TokenRedefinicaoSenha.objects.create(
            usuario=self.usuario,
            token="token-expirado-123",
            expira_em=timezone.now() - timezone.timedelta(minutes=1),
        )
        resposta = self.client.post(
            "/api/login/redefinir-senha/",
            {
                "token": token.token,
                "nova_senha": "NovaSenha@123",
                "confirmar_senha": "NovaSenha@123",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_redefinir_com_senha_fraca_e_rejeitado(self):
        token = TokenRedefinicaoSenha.objects.create(
            usuario=self.usuario,
            token="token-fraco-123",
            expira_em=timezone.now() + timezone.timedelta(hours=1),
        )
        resposta = self.client.post(
            "/api/login/redefinir-senha/",
            {
                "token": token.token,
                "nova_senha": "fraca",
                "confirmar_senha": "fraca",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_redefinir_com_confirmacao_diferente_e_rejeitado(self):
        token = TokenRedefinicaoSenha.objects.create(
            usuario=self.usuario,
            token="token-confirma-123",
            expira_em=timezone.now() + timezone.timedelta(hours=1),
        )
        resposta = self.client.post(
            "/api/login/redefinir-senha/",
            {
                "token": token.token,
                "nova_senha": "NovaSenha@123",
                "confirmar_senha": "OutraSenha@123",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)


class SessaoInvalidadaNaTrocaDeSenhaAPITestCase(APITestCase):
    """A troca de senha — própria ou por link de recuperação — precisa
    derrubar qualquer token emitido antes dela. Sem isso um token roubado
    antes da troca continuava valendo até expirar sozinho (documentado em
    RenovacaoDeTokenAPITestCase.test_access_token_emitido_antes_do_logout_
    continua_valido_ate_expirar — aquele é sobre logout; este é sobre
    troca de senha, que agora usa um mecanismo diferente: session_version)."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)

    def test_access_token_emitido_antes_da_troca_de_senha_propria_e_rejeitado(self):
        token_antigo = _gerar_token_de_acesso(self.usuario)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_antigo}")
        resposta_troca = self.client.post(
            "/api/configuracoes/senha/",
            {
                "senha_atual": "senha12345",
                "nova_senha": "NovaSenha@123",
                "confirmar_senha": "NovaSenha@123",
            },
            format="json",
        )
        self.assertEqual(resposta_troca.status_code, status.HTTP_200_OK, resposta_troca.data)

        # O mesmo token, usado de novo, já não vale mais — mesmo sendo
        # bem formado e ainda dentro do prazo de expiração.
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_antigo}")
        resposta_depois = self.client.get("/api/clientes/")
        self.assertEqual(resposta_depois.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_troca_de_senha_propria_devolve_tokens_novos_que_funcionam(self):
        token_antigo = _gerar_token_de_acesso(self.usuario)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_antigo}")

        resposta_troca = self.client.post(
            "/api/configuracoes/senha/",
            {
                "senha_atual": "senha12345",
                "nova_senha": "NovaSenha@123",
                "confirmar_senha": "NovaSenha@123",
            },
            format="json",
        )
        self.assertIn("access", resposta_troca.data)
        self.assertIn("refresh", resposta_troca.data)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resposta_troca.data['access']}")
        resposta_depois = self.client.get("/api/clientes/")
        self.assertEqual(resposta_depois.status_code, status.HTTP_200_OK)

    def test_refresh_token_emitido_antes_da_troca_de_senha_propria_nao_renova_mais(self):
        refresh_antigo = _gerar_refresh_token(self.usuario)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.usuario)}"
        )
        self.client.post(
            "/api/configuracoes/senha/",
            {
                "senha_atual": "senha12345",
                "nova_senha": "NovaSenha@123",
                "confirmar_senha": "NovaSenha@123",
            },
            format="json",
        )

        resposta = self.client.post(
            "/api/token/refresh/", {"refresh": refresh_antigo}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_quem_nao_trocou_a_senha_continua_com_o_token_valendo(self):
        outro_usuario = _criar_usuario(self.escritorio, email="outro@escritorio.com")
        token = _gerar_token_de_acesso(outro_usuario)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.usuario)}"
        )
        self.client.post(
            "/api/configuracoes/senha/",
            {
                "senha_atual": "senha12345",
                "nova_senha": "NovaSenha@123",
                "confirmar_senha": "NovaSenha@123",
            },
            format="json",
        )

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        resposta = self.client.get("/api/clientes/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

    def test_access_token_emitido_antes_da_redefinicao_por_link_e_rejeitado(self):
        token_antigo = _gerar_token_de_acesso(self.usuario)

        token_redefinicao = TokenRedefinicaoSenha.objects.create(
            usuario=self.usuario,
            token="token-sessao-123",
            expira_em=timezone.now() + timezone.timedelta(hours=1),
        )
        resposta_redefinicao = self.client.post(
            "/api/login/redefinir-senha/",
            {
                "token": token_redefinicao.token,
                "nova_senha": "NovaSenha@123",
                "confirmar_senha": "NovaSenha@123",
            },
            format="json",
        )
        self.assertEqual(resposta_redefinicao.status_code, status.HTTP_200_OK)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_antigo}")
        resposta_depois = self.client.get("/api/clientes/")
        self.assertEqual(resposta_depois.status_code, status.HTTP_401_UNAUTHORIZED)


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


class ThrottlingAPITestCase(APITestCase):
    """Testa que endpoints sensíveis aplicam rate limiting quando habilitado.

    O rate limiting fica desligado durante `manage.py test` (ver
    core/settings.TESTING) para não deixar a suíte inteira instável; este
    teste liga explicitamente as classes de throttle para validar o
    comportamento em si.
    """

    def setUp(self):
        cache.clear()
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)

    def tearDown(self):
        cache.clear()

    @override_settings(REST_FRAMEWORK={"DEFAULT_THROTTLE_RATES": {"sensivel": "2/minute"}})
    def test_endpoint_sensivel_bloqueia_apos_exceder_o_limite(self):
        # `throttle_classes` de uma view baseada em APIView é resolvido de
        # `api_settings.DEFAULT_THROTTLE_CLASSES` uma única vez, na
        # importação do módulo — antes de qualquer teste rodar, quando
        # TESTING já vale () (ver core/settings.py). Por isso, para este
        # teste específico validar o throttling de verdade, a classe de
        # throttle é ligada diretamente na view em vez de via
        # override_settings (que não afeta um atributo já resolvido).
        from rest_framework.throttling import ScopedRateThrottle

        with patch.object(SolicitarRedefinicaoSenhaView, "throttle_classes", [ScopedRateThrottle]):
            for _ in range(2):
                resposta = self.client.post(
                    "/api/login/esqueci-senha/",
                    {"email": "ana@escritorio.com"},
                    format="json",
                )
                self.assertEqual(resposta.status_code, status.HTTP_200_OK)

            resposta = self.client.post(
                "/api/login/esqueci-senha/",
                {"email": "ana@escritorio.com"},
                format="json",
            )
            self.assertEqual(resposta.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class EnvioDeLembretesTestCase(TestCase):
    """Testa o comando que dispara lembretes de agenda e o resumo semanal."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)
        # O resumo semanal fica desligado por padrão de propósito: o comando
        # o envia sozinho às segundas-feiras, e deixá-lo ligado aqui faria a
        # contagem de e-mails destes testes depender do dia da execução.
        self.preferencias = PreferenciasUsuario.objects.create(
            usuario=self.usuario,
            lembrete_audiencia=True,
            lembrete_prazo=True,
            antecedencia_audiencia=2,
            resumo_semanal=False,
        )
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Lembrete",
            cpf="77777777777",
            email="cliente.lembrete@teste.com",
            telefone="11966666666",
            endereco="Rua L",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Lembrete",
            email="advogado.lembrete@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="555555/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-LEMB-1",
            titulo="Processo Lembrete",
            descricao="Descrição.",
            cliente=cliente,
            advogado=advogado,
        )

    def _criar_evento(self, dias_a_frente, tipo="prazo", cumprido=False):
        return Agenda.objects.create(
            processo=self.processo,
            tipo=tipo,
            titulo=f"Evento em {dias_a_frente} dia(s)",
            descricao="Descrição do evento.",
            data_evento=timezone.now() + timezone.timedelta(days=dias_a_frente, hours=1),
            cumprido=cumprido,
        )

    def test_evento_dentro_da_antecedencia_gera_email(self):
        self._criar_evento(1)

        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Evento em 1 dia(s)", mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, [self.usuario.email])

    def test_evento_fora_da_antecedencia_nao_gera_email(self):
        self._criar_evento(10)

        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 0)

    def test_evento_ja_cumprido_nao_gera_email(self):
        self._criar_evento(1, cumprido=True)

        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 0)

    def test_comando_e_idempotente(self):
        self._criar_evento(1)

        call_command("enviar_lembretes")
        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(NotificacaoEnviada.objects.filter(tipo="lembrete_evento").count(), 1)

    def test_preferencia_desligada_nao_gera_email(self):
        self.preferencias.lembrete_prazo = False
        self.preferencias.lembrete_audiencia = False
        self.preferencias.save()
        self._criar_evento(1)

        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 0)

    def test_dry_run_nao_envia_nem_registra(self):
        self._criar_evento(1)

        call_command("enviar_lembretes", "--dry-run")

        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(NotificacaoEnviada.objects.count(), 0)

    def test_usuario_inativo_nao_recebe(self):
        self.usuario.ativo = False
        self.usuario.save()
        self._criar_evento(1)

        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 0)

    def test_resumo_semanal_e_enviado_uma_vez_por_semana(self):
        self.preferencias.resumo_semanal = True
        self.preferencias.save()

        call_command("enviar_lembretes", "--resumo-semanal")
        call_command("enviar_lembretes", "--resumo-semanal")

        resumos = [m for m in mail.outbox if m.subject.startswith("Resumo da semana")]
        self.assertEqual(len(resumos), 1)
        self.assertEqual(NotificacaoEnviada.objects.filter(tipo="resumo_semanal").count(), 1)

    def test_resumo_semanal_lista_eventos_da_semana(self):
        self.preferencias.lembrete_audiencia = False
        self.preferencias.lembrete_prazo = False
        self.preferencias.resumo_semanal = True
        self.preferencias.save()
        self._criar_evento(3, tipo="compromisso")

        call_command("enviar_lembretes", "--resumo-semanal")

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Evento em 3 dia(s)", mail.outbox[0].body + str(mail.outbox[0].alternatives))

    def test_falha_de_envio_nao_marca_como_enviado(self):
        self._criar_evento(1)

        with patch("advocacia.management.commands.enviar_lembretes.enviar_email") as envio:
            envio.side_effect = Exception("SMTP fora do ar")
            call_command("enviar_lembretes")

        self.assertEqual(NotificacaoEnviada.objects.count(), 0)

        # Com o serviço de volta, o lembrete é enviado normalmente.
        call_command("enviar_lembretes")
        self.assertEqual(len(mail.outbox), 1)

    def test_contagem_de_dias_usa_o_fuso_local(self):
        """Evento às 23h de Brasília cai no dia seguinte em UTC. Contar a
        diferença sobre a data UTC erraria por um dia — daí a conversão."""
        amanha_a_noite = (timezone.localtime() + timezone.timedelta(days=1)).replace(
            hour=23, minute=0, second=0, microsecond=0
        )
        Agenda.objects.create(
            processo=self.processo,
            tipo="prazo",
            titulo="Prazo noturno",
            descricao="Descrição.",
            data_evento=amanha_a_noite,
        )

        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("amanhã", mail.outbox[0].subject)

    def test_usuario_de_outro_escritorio_nao_recebe_eventos_alheios(self):
        outro = Escritorio.objects.create(
            nome="Outro Escritório",
            cnpj="99.999.999/0001-99",
            email="outro@escritorio.com",
            telefone="11955555555",
            endereco="Rua X",
        )
        intruso = Usuario.objects.create(
            escritorio=outro,
            nome="Intruso",
            email="intruso@outro.com",
            senha=make_password("senha12345"),
            tipo_usuario="admin",
        )
        PreferenciasUsuario.objects.create(usuario=intruso, lembrete_prazo=True)
        self._criar_evento(1)

        call_command("enviar_lembretes")

        destinatarios = [d for m in mail.outbox for d in m.to]
        self.assertIn(self.usuario.email, destinatarios)
        self.assertNotIn(intruso.email, destinatarios)


class AvisosPorEventoAPITestCase(APITestCase):
    """Testa os avisos disparados no momento da ação (seção E-mail das preferências)."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.autor = _criar_usuario(self.escritorio)
        PreferenciasUsuario.objects.create(
            usuario=self.autor,
            notificacao_novo_processo=True,
            notificacao_novo_cliente=True,
            notificacao_status_processo=True,
        )
        self.colega = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Colega",
            email="colega@escritorio.com",
            senha=make_password("senha12345"),
            tipo_usuario="admin",
        )
        PreferenciasUsuario.objects.create(
            usuario=self.colega,
            notificacao_novo_processo=True,
            notificacao_novo_cliente=True,
            notificacao_status_processo=True,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.autor)}"
        )

    def _criar_processo(self):
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Aviso",
            cpf="88888888888",
            email="cliente.aviso@teste.com",
            telefone="11944444444",
            endereco="Rua A",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Aviso",
            email="advogado.aviso@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="666666/SP",
            especialidade="Civil",
        )
        return Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-AVISO-1",
            titulo="Processo Aviso",
            descricao="Descrição.",
            cliente=cliente,
            advogado=advogado,
        )

    def test_novo_cliente_avisa_os_colegas(self):
        resposta = self.client.post(
            "/api/clientes/",
            {
                "nome": "Cliente Novo",
                "cpf": "12312312399",
                "email": "cliente.novo@teste.com",
                "telefone": "11933333333",
                "endereco": "Rua Nova",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Novo cliente cadastrado", mail.outbox[0].subject)

    def test_autor_da_acao_nao_recebe_o_proprio_aviso(self):
        self.client.post(
            "/api/clientes/",
            {
                "nome": "Cliente Novo",
                "cpf": "12312312399",
                "email": "cliente.novo@teste.com",
                "telefone": "11933333333",
                "endereco": "Rua Nova",
            },
        )

        destinatarios = [d for m in mail.outbox for d in m.to]
        self.assertIn(self.colega.email, destinatarios)
        self.assertNotIn(self.autor.email, destinatarios)

    def test_preferencia_desligada_nao_recebe(self):
        self.colega.preferencias.notificacao_novo_cliente = False
        self.colega.preferencias.save()

        self.client.post(
            "/api/clientes/",
            {
                "nome": "Cliente Novo",
                "cpf": "12312312399",
                "email": "cliente.novo@teste.com",
                "telefone": "11933333333",
                "endereco": "Rua Nova",
            },
        )

        self.assertEqual(len(mail.outbox), 0)

    def test_mudanca_de_status_avisa_os_colegas(self):
        processo = self._criar_processo()

        resposta = self.client.patch(
            f"/api/processos/{processo.id}/", {"status": "Concluido"}
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        avisos = [m for m in mail.outbox if "Status de processo alterado" in m.subject]
        self.assertEqual(len(avisos), 1)
        self.assertEqual(avisos[0].to, [self.colega.email])

    def test_edicao_sem_mudar_status_nao_avisa(self):
        processo = self._criar_processo()

        self.client.patch(f"/api/processos/{processo.id}/", {"titulo": "Outro título"})

        avisos = [m for m in mail.outbox if "Status de processo alterado" in m.subject]
        self.assertEqual(len(avisos), 0)

    def test_falha_de_email_nao_derruba_a_operacao(self):
        with patch("advocacia.notificacoes.enviar_email") as envio:
            envio.side_effect = Exception("SMTP fora do ar")
            resposta = self.client.post(
                "/api/clientes/",
                {
                    "nome": "Cliente Novo",
                    "cpf": "12312312399",
                    "email": "cliente.novo@teste.com",
                    "telefone": "11933333333",
                    "endereco": "Rua Nova",
                },
            )

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Cliente.objects.filter(nome="Cliente Novo").exists())


class ApontamentoHoraAPITestCase(APITestCase):
    """Testa o apontamento de horas por processo (timesheet)."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Horas",
            cpf="55555555555",
            email="cliente.horas@teste.com",
            telefone="11922222222",
            endereco="Rua H",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Horas",
            email="advogado.horas@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="777777/SP",
            especialidade="Trabalhista",
            valor_hora_padrao=Decimal("300.00"),
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-HORA-1",
            titulo="Processo Horas",
            descricao="Descrição.",
            cliente=cliente,
            advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_criar_apontamento_calcula_horas_e_valor(self):
        resposta = self.client.post(
            "/api/apontamentos/",
            {
                "processo": self.processo.id,
                "data": timezone.localdate().isoformat(),
                "minutos": 90,
                "descricao": "Elaboração de petição inicial.",
                "faturavel": True,
                "valor_hora": "300.00",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        self.assertEqual(resposta.data["horas"], "1.50")
        self.assertEqual(resposta.data["valor"], "450.00")

    def test_apontamento_e_lancado_em_nome_de_quem_esta_logado(self):
        resposta = self.client.post(
            "/api/apontamentos/",
            {
                "processo": self.processo.id,
                "data": timezone.localdate().isoformat(),
                "minutos": 60,
                "descricao": "Reunião com o cliente.",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["usuario"], self.admin.id)

    def test_hora_nao_faturavel_nao_tem_valor(self):
        apontamento = ApontamentoHora.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            usuario=self.admin,
            data=timezone.localdate(),
            minutos=60,
            descricao="Retrabalho interno.",
            faturavel=False,
            valor_hora=Decimal("300.00"),
        )

        self.assertIsNone(apontamento.valor)

    def test_apontamento_em_data_futura_e_rejeitado(self):
        resposta = self.client.post(
            "/api/apontamentos/",
            {
                "processo": self.processo.id,
                "data": (timezone.localdate() + timezone.timedelta(days=1)).isoformat(),
                "minutos": 60,
                "descricao": "Trabalho do futuro.",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_apontamento_acima_de_24h_e_rejeitado(self):
        resposta = self.client.post(
            "/api/apontamentos/",
            {
                "processo": self.processo.id,
                "data": timezone.localdate().isoformat(),
                "minutos": 1500,
                "descricao": "Dia impossível.",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_minutos_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/apontamentos/",
            {
                "processo": self.processo.id,
                "data": timezone.localdate().isoformat(),
                "minutos": 0,
                "descricao": "Nada feito.",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filtro_por_processo(self):
        outro_processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-HORA-2",
            titulo="Outro",
            descricao="Descrição.",
            cliente=self.processo.cliente,
            advogado=self.advogado,
        )
        for processo in (self.processo, outro_processo):
            ApontamentoHora.objects.create(
                escritorio=self.escritorio,
                processo=processo,
                usuario=self.admin,
                data=timezone.localdate(),
                minutos=60,
                descricao="Trabalho.",
            )

        resposta = self.client.get(f"/api/apontamentos/?processo={self.processo.id}")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resposta.data["results"]), 1)

    def test_apontamento_de_outro_escritorio_nao_aparece(self):
        outro = Escritorio.objects.create(
            nome="Outro Escritório",
            cnpj="88.888.888/0001-88",
            email="outro2@escritorio.com",
            telefone="11911111111",
            endereco="Rua Y",
        )
        outro_usuario = Usuario.objects.create(
            escritorio=outro,
            nome="Alheio",
            email="alheio@outro.com",
            senha=make_password("senha12345"),
            tipo_usuario="admin",
        )
        outro_cliente = Cliente.objects.create(
            escritorio=outro, nome="C", cpf="11111111112",
            email="c@outro.com", telefone="11900000000", endereco="Rua Z",
        )
        outro_advogado = Advogado.objects.create(
            escritorio=outro,
            usuario=outro_usuario,
            oab="999999/SP",
            especialidade="Civil",
        )
        outro_processo = Processo.objects.create(
            escritorio=outro, numero_processo="PROC-OUTRO",
            titulo="Alheio", descricao="d", cliente=outro_cliente,
            advogado=outro_advogado,
        )
        ApontamentoHora.objects.create(
            escritorio=outro, processo=outro_processo, usuario=outro_usuario,
            data=timezone.localdate(), minutos=120, descricao="Alheio.",
        )

        resposta = self.client.get("/api/apontamentos/")

        self.assertEqual(len(resposta.data["results"]), 0)


class DespesaAPITestCase(APITestCase):
    """Testa o lançamento de custas e despesas processuais."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Despesa",
            cpf="66666666666",
            email="cliente.despesa@teste.com",
            telefone="11933333333",
            endereco="Rua D",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Despesa",
            email="advogado.despesa@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="121212/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-DESP-1",
            titulo="Processo Despesa",
            descricao="Descrição.",
            cliente=cliente,
            advogado=advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_criar_despesa(self):
        resposta = self.client.post(
            "/api/despesas/",
            {
                "processo": self.processo.id,
                "tipo": "custas",
                "descricao": "Custas iniciais.",
                "valor": "250.00",
                "data": timezone.localdate().isoformat(),
                "reembolsavel": True,
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        self.assertEqual(resposta.data["tipo_display"], "Custas processuais")

    def test_despesa_registra_quem_lancou(self):
        self.client.post(
            "/api/despesas/",
            {
                "processo": self.processo.id,
                "tipo": "diligencia",
                "descricao": "Diligência.",
                "valor": "80.00",
                "data": timezone.localdate().isoformat(),
            },
        )

        despesa = Despesa.objects.get(descricao="Diligência.")
        self.assertEqual(despesa.criado_por, self.admin)

    def test_valor_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/despesas/",
            {
                "processo": self.processo.id,
                "tipo": "custas",
                "descricao": "Grátis.",
                "valor": "0.00",
                "data": timezone.localdate().isoformat(),
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nao_reembolsavel_nao_pode_ser_reembolsada(self):
        resposta = self.client.post(
            "/api/despesas/",
            {
                "processo": self.processo.id,
                "tipo": "outros",
                "descricao": "Café do escritório.",
                "valor": "15.00",
                "data": timezone.localdate().isoformat(),
                "reembolsavel": False,
                "reembolsada": True,
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filtro_por_reembolsavel(self):
        for reembolsavel in (True, False):
            Despesa.objects.create(
                escritorio=self.escritorio,
                processo=self.processo,
                tipo="custas",
                descricao="Despesa.",
                valor=Decimal("100.00"),
                data=timezone.localdate(),
                reembolsavel=reembolsavel,
            )

        resposta = self.client.get("/api/despesas/?reembolsavel=true")

        self.assertEqual(len(resposta.data["results"]), 1)


class TempoDeUsoAPITestCase(APITestCase):
    """Testa a medição de tempo de uso do sistema por usuário."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.advogado_usuario = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Tempo",
            email="advogado.tempo@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_primeiro_sinal_abre_uma_sessao(self):
        resposta = self.client.post("/api/atividade/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(SessaoUso.objects.filter(usuario=self.admin).count(), 1)

    def test_sinal_seguido_estende_a_mesma_sessao(self):
        self.client.post("/api/atividade/")
        self.client.post("/api/atividade/")

        self.assertEqual(SessaoUso.objects.filter(usuario=self.admin).count(), 1)

    def test_sinal_apos_a_janela_abre_nova_sessao(self):
        self.client.post("/api/atividade/")

        sessao = SessaoUso.objects.get(usuario=self.admin)
        antigo = timezone.now() - timezone.timedelta(minutes=JANELA_SESSAO_MINUTOS + 5)
        SessaoUso.objects.filter(pk=sessao.pk).update(inicio=antigo, ultima_atividade=antigo)

        self.client.post("/api/atividade/")

        self.assertEqual(SessaoUso.objects.filter(usuario=self.admin).count(), 2)

    def test_duracao_e_a_diferenca_entre_inicio_e_ultima_atividade(self):
        inicio = timezone.now() - timezone.timedelta(minutes=45)
        sessao = SessaoUso.objects.create(
            escritorio=self.escritorio,
            usuario=self.admin,
            inicio=inicio,
            ultima_atividade=inicio + timezone.timedelta(minutes=45),
        )

        self.assertEqual(sessao.duracao_minutos, 45)

    def test_relatorio_soma_o_tempo_do_mes(self):
        agora = timezone.now()
        for minutos in (30, 20):
            SessaoUso.objects.create(
                escritorio=self.escritorio,
                usuario=self.admin,
                inicio=agora - timezone.timedelta(minutes=minutos),
                ultima_atividade=agora,
            )

        resposta = self.client.get("/api/relatorios/tempo-uso/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        linha = next(u for u in resposta.data["usuarios"] if u["usuario"] == self.admin.id)
        self.assertEqual(linha["minutos"], 50)
        self.assertEqual(linha["sessoes"], 2)

    def test_admin_ve_o_tempo_de_toda_a_equipe(self):
        agora = timezone.now()
        SessaoUso.objects.create(
            escritorio=self.escritorio,
            usuario=self.advogado_usuario,
            inicio=agora - timezone.timedelta(minutes=60),
            ultima_atividade=agora,
        )

        resposta = self.client.get("/api/relatorios/tempo-uso/")

        nomes = [u["usuario_nome"] for u in resposta.data["usuarios"]]
        self.assertIn("Advogado Tempo", nomes)

    def test_nao_admin_ve_apenas_o_proprio_tempo(self):
        agora = timezone.now()
        for usuario in (self.admin, self.advogado_usuario):
            SessaoUso.objects.create(
                escritorio=self.escritorio,
                usuario=usuario,
                inicio=agora - timezone.timedelta(minutes=30),
                ultima_atividade=agora,
            )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.advogado_usuario)}"
        )
        resposta = self.client.get("/api/relatorios/tempo-uso/")

        ids = [u["usuario"] for u in resposta.data["usuarios"]]
        self.assertEqual(ids, [self.advogado_usuario.id])

    def test_mes_invalido_e_rejeitado(self):
        resposta = self.client.get("/api/relatorios/tempo-uso/?mes=setembro")

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mes_sem_uso_retorna_lista_vazia(self):
        resposta = self.client.get("/api/relatorios/tempo-uso/?mes=2020-01")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["usuarios"], [])


class PreenchimentoDeModeloTestCase(TestCase):
    """Testa o preenchimento de variáveis — inclusive o que ele se recusa a fazer."""

    def setUp(self):
        self.escritorio = _criar_escritorio(cidade="Araçatuba")
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Maria Fernanda Costa",
            cpf="123.456.789-00",
            rg="12.345.678-9",
            email="maria@teste.com",
            telefone="11988887777",
            endereco="Rua das Flores, 100",
            estado_civil="casado",
            nacionalidade="brasileira",
        )

    def test_substitui_variaveis_do_cliente(self):
        contexto = montar_contexto(self.escritorio, cliente=self.cliente)
        texto, desconhecidas, vazias = preencher(
            "Eu, {{cliente.nome}}, {{cliente.nacionalidade}}, {{cliente.estado_civil}}, "
            "portador do CPF {{cliente.cpf}}.",
            contexto,
        )

        self.assertIn("Maria Fernanda Costa", texto)
        self.assertIn("brasileira", texto)
        self.assertIn("Casado(a)", texto)
        self.assertIn("123.456.789-00", texto)
        self.assertEqual(desconhecidas, [])

    def test_variavel_fora_do_catalogo_e_mantida_e_sinalizada(self):
        contexto = montar_contexto(self.escritorio, cliente=self.cliente)
        texto, desconhecidas, _ = preencher("Valor: {{cliente.inventado}}", contexto)

        self.assertIn("{{cliente.inventado}}", texto)
        self.assertEqual(desconhecidas, ["cliente.inventado"])

    def test_nao_expoe_campo_sensivel_por_travessia_de_atributo(self):
        """A senha do usuário nunca deve ser alcançável a partir de um modelo."""
        usuario = _criar_usuario(self.escritorio)
        contexto = montar_contexto(self.escritorio, cliente=self.cliente)

        texto, desconhecidas, _ = preencher(
            "{{usuario.senha}} {{cliente.senha}} {{escritorio.plano}}", contexto
        )

        self.assertNotIn(usuario.senha, texto)
        self.assertIn("{{usuario.senha}}", texto)
        self.assertIn("{{cliente.senha}}", texto)
        self.assertIn("{{escritorio.plano}}", texto)
        self.assertEqual(len(desconhecidas), 3)

    def test_campo_em_branco_no_cadastro_e_sinalizado(self):
        self.cliente.rg = ""
        self.cliente.save()
        contexto = montar_contexto(self.escritorio, cliente=self.cliente)

        texto, _, vazias = preencher("RG: {{cliente.rg}}.", contexto)

        self.assertEqual(texto, "RG: .")
        self.assertIn("cliente.rg", vazias)

    def test_data_por_extenso_e_cidade(self):
        contexto = montar_contexto(self.escritorio)
        texto, _, _ = preencher("{{data.cidade_e_data}}", contexto)

        self.assertIn("Araçatuba,", texto)
        self.assertRegex(texto, r"\d{1,2} de \w+ de \d{4}")

    def test_processo_preenche_cliente_e_advogado_automaticamente(self):
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="João Henrique Sabino",
            email="joao.modelo@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="123456/SP",
            especialidade="Civil",
        )
        processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="0001234-56.2026.5.15.0002",
            titulo="Ação de cobrança",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=advogado,
            area_direito="civil",
            valor_causa=Decimal("15000.00"),
        )

        contexto = montar_contexto(self.escritorio, processo=processo)
        texto, _, _ = preencher(
            "{{cliente.nome}} / {{advogado.nome}} - OAB {{advogado.oab}} / "
            "{{processo.numero}} / {{processo.valor_causa}}",
            contexto,
        )

        self.assertIn("Maria Fernanda Costa", texto)
        self.assertIn("João Henrique Sabino", texto)
        self.assertIn("123456/SP", texto)
        self.assertIn("0001234-56.2026.5.15.0002", texto)
        self.assertIn("R$ 15.000,00", texto)

    def test_espacos_dentro_das_chaves_sao_tolerados(self):
        contexto = montar_contexto(self.escritorio, cliente=self.cliente)
        texto, _, _ = preencher("{{ cliente.nome }}", contexto)

        self.assertEqual(texto, "Maria Fernanda Costa")


class ModeloDocumentoAPITestCase(APITestCase):
    """Testa o CRUD de modelos e a geração do documento preenchido."""

    def setUp(self):
        self.escritorio = _criar_escritorio(cidade="Araçatuba")
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Roberto Almeida Lima",
            cpf="987.654.321-00",
            email="roberto@teste.com",
            telefone="11977776666",
            endereco="Av. Brasil, 500",
        )
        self.modelo = ModeloDocumento.objects.create(
            escritorio=self.escritorio,
            nome="Procuração ad judicia",
            tipo="procuracao",
            conteudo="OUTORGANTE: {{cliente.nome}}, CPF {{cliente.cpf}}.\n{{data.cidade_e_data}}",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_listar_variaveis_disponiveis(self):
        resposta = self.client.get("/api/modelos-documento/variaveis/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        chaves = [item["chave"] for item in resposta.data]
        self.assertIn("cliente.nome", chaves)
        self.assertIn("data.cidade_e_data", chaves)

    def test_gerar_documento_a_partir_de_cliente(self):
        resposta = self.client.post(
            f"/api/modelos-documento/{self.modelo.id}/gerar/",
            {"cliente": self.cliente.id},
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertIn("Roberto Almeida Lima", resposta.data["conteudo"])
        self.assertIn("987.654.321-00", resposta.data["conteudo"])
        self.assertIn("Araçatuba", resposta.data["conteudo"])

    def test_gerar_sem_cliente_nem_processo_e_rejeitado(self):
        resposta = self.client.post(f"/api/modelos-documento/{self.modelo.id}/gerar/", {})

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nao_preenche_com_cliente_de_outro_escritorio(self):
        outro = Escritorio.objects.create(
            nome="Outro Escritório",
            cnpj="77.777.777/0001-77",
            email="outro3@escritorio.com",
            telefone="11900000000",
            endereco="Rua W",
        )
        cliente_alheio = Cliente.objects.create(
            escritorio=outro,
            nome="Cliente Alheio",
            cpf="111.111.111-11",
            email="alheio2@teste.com",
            telefone="11900000001",
            endereco="Rua V",
        )

        resposta = self.client.post(
            f"/api/modelos-documento/{self.modelo.id}/gerar/",
            {"cliente": cliente_alheio.id},
        )

        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    def test_modelo_de_outro_escritorio_nao_e_acessivel(self):
        outro = Escritorio.objects.create(
            nome="Outro Escritório 2",
            cnpj="66.666.666/0001-66",
            email="outro4@escritorio.com",
            telefone="11900000002",
            endereco="Rua U",
        )
        modelo_alheio = ModeloDocumento.objects.create(
            escritorio=outro,
            nome="Modelo alheio",
            tipo="outros",
            conteudo="{{cliente.nome}}",
        )

        resposta = self.client.get(f"/api/modelos-documento/{modelo_alheio.id}/")

        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    def test_criar_modelo_pela_api(self):
        resposta = self.client.post(
            "/api/modelos-documento/",
            {
                "nome": "Declaração de hipossuficiência",
                "tipo": "declaracao",
                "conteudo": "Eu, {{cliente.nome}}, declaro...",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        self.assertEqual(resposta.data["tipo_display"], "Declaração")

    def test_nome_de_modelo_duplicado_no_mesmo_escritorio_e_rejeitado(self):
        resposta = self.client.post(
            "/api/modelos-documento/",
            {"nome": "Procuração ad judicia", "tipo": "procuracao", "conteudo": "x"},
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)


def _resposta_datajud(movimentos=None):
    """Resposta do DataJud no formato Elasticsearch, para os testes."""
    return {
        "hits": {
            "hits": [
                {
                    "_source": {
                        "numeroProcesso": "00056789020268260032",
                        "classe": {"codigo": 1116, "nome": "Execução de Título Extrajudicial"},
                        "orgaoJulgador": {"nome": "2ª Vara Cível de Araçatuba"},
                        "tribunal": "TJSP",
                        "grau": "G1",
                        "dataAjuizamento": "2026-03-10T09:00:00.000Z",
                        "dataHoraUltimaAtualizacao": "2026-09-18T14:22:00.000Z",
                        "movimentos": movimentos
                        if movimentos is not None
                        else [
                            {"codigo": 26, "nome": "Distribuição", "dataHora": "2026-03-10T09:00:00.000Z"},
                            {"codigo": 51, "nome": "Conclusão", "dataHora": "2026-04-02T16:30:00.000Z"},
                        ],
                    }
                }
            ]
        }
    }


class NumeracaoCNJTestCase(TestCase):
    """Testa a leitura do número unificado e a descoberta do tribunal."""

    def test_quebra_o_numero_em_partes(self):
        partes = partes_do_numero("0005678-90.2026.8.26.0032")

        self.assertEqual(partes["sequencial"], "0005678")
        self.assertEqual(partes["digito"], "90")
        self.assertEqual(partes["ano"], "2026")
        self.assertEqual(partes["segmento"], "8")
        self.assertEqual(partes["tribunal"], "26")
        self.assertEqual(partes["origem"], "0032")

    def test_aceita_numero_sem_mascara(self):
        partes = partes_do_numero("00056789020268260032")
        self.assertEqual(partes["tribunal"], "26")

    def test_numero_com_tamanho_errado_e_rejeitado(self):
        with self.assertRaises(ErroDataJud):
            partes_do_numero("123456")

    def test_justica_estadual_vira_alias_do_tj(self):
        self.assertEqual(alias_do_tribunal("0005678-90.2026.8.26.0032"), "api_publica_tjsp")
        self.assertEqual(alias_do_tribunal("0005678-90.2026.8.19.0032"), "api_publica_tjrj")
        self.assertEqual(alias_do_tribunal("0005678-90.2026.8.13.0032"), "api_publica_tjmg")

    def test_justica_do_trabalho_vira_alias_do_trt(self):
        self.assertEqual(alias_do_tribunal("0001234-56.2026.5.15.0002"), "api_publica_trt15")
        self.assertEqual(alias_do_tribunal("0001234-56.2026.5.02.0002"), "api_publica_trt2")

    def test_justica_federal_vira_alias_do_trf(self):
        self.assertEqual(alias_do_tribunal("0001234-56.2026.4.03.0002"), "api_publica_trf3")

    def test_segmento_nao_coberto_explica_o_limite(self):
        with self.assertRaises(ErroDataJud) as contexto:
            alias_do_tribunal("0001234-56.2026.6.00.0002")

        self.assertIn("Estadual", str(contexto.exception))

    def test_codigo_de_tribunal_estadual_desconhecido_e_rejeitado(self):
        with self.assertRaises(ErroDataJud):
            alias_do_tribunal("0001234-56.2026.8.99.0002")


class InterpretacaoDaRespostaDataJudTestCase(TestCase):
    """Testa a leitura do JSON do DataJud, inclusive quando faltam campos."""

    def test_extrai_capa_e_movimentos(self):
        dados = interpretar_resposta(_resposta_datajud())

        self.assertEqual(dados["tribunal"], "TJSP")
        self.assertEqual(dados["orgao_julgador"], "2ª Vara Cível de Araçatuba")
        self.assertEqual(dados["classe"], "Execução de Título Extrajudicial")
        self.assertEqual(len(dados["movimentos"]), 2)
        self.assertEqual(dados["movimentos"][0]["descricao"], "Distribuição")

    def test_resposta_sem_resultados_devolve_none(self):
        self.assertIsNone(interpretar_resposta({"hits": {"hits": []}}))

    def test_resposta_vazia_devolve_none(self):
        self.assertIsNone(interpretar_resposta({}))
        self.assertIsNone(interpretar_resposta(None))

    def test_campos_ausentes_nao_quebram_a_leitura(self):
        """O formato varia entre tribunais; faltar campo não pode derrubar."""
        resposta = {"hits": {"hits": [{"_source": {"numeroProcesso": "123"}}]}}

        dados = interpretar_resposta(resposta)

        self.assertEqual(dados["numero_processo"], "123")
        self.assertEqual(dados["classe"], "")
        self.assertEqual(dados["orgao_julgador"], "")
        self.assertEqual(dados["movimentos"], [])

    def test_movimento_com_nome_alternativo_e_lido(self):
        resposta = _resposta_datajud(
            movimentos=[{"codigo": 9, "descricao": "Juntada", "data_hora": "2026-05-01T10:00:00Z"}]
        )

        dados = interpretar_resposta(resposta)

        self.assertEqual(dados["movimentos"][0]["descricao"], "Juntada")
        self.assertEqual(dados["movimentos"][0]["data_hora"], "2026-05-01T10:00:00Z")


class ConsultaDataJudAPITestCase(APITestCase):
    """Testa o endpoint de consulta, com a chamada de rede substituída."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente DataJud",
            cpf="44444444444",
            email="cliente.datajud@teste.com",
            telefone="11955554444",
            endereco="Rua J",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado DataJud",
            email="advogado.datajud@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="343434/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="0005678-90.2026.8.26.0032",
            titulo="Processo DataJud",
            descricao="Descrição.",
            cliente=cliente,
            advogado=advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )
        self.url = f"/api/processos/{self.processo.id}/consultar-datajud/"

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_consulta_importa_movimentacoes(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            resposta = self.client.post(self.url)

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(resposta.data["movimentacoes_importadas"], 2)
        self.assertEqual(resposta.data["capa"]["tribunal"], "TJSP")
        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_movimentacao_importada_guarda_a_data_do_tribunal(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            self.client.post(self.url)

        movimentacao = Movimentacao.objects.filter(
            processo=self.processo, descricao="Distribuição"
        ).first()

        self.assertIsNotNone(movimentacao)
        self.assertEqual(movimentacao.data_movimentacao.date(), date(2026, 3, 10))
        self.assertEqual(movimentacao.origem, "datajud")

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_consultar_duas_vezes_nao_duplica(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            self.client.post(self.url)
            segunda = self.client.post(self.url)

        self.assertEqual(segunda.data["movimentacoes_importadas"], 0)
        self.assertEqual(segunda.data["movimentacoes_ignoradas"], 2)
        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_movimento_novo_e_importado_sem_repetir_os_antigos(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            self.client.post(self.url)

        com_novo = _resposta_datajud(
            movimentos=[
                {"codigo": 26, "nome": "Distribuição", "dataHora": "2026-03-10T09:00:00.000Z"},
                {"codigo": 51, "nome": "Conclusão", "dataHora": "2026-04-02T16:30:00.000Z"},
                {"codigo": 193, "nome": "Sentença", "dataHora": "2026-09-19T11:00:00.000Z"},
            ]
        )
        with patch("advocacia.datajud._chamar_api", return_value=com_novo):
            resposta = self.client.post(self.url)

        self.assertEqual(resposta.data["movimentacoes_importadas"], 1)
        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 3)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_mesmo_codigo_em_datas_diferentes_nao_e_tratado_como_repetido(self):
        """Uma conclusão acontece várias vezes no mesmo processo."""
        movimentos = [
            {"codigo": 51, "nome": "Conclusão", "dataHora": "2026-04-02T16:30:00.000Z"},
            {"codigo": 51, "nome": "Conclusão", "dataHora": "2026-07-15T10:00:00.000Z"},
        ]
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud(movimentos)):
            resposta = self.client.post(self.url)

        self.assertEqual(resposta.data["movimentacoes_importadas"], 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_processo_inexistente_no_tribunal_devolve_404(self):
        with patch("advocacia.datajud._chamar_api", return_value={"hits": {"hits": []}}):
            resposta = self.client.post(self.url)

        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    @override_settings(DATAJUD_API_KEY="")
    def test_sem_chave_configurada_explica_o_que_falta(self):
        resposta = self.client.post(self.url)

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("DATAJUD_API_KEY", resposta.data["detail"])

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_chave_recusada_pelo_cnj_gera_mensagem_clara(self):
        erro = urllib.error.HTTPError(url="u", code=401, msg="Unauthorized", hdrs=None, fp=None)
        with patch("advocacia.datajud._chamar_api", side_effect=erro):
            resposta = self.client.post(self.url)

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("chave", resposta.data["detail"].lower())

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_falha_de_rede_nao_quebra_a_requisicao(self):
        with patch("advocacia.datajud._chamar_api", side_effect=urllib.error.URLError("sem rede")):
            resposta = self.client.post(self.url)

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("alcançar", resposta.data["detail"])

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_consulta_registra_auditoria(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            self.client.post(self.url)

        registro = RegistroAuditoria.objects.filter(
            escritorio=self.escritorio, descricao__icontains="DataJud"
        ).first()

        self.assertIsNotNone(registro)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_processo_de_outro_escritorio_nao_e_consultavel(self):
        outro = Escritorio.objects.create(
            nome="Outro Escritório DJ",
            cnpj="55.555.555/0001-55",
            email="outro5@escritorio.com",
            telefone="11900000003",
            endereco="Rua T",
        )
        cliente_alheio = Cliente.objects.create(
            escritorio=outro, nome="C", cpf="22222222222",
            email="c2@outro.com", telefone="11900000004", endereco="Rua S",
        )
        usuario_alheio = Usuario.objects.create(
            escritorio=outro, nome="A", email="a2@outro.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
        )
        advogado_alheio = Advogado.objects.create(
            escritorio=outro, usuario=usuario_alheio, oab="565656/SP", especialidade="Civil",
        )
        processo_alheio = Processo.objects.create(
            escritorio=outro, numero_processo="0009999-90.2026.8.26.0032",
            titulo="Alheio", descricao="d", cliente=cliente_alheio, advogado=advogado_alheio,
        )

        resposta = self.client.post(
            f"/api/processos/{processo_alheio.id}/consultar-datajud/"
        )

        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)


class SincronizacaoDataJudTestCase(TestCase):
    """Testa a rotina agendada que consulta o DataJud e avisa sobre andamentos."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)
        PreferenciasUsuario.objects.create(
            usuario=self.usuario, notificacao_movimentacao=True
        )
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Sync",
            cpf="10101010101",
            email="cliente.sync@teste.com",
            telefone="11911112222",
            endereco="Rua S",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Sync",
            email="advogado.sync@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="787878/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="0005678-90.2026.8.26.0032",
            titulo="Processo Sync",
            descricao="Descrição.",
            cliente=cliente,
            advogado=self.advogado,
            status="Em andamento",
        )

    def _processo_extra(self, numero, status):
        return Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo=numero,
            titulo=f"Processo {status}",
            descricao="Descrição.",
            cliente=self.processo.cliente,
            advogado=self.advogado,
            status=status,
        )

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_importa_andamentos_e_avisa(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            call_command("sincronizar_datajud")

        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 2)
        avisos = [m for m in mail.outbox if "Andamento novo" in m.subject]
        self.assertEqual(len(avisos), 1)
        self.assertEqual(avisos[0].to, [self.usuario.email])

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_sem_andamento_novo_nao_avisa(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            call_command("sincronizar_datajud")
            Processo.objects.update(datajud_sincronizado_em=None)
            mail.outbox.clear()
            call_command("sincronizar_datajud")

        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_processo_concluido_nao_e_consultado(self):
        Processo.objects.filter(pk=self.processo.pk).update(status="Concluido")

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()) as chamada:
            call_command("sincronizar_datajud")

        chamada.assert_not_called()

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_processo_suspenso_continua_sendo_acompanhado(self):
        Processo.objects.filter(pk=self.processo.pk).update(status="Suspenso")

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()) as chamada:
            call_command("sincronizar_datajud")

        self.assertTrue(chamada.called)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_nao_reconsulta_antes_do_intervalo(self):
        Processo.objects.filter(pk=self.processo.pk).update(
            datajud_sincronizado_em=timezone.now()
        )

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()) as chamada:
            call_command("sincronizar_datajud", "--intervalo-horas", "12")

        chamada.assert_not_called()

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_falha_em_um_processo_nao_interrompe_os_demais(self):
        """Um número fora do padrão não pode abortar a varredura inteira."""
        Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="numero-invalido",
            titulo="Processo com número ruim",
            descricao="Descrição.",
            cliente=self.processo.cliente,
            advogado=self.advogado,
            status="Em andamento",
        )

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            call_command("sincronizar_datajud")

        # O processo válido foi sincronizado mesmo com o outro falhando.
        self.processo.refresh_from_db()
        self.assertIsNotNone(self.processo.datajud_sincronizado_em)
        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_limite_restringe_a_quantidade_por_execucao(self):
        for indice in range(3):
            self._processo_extra(f"000000{indice}-90.2026.8.26.0032", "Em andamento")

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()) as chamada:
            call_command("sincronizar_datajud", "--limite", "2")

        self.assertEqual(chamada.call_count, 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_processo_nunca_sincronizado_tem_prioridade_na_fila(self):
        """No Postgres, ASC põe NULL por último: sem nulls_first, um processo
        novo ficaria no fim da fila e o limite nunca o alcançaria."""
        Processo.objects.filter(pk=self.processo.pk).update(
            datajud_sincronizado_em=timezone.now() - timezone.timedelta(days=5)
        )
        novo_processo = self._processo_extra("0007777-90.2026.8.26.0032", "Em andamento")

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            call_command("sincronizar_datajud", "--limite", "1")

        novo_processo.refresh_from_db()
        self.assertIsNotNone(novo_processo.datajud_sincronizado_em)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_dry_run_nao_consulta_nem_grava(self):
        with patch("advocacia.datajud._chamar_api") as chamada:
            call_command("sincronizar_datajud", "--dry-run")

        chamada.assert_not_called()
        self.processo.refresh_from_db()
        self.assertIsNone(self.processo.datajud_sincronizado_em)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_preferencia_desligada_nao_recebe_aviso(self):
        self.usuario.preferencias.notificacao_movimentacao = False
        self.usuario.preferencias.save()

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            call_command("sincronizar_datajud")

        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_escritorio_inativo_nao_e_sincronizado(self):
        Escritorio.objects.filter(pk=self.escritorio.pk).update(ativo=False)

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()) as chamada:
            call_command("sincronizar_datajud")

        chamada.assert_not_called()


class RelatorioFinanceiroAPITestCase(APITestCase):
    """O relatório de cliente e o de processo nasceram antes dos módulos de
    contrato, horas e despesas, e por isso mostravam só processos, documentos
    e agenda. Estes testes cobrem a parte financeira que faltava."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Relatório",
            cpf="66666666666",
            email="cliente.relatorio@teste.com",
            telefone="11933333333",
            endereco="Rua R",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Relatório",
            email="advogado.relatorio@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="888888/SP",
            especialidade="Cível",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-REL-1",
            titulo="Processo Relatório",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )

        self.contrato = Contrato.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo_honorario="fixo",
            valor_total=Decimal("6000.00"),
            forma_pagamento="parcelado",
            numero_parcelas=3,
        )
        for numero in (1, 2, 3):
            Parcela.objects.create(
                contrato=self.contrato,
                numero=numero,
                valor=Decimal("2000.00"),
                data_vencimento=date(2026, numero, 10),
                status="pago" if numero == 1 else "pendente",
            )

        # Duas horas faturáveis a R$ 300/h e uma de cortesia.
        ApontamentoHora.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            usuario=self.admin,
            data=date(2026, 3, 10),
            minutos=120,
            descricao="Audiência.",
            faturavel=True,
            valor_hora=Decimal("300.00"),
        )
        ApontamentoHora.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            usuario=self.admin,
            data=date(2026, 3, 11),
            minutos=60,
            descricao="Reunião de cortesia.",
            faturavel=False,
        )

        Despesa.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo="custas",
            descricao="Guia de custas iniciais.",
            valor=Decimal("312.45"),
            data=date(2026, 3, 12),
            reembolsavel=True,
            reembolsada=False,
        )
        Despesa.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo="copias",
            descricao="Cópias autenticadas.",
            valor=Decimal("40.00"),
            data=date(2026, 3, 13),
            reembolsavel=False,
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_relatorio_do_cliente_traz_contratos_horas_e_despesas(self):
        resposta = self.client.get(f"/api/configuracoes/relatorio/cliente/{self.cliente.id}/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(len(resposta.data["contratos"]), 1)
        self.assertEqual(len(resposta.data["apontamentos"]), 2)
        self.assertEqual(len(resposta.data["despesas"]), 2)

    def test_resumo_do_cliente_consolida_os_valores(self):
        resposta = self.client.get(f"/api/configuracoes/relatorio/cliente/{self.cliente.id}/")
        resumo = resposta.data["resumo"]

        self.assertEqual(resumo["minutos_trabalhados"], 180)
        self.assertEqual(resumo["minutos_faturaveis"], 120)
        # Só as duas horas faturáveis viram dinheiro: 2h x R$ 300.
        self.assertEqual(Decimal(str(resumo["valor_horas_faturaveis"])), Decimal("600.00"))
        self.assertEqual(Decimal(str(resumo["total_despesas"])), Decimal("352.45"))
        self.assertEqual(Decimal(str(resumo["despesas_a_reembolsar"])), Decimal("312.45"))
        self.assertEqual(Decimal(str(resumo["valor_contratado"])), Decimal("6000.00"))
        self.assertEqual(Decimal(str(resumo["valor_pago"])), Decimal("2000.00"))
        self.assertEqual(Decimal(str(resumo["valor_pendente"])), Decimal("4000.00"))

    def test_hora_sem_valor_hora_nao_entra_no_valor_a_cobrar(self):
        ApontamentoHora.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            usuario=self.admin,
            data=date(2026, 3, 14),
            minutos=60,
            descricao="Hora faturável sem valor combinado.",
            faturavel=True,
            valor_hora=None,
        )

        resposta = self.client.get(f"/api/configuracoes/relatorio/cliente/{self.cliente.id}/")
        resumo = resposta.data["resumo"]

        self.assertEqual(resumo["minutos_faturaveis"], 180)
        self.assertEqual(Decimal(str(resumo["valor_horas_faturaveis"])), Decimal("600.00"))

    def test_relatorio_do_processo_tambem_traz_o_financeiro(self):
        resposta = self.client.get(f"/api/configuracoes/relatorio/processo/{self.processo.id}/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(len(resposta.data["contratos"]), 1)
        self.assertEqual(len(resposta.data["apontamentos"]), 2)
        self.assertEqual(
            Decimal(str(resposta.data["resumo"]["valor_pendente"])), Decimal("4000.00")
        )

    def test_relatorio_nao_soma_dados_de_outro_cliente(self):
        outro_cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Outro Cliente",
            cpf="77777777777",
            email="outro.cliente@teste.com",
            telefone="11944444444",
            endereco="Rua O",
        )
        outro_processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-REL-2",
            titulo="Processo de outro cliente",
            descricao="Descrição.",
            cliente=outro_cliente,
            advogado=self.advogado,
        )
        Despesa.objects.create(
            escritorio=self.escritorio,
            processo=outro_processo,
            tipo="custas",
            descricao="Despesa alheia.",
            valor=Decimal("999.00"),
            data=date(2026, 3, 15),
        )

        resposta = self.client.get(f"/api/configuracoes/relatorio/cliente/{self.cliente.id}/")

        self.assertEqual(len(resposta.data["despesas"]), 2)
        self.assertEqual(
            Decimal(str(resposta.data["resumo"]["total_despesas"])), Decimal("352.45")
        )

    def test_cliente_sem_lancamentos_tem_resumo_zerado(self):
        cliente_novo = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Sem Nada",
            cpf="88888888888",
            email="cliente.sem.nada@teste.com",
            telefone="11955555555",
            endereco="Rua S",
        )

        resposta = self.client.get(f"/api/configuracoes/relatorio/cliente/{cliente_novo.id}/")
        resumo = resposta.data["resumo"]

        self.assertEqual(resumo["minutos_trabalhados"], 0)
        self.assertEqual(Decimal(str(resumo["valor_contratado"])), Decimal("0.00"))
        self.assertEqual(Decimal(str(resumo["valor_pendente"])), Decimal("0.00"))

    def test_email_do_relatorio_de_cliente_lista_o_financeiro(self):
        resposta = self.client.post(
            f"/api/configuracoes/relatorio/cliente/{self.cliente.id}/email/",
            {"destinatario": "destino@teste.com"},
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(len(mail.outbox), 1)

        corpo_html = mail.outbox[0].alternatives[0][0]
        self.assertIn("Contratos", corpo_html)
        self.assertIn("Guia de custas iniciais.", corpo_html)
        self.assertIn("Audiência.", corpo_html)
        self.assertIn("R$ 4.000,00", corpo_html)
        # Hora de cortesia aparece, mas sem valor a cobrar.
        self.assertIn("não faturável", corpo_html)
        # Datas chegam ao builder já serializadas em ISO e precisam sair em pt-BR.
        self.assertIn("10/03/2026", corpo_html)
        self.assertNotIn("2026-03-10", corpo_html)

    def test_email_do_relatorio_de_processo_lista_o_financeiro(self):
        resposta = self.client.post(
            f"/api/configuracoes/relatorio/processo/{self.processo.id}/email/",
            {"destinatario": "destino@teste.com"},
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        corpo_html = mail.outbox[0].alternatives[0][0]
        self.assertIn("Despesas", corpo_html)
        self.assertIn("R$ 352,45", corpo_html)


class IndicadoresFinanceirosAPITestCase(APITestCase):
    """A dashboard só mostrava contagens — nenhum número de dinheiro, embora
    contratos, parcelas, horas e despesas já estivessem no banco."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Indicadores",
            cpf="99999999999",
            email="cliente.indicadores@teste.com",
            telefone="11966666666",
            endereco="Rua I",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Indicadores",
            email="advogado.indicadores@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="999999/SP",
            especialidade="Cível",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-IND-1",
            titulo="Processo Indicadores",
            descricao="Descrição.",
            cliente=cliente,
            advogado=advogado,
        )
        self.contrato = Contrato.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo_honorario="fixo",
            valor_total=Decimal("3000.00"),
            forma_pagamento="parcelado",
            numero_parcelas=3,
        )
        self.hoje = timezone.localdate()
        self.inicio_do_mes = self.hoje.replace(day=1)

        # Uma parcela quitada neste mês, uma vencida e uma a vencer.
        self.paga = Parcela.objects.create(
            contrato=self.contrato,
            numero=1,
            valor=Decimal("1000.00"),
            data_vencimento=self.inicio_do_mes,
            status="pago",
            pago_em=timezone.now(),
        )
        self.vencida = Parcela.objects.create(
            contrato=self.contrato,
            numero=2,
            valor=Decimal("1000.00"),
            data_vencimento=self.hoje - timedelta(days=5),
            status="pendente",
        )
        self.a_vencer = Parcela.objects.create(
            contrato=self.contrato,
            numero=3,
            valor=Decimal("1000.00"),
            data_vencimento=self.hoje + timedelta(days=30),
            status="pendente",
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def _financeiro(self):
        resposta = self.client.get("/api/dashboard/stats/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        return resposta.data["financeiro"]

    def test_a_receber_soma_as_parcelas_em_aberto(self):
        self.assertEqual(Decimal(str(self._financeiro()["a_receber"])), Decimal("2000.00"))

    def test_recebido_no_mes_conta_so_o_que_foi_quitado_desde_o_dia_primeiro(self):
        self.assertEqual(
            Decimal(str(self._financeiro()["recebido_no_mes"])), Decimal("1000.00")
        )

    def test_parcela_quitada_no_mes_passado_nao_entra_no_recebido_do_mes(self):
        self.paga.pago_em = timezone.now() - timedelta(days=45)
        self.paga.save()

        self.assertEqual(Decimal(str(self._financeiro()["recebido_no_mes"])), Decimal("0.00"))

    def test_vencidas_olham_a_data_e_nao_o_status_da_parcela(self):
        # O status "atrasado" existe no modelo mas nada o atribui; quem decide
        # é a comparação do vencimento com a data de hoje.
        financeiro = self._financeiro()

        self.assertEqual(financeiro["parcelas_vencidas"], 1)
        self.assertEqual(Decimal(str(financeiro["valor_vencido"])), Decimal("1000.00"))

    def test_parcela_vencida_mas_ja_paga_nao_conta_como_vencida(self):
        self.vencida.status = "pago"
        self.vencida.pago_em = timezone.now()
        self.vencida.save()

        self.assertEqual(self._financeiro()["parcelas_vencidas"], 0)

    def test_horas_faturaveis_do_mes_somam_tempo_e_valor(self):
        ApontamentoHora.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            usuario=self.admin,
            data=self.hoje,
            minutos=120,
            descricao="Audiência.",
            faturavel=True,
            valor_hora=Decimal("250.00"),
        )
        ApontamentoHora.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            usuario=self.admin,
            data=self.hoje,
            minutos=30,
            descricao="Cortesia.",
            faturavel=False,
        )

        financeiro = self._financeiro()

        self.assertEqual(financeiro["minutos_faturaveis_no_mes"], 120)
        self.assertEqual(
            Decimal(str(financeiro["valor_horas_faturaveis_no_mes"])), Decimal("500.00")
        )

    def test_despesas_a_reembolsar_ignoram_as_ja_reembolsadas(self):
        Despesa.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo="custas",
            descricao="A reembolsar.",
            valor=Decimal("200.00"),
            data=self.hoje,
            reembolsavel=True,
            reembolsada=False,
        )
        Despesa.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo="copias",
            descricao="Já reembolsada.",
            valor=Decimal("80.00"),
            data=self.hoje,
            reembolsavel=True,
            reembolsada=True,
        )

        self.assertEqual(
            Decimal(str(self._financeiro()["despesas_a_reembolsar"])), Decimal("200.00")
        )

    def test_escritorio_sem_movimento_recebe_zeros(self):
        outro = _criar_escritorio(nome="Escritório Vazio", cnpj="11222333000181")
        usuario = _criar_usuario(outro, email="admin.vazio@teste.com")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(usuario)}"
        )

        financeiro = self._financeiro()

        self.assertEqual(Decimal(str(financeiro["a_receber"])), Decimal("0.00"))
        self.assertEqual(financeiro["parcelas_vencidas"], 0)
        self.assertEqual(financeiro["minutos_faturaveis_no_mes"], 0)

    def test_indicadores_nao_misturam_escritorios(self):
        outro = _criar_escritorio(nome="Escritório Vizinho", cnpj="11222333000262")
        usuario = _criar_usuario(outro, email="admin.vizinho@teste.com")
        cliente = Cliente.objects.create(
            escritorio=outro,
            nome="Cliente do Vizinho",
            cpf="10101010101",
            email="cliente.vizinho@teste.com",
            telefone="11977777777",
            endereco="Rua V",
        )
        usuario_adv = Usuario.objects.create(
            escritorio=outro,
            nome="Advogado Vizinho",
            email="advogado.vizinho@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        adv = Advogado.objects.create(
            escritorio=outro, usuario=usuario_adv, oab="101010/SP", especialidade="Cível"
        )
        processo = Processo.objects.create(
            escritorio=outro,
            numero_processo="PROC-VIZ-1",
            titulo="Processo do vizinho",
            descricao="Descrição.",
            cliente=cliente,
            advogado=adv,
        )
        contrato = Contrato.objects.create(
            escritorio=outro,
            processo=processo,
            tipo_honorario="fixo",
            valor_total=Decimal("9000.00"),
        )
        Parcela.objects.create(
            contrato=contrato,
            numero=1,
            valor=Decimal("9000.00"),
            data_vencimento=self.hoje,
            status="pendente",
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(usuario)}"
        )
        self.assertEqual(Decimal(str(self._financeiro()["a_receber"])), Decimal("9000.00"))


class TarefaAPITestCase(APITestCase):
    """A Agenda guarda compromissos e prazos com hora marcada. O trabalho
    interno do escritório — levantar jurisprudência, revisar uma minuta —
    não tinha onde ser registrado nem a quem ser atribuído."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.colega = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Bruno Advogado",
            email="bruno@escritorio.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        PreferenciasUsuario.objects.create(usuario=self.colega)

        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Tarefa",
            cpf="12312312312",
            email="cliente.tarefa@teste.com",
            telefone="11911111111",
            endereco="Rua T",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=self.colega,
            oab="123123/SP",
            especialidade="Cível",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-TAR-1",
            titulo="Processo Tarefa",
            descricao="Descrição.",
            cliente=cliente,
            advogado=advogado,
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def _criar(self, **extras):
        dados = {
            "titulo": "Levantar jurisprudência sobre horas in itinere",
            "responsavel": self.colega.id,
            "prioridade": "alta",
        }
        dados.update(extras)
        return self.client.post("/api/tarefas/", dados)

    def test_criar_tarefa_registra_quem_atribuiu(self):
        resposta = self._criar()

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        self.assertEqual(resposta.data["responsavel_nome"], "Bruno Advogado")
        self.assertEqual(resposta.data["criado_por_nome"], self.admin.nome)
        self.assertEqual(resposta.data["status"], "aberta")

    def test_tarefa_pode_existir_sem_processo(self):
        resposta = self._criar(titulo="Renovar o certificado digital do escritório")

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        self.assertIsNone(resposta.data["processo"])

    def test_tarefa_pode_ser_vinculada_a_um_processo(self):
        resposta = self._criar(processo=self.processo.id)

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        self.assertEqual(resposta.data["numero_processo"], "PROC-TAR-1")

    def test_titulo_em_branco_e_recusado(self):
        resposta = self._criar(titulo="   ")

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("titulo", resposta.data)

    def test_responsavel_de_outro_escritorio_e_recusado(self):
        outro = _criar_escritorio(nome="Escritório Alheio", cnpj="11222333000181")
        estranho = _criar_usuario(outro, email="estranho@alheio.com")

        resposta = self._criar(responsavel=estranho.id)

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("responsavel", resposta.data)

    def test_nao_atribui_tarefa_a_usuario_inativo(self):
        self.colega.ativo = False
        self.colega.save()

        resposta = self._criar()

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("responsavel", resposta.data)

    def test_responsavel_e_avisado_por_email(self):
        mail.outbox = []

        self._criar(prazo=(timezone.localdate() + timedelta(days=3)).isoformat())

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["bruno@escritorio.com"])
        self.assertIn("tarefa", mail.outbox[0].subject.lower())

    def test_quem_se_atribui_uma_tarefa_nao_recebe_aviso_de_si_mesmo(self):
        PreferenciasUsuario.objects.create(usuario=self.admin)
        mail.outbox = []

        self._criar(responsavel=self.admin.id)

        self.assertEqual(len(mail.outbox), 0)

    def test_aviso_respeita_a_preferencia_do_responsavel(self):
        preferencias = self.colega.preferencias
        preferencias.notificacao_tarefa_atribuida = False
        preferencias.save()
        mail.outbox = []

        self._criar()

        self.assertEqual(len(mail.outbox), 0)

    def test_concluir_tarefa_grava_a_data_de_conclusao(self):
        tarefa_id = self._criar().data["id"]

        resposta = self.client.patch(f"/api/tarefas/{tarefa_id}/", {"status": "concluida"})

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertIsNotNone(resposta.data["concluida_em"])

    def test_reabrir_tarefa_limpa_a_data_de_conclusao(self):
        tarefa_id = self._criar().data["id"]
        self.client.patch(f"/api/tarefas/{tarefa_id}/", {"status": "concluida"})

        resposta = self.client.patch(f"/api/tarefas/{tarefa_id}/", {"status": "em_andamento"})

        self.assertIsNone(resposta.data["concluida_em"])

    def test_tarefa_com_prazo_vencido_aparece_como_atrasada(self):
        resposta = self._criar(prazo=(timezone.localdate() - timedelta(days=1)).isoformat())

        self.assertTrue(resposta.data["atrasada"])

    def test_tarefa_concluida_nao_conta_como_atrasada(self):
        tarefa_id = self._criar(
            prazo=(timezone.localdate() - timedelta(days=1)).isoformat()
        ).data["id"]

        resposta = self.client.patch(f"/api/tarefas/{tarefa_id}/", {"status": "concluida"})

        self.assertFalse(resposta.data["atrasada"])

    def test_tarefa_sem_prazo_nunca_esta_atrasada(self):
        resposta = self._criar()

        self.assertFalse(resposta.data["atrasada"])

    def test_filtro_responsavel_eu_traz_so_as_minhas(self):
        self._criar()
        self._criar(titulo="Minha própria tarefa", responsavel=self.admin.id)

        resposta = self.client.get("/api/tarefas/?responsavel=eu")
        titulos = [t["titulo"] for t in resposta.data["results"]]

        self.assertEqual(titulos, ["Minha própria tarefa"])

    def test_filtro_abertas_deixa_de_fora_concluidas_e_canceladas(self):
        aberta = self._criar(titulo="Ainda por fazer").data["id"]
        concluida = self._criar(titulo="Já feita").data["id"]
        cancelada = self._criar(titulo="Não vai mais").data["id"]
        self.client.patch(f"/api/tarefas/{concluida}/", {"status": "concluida"})
        self.client.patch(f"/api/tarefas/{cancelada}/", {"status": "cancelada"})

        resposta = self.client.get("/api/tarefas/?status=abertas")
        ids = [t["id"] for t in resposta.data["results"]]

        self.assertEqual(ids, [aberta])

    def test_trocar_o_responsavel_avisa_o_novo(self):
        tarefa_id = self._criar(responsavel=self.admin.id).data["id"]
        mail.outbox = []

        self.client.patch(f"/api/tarefas/{tarefa_id}/", {"responsavel": self.colega.id})

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["bruno@escritorio.com"])

    def test_editar_sem_trocar_responsavel_nao_reenvia_aviso(self):
        tarefa_id = self._criar().data["id"]
        mail.outbox = []

        self.client.patch(f"/api/tarefas/{tarefa_id}/", {"prioridade": "baixa"})

        self.assertEqual(len(mail.outbox), 0)

    def test_alta_prioridade_vem_antes_de_media_e_baixa(self):
        # Ordenar os campos de texto direto daria a ordem alfabética, em que
        # "media" vem antes de "alta".
        self._criar(titulo="Prioridade média", prioridade="media")
        self._criar(titulo="Prioridade baixa", prioridade="baixa")
        self._criar(titulo="Prioridade alta", prioridade="alta")

        resposta = self.client.get("/api/tarefas/")
        titulos = [t["titulo"] for t in resposta.data["results"]]

        self.assertEqual(
            titulos, ["Prioridade alta", "Prioridade média", "Prioridade baixa"]
        )

    def test_entre_tarefas_de_mesma_prioridade_vence_o_prazo_mais_proximo(self):
        hoje = timezone.localdate()
        self._criar(titulo="Para a semana que vem", prazo=(hoje + timedelta(days=7)).isoformat())
        self._criar(titulo="Para amanhã", prazo=(hoje + timedelta(days=1)).isoformat())
        self._criar(titulo="Sem prazo nenhum")

        resposta = self.client.get("/api/tarefas/")
        titulos = [t["titulo"] for t in resposta.data["results"]]

        self.assertEqual(
            titulos, ["Para amanhã", "Para a semana que vem", "Sem prazo nenhum"]
        )

    def test_tarefa_encerrada_vai_para_o_fim_da_lista(self):
        # "cancelada" vem antes de "em_andamento" em ordem alfabética, mas
        # quem trabalha quer ver primeiro o que ainda está aberto.
        concluida = self._criar(titulo="Já resolvida", prioridade="alta").data["id"]
        self.client.patch(f"/api/tarefas/{concluida}/", {"status": "concluida"})
        self._criar(titulo="Ainda pendente", prioridade="baixa")

        resposta = self.client.get("/api/tarefas/")
        titulos = [t["titulo"] for t in resposta.data["results"]]

        self.assertEqual(titulos, ["Ainda pendente", "Já resolvida"])

    def test_tarefa_de_outro_escritorio_nao_aparece(self):
        self._criar()
        outro = _criar_escritorio(nome="Escritório Vizinho", cnpj="11222333000262")
        usuario = _criar_usuario(outro, email="admin.vizinho@teste.com")
        Tarefa.objects.create(
            escritorio=outro,
            titulo="Tarefa do vizinho",
            responsavel=usuario,
        )

        resposta = self.client.get("/api/tarefas/")
        titulos = [t["titulo"] for t in resposta.data["results"]]

        self.assertNotIn("Tarefa do vizinho", titulos)


class IsolamentoEAutorizacaoTestCase(APITestCase):
    """Cobre o que a suíte não cobria: escrita entre escritórios, escalada de
    privilégio e validade da conta a cada requisição.

    Os 244 testes anteriores passavam com essas falhas abertas porque quase
    todos usavam um escritório só, e os que usavam dois conferiam apenas se
    a LISTAGEM vazava. Nenhum tentava escrever com identificador alheio.
    """

    def setUp(self):
        self.a = _criar_escritorio()
        self.b = _criar_escritorio(nome="Escritório B", cnpj="98765432000199")

        self.advogado_a = _criar_usuario(self.a, email="adv@a.com", tipo_usuario="advogado")
        self.admin_a = _criar_usuario(self.a, email="admin@a.com", tipo_usuario="admin")

        self.cliente_b = Cliente.objects.create(
            escritorio=self.b, nome="Cliente do B", cpf="55544433322",
            email="cliente@b.com", telefone="11955554444", endereco="Rua B",
        )
        usuario_adv_b = _criar_usuario(self.b, email="adv@b.com", tipo_usuario="advogado")
        self.advogado_b = Advogado.objects.create(
            escritorio=self.b, usuario=usuario_adv_b, oab="333333/SP", especialidade="Cível",
        )
        self.processo_b = Processo.objects.create(
            escritorio=self.b, numero_processo="PROC-B-1", titulo="Do escritório B",
            descricao="Descrição.", cliente=self.cliente_b, advogado=self.advogado_b,
        )

        self._entrar_como(self.advogado_a)

    def _entrar_como(self, usuario):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(usuario)}"
        )

    # ---------- escalada de privilégio ----------

    def test_advogado_nao_se_promove_a_administrador(self):
        resposta = self.client.patch(
            f"/api/usuarios/{self.advogado_a.id}/", {"tipo_usuario": "admin"}
        )

        self.advogado_a.refresh_from_db()
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.advogado_a.tipo_usuario, "advogado")

    def test_a_rota_generica_nao_troca_senha(self):
        senha_antes = self.advogado_a.senha

        resposta = self.client.patch(f"/api/usuarios/{self.advogado_a.id}/", {"senha": "a"})

        self.advogado_a.refresh_from_db()
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.advogado_a.senha, senha_antes)

    def test_advogado_nao_reativa_a_propria_conta(self):
        resposta = self.client.patch(f"/api/usuarios/{self.advogado_a.id}/", {"ativo": True})

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_advogado_nao_edita_outro_usuario(self):
        resposta = self.client.patch(
            f"/api/usuarios/{self.admin_a.id}/", {"nome": "Nome trocado"}
        )

        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_cada_um_edita_os_proprios_dados(self):
        resposta = self.client.patch(
            f"/api/usuarios/{self.advogado_a.id}/", {"telefone": "11912345678"}
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)

    def test_administrador_troca_o_perfil_de_outro(self):
        self._entrar_como(self.admin_a)

        resposta = self.client.post(
            f"/api/usuarios/{self.advogado_a.id}/definir-perfil/", {"tipo_usuario": "admin"}
        )

        self.advogado_a.refresh_from_db()
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(self.advogado_a.tipo_usuario, "admin")

    def test_administrador_nao_altera_o_proprio_perfil(self):
        self._entrar_como(self.admin_a)

        resposta = self.client.post(
            f"/api/usuarios/{self.admin_a.id}/definir-perfil/", {"tipo_usuario": "advogado"}
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_escritorio_nao_fica_sem_administrador(self):
        outro_admin = _criar_usuario(self.a, email="admin2@a.com", tipo_usuario="admin")
        self._entrar_como(self.admin_a)

        resposta = self.client.post(
            f"/api/usuarios/{outro_admin.id}/definir-perfil/", {"tipo_usuario": "advogado"}
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)

        # Agora só resta um administrador: rebaixá-lo deixaria o escritório sem nenhum.
        self._entrar_como(outro_admin)
        resposta = self.client.post(
            f"/api/usuarios/{self.admin_a.id}/definir-perfil/", {"tipo_usuario": "advogado"}
        )
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_apenas_administrador_desativa_usuario(self):
        resposta = self.client.post(f"/api/usuarios/{self.admin_a.id}/alternar-ativo/")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

        self._entrar_como(self.admin_a)
        resposta = self.client.post(f"/api/usuarios/{self.advogado_a.id}/alternar-ativo/")
        self.advogado_a.refresh_from_db()
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertFalse(self.advogado_a.ativo)

    # ---------- isolamento na escrita ----------

    def test_processo_nao_aceita_cliente_de_outro_escritorio(self):
        resposta = self.client.post("/api/processos/", {
            "numero_processo": "PROC-A-1", "titulo": "Tentativa", "descricao": "d",
            "cliente": self.cliente_b.id, "advogado": self.advogado_b.id,
            "status": "Em andamento",
        })

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cliente", resposta.data)
        self.assertFalse(Processo.objects.filter(numero_processo="PROC-A-1").exists())

    def test_movimentacao_nao_entra_em_processo_alheio(self):
        resposta = self.client.post(
            "/api/movimentacoes/", {"processo": self.processo_b.id, "descricao": "Invasão."}
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Movimentacao.objects.filter(processo=self.processo_b).exists())

    def test_agenda_nao_entra_em_processo_alheio(self):
        resposta = self.client.post("/api/agenda/", {
            "processo": self.processo_b.id, "titulo": "Audiência alheia",
            "tipo": "compromisso", "data_evento": timezone.now().isoformat(),
        })

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_apontamento_nao_entra_em_processo_alheio(self):
        resposta = self.client.post("/api/apontamentos/", {
            "processo": self.processo_b.id, "data": timezone.localdate().isoformat(),
            "minutos": 60, "descricao": "Trabalho alheio.",
        })

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_despesa_nao_entra_em_processo_alheio(self):
        resposta = self.client.post("/api/despesas/", {
            "processo": self.processo_b.id, "tipo": "custas", "descricao": "Custa alheia.",
            "valor": "100.00", "data": timezone.localdate().isoformat(),
        })

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_contrato_nao_entra_em_processo_alheio(self):
        resposta = self.client.post("/api/contratos/", {
            "processo": self.processo_b.id, "tipo_honorario": "fixo",
            "valor_total": "1000.00", "forma_pagamento": "avista",
        })

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_a_mensagem_nao_confirma_a_existencia_do_registro_alheio(self):
        # Dizer "sem permissão" revelaria que aquele id existe.
        resposta = self.client.post(
            "/api/movimentacoes/", {"processo": self.processo_b.id, "descricao": "x"}
        )

        self.assertIn("não encontrado", str(resposta.data).lower())

    # ---------- validade da conta ----------

    def test_usuario_desativado_perde_o_acesso_imediatamente(self):
        self.assertEqual(self.client.get("/api/clientes/").status_code, status.HTTP_200_OK)

        self.advogado_a.ativo = False
        self.advogado_a.save()

        self.assertEqual(
            self.client.get("/api/clientes/").status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_escritorio_desativado_derruba_os_usuarios(self):
        self.a.ativo = False
        self.a.save()

        self.assertEqual(
            self.client.get("/api/clientes/").status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_refresh_nao_renova_acesso_de_conta_desativada(self):
        refresh = _gerar_refresh_token(self.advogado_a)
        self.client.credentials()

        resposta = self.client.post("/api/token/refresh/", {"refresh": refresh})
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)

        self.advogado_a.ativo = False
        self.advogado_a.save()

        resposta = self.client.post("/api/token/refresh/", {"refresh": refresh})
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    # ---------- histórico ----------

    def test_excluir_cliente_com_processo_e_recusado(self):
        self._entrar_como(self.admin_a)
        cliente = Cliente.objects.create(
            escritorio=self.a, nome="Cliente com caso", cpf="11122233344",
            email="comcaso@a.com", telefone="11944443333", endereco="Rua A",
        )
        usuario_adv = _criar_usuario(self.a, email="adv3@a.com", tipo_usuario="advogado")
        advogado = Advogado.objects.create(
            escritorio=self.a, usuario=usuario_adv, oab="444444/SP", especialidade="Cível",
        )
        processo = Processo.objects.create(
            escritorio=self.a, numero_processo="PROC-A-9", titulo="Caso",
            descricao="d", cliente=cliente, advogado=advogado,
        )

        resposta = self.client.delete(f"/api/clientes/{cliente.id}/")

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Processo.objects.filter(id=processo.id).exists())
        self.assertTrue(Cliente.objects.filter(id=cliente.id).exists())

    def test_cliente_sem_processo_continua_excluivel(self):
        self._entrar_como(self.admin_a)
        cliente = Cliente.objects.create(
            escritorio=self.a, nome="Cliente solto", cpf="99988877766",
            email="solto@a.com", telefone="11933332222", endereco="Rua A",
        )

        resposta = self.client.delete(f"/api/clientes/{cliente.id}/")

        self.assertEqual(resposta.status_code, status.HTTP_204_NO_CONTENT)

    # ---------- parâmetros de filtro ----------

    def test_filtro_invalido_responde_400_e_nao_500(self):
        for parametro in ("data_inicio_de=nao-e-data", "data_inicio_ate=32/13/2026",
                          "cliente=abc", "advogado=xyz"):
            with self.subTest(parametro=parametro):
                resposta = self.client.get(f"/api/processos/?{parametro}")
                self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filtro_valido_continua_funcionando(self):
        resposta = self.client.get(
            f"/api/processos/?data_inicio_de=2020-01-01&cliente={self.cliente_b.id}"
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)


class FichaDoProcessoAPITestCase(APITestCase):
    """A ficha reúne, numa resposta só, tudo o que estava espalhado em sete
    painéis — movimentações, documentos, agenda, tarefas, horas, despesas
    e contrato. Existir a rota não bastava: cada bloco precisa vir com o
    formato certo e nenhum vazar de outro escritório."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Ficha",
            cpf="33344455566",
            email="cliente.ficha@teste.com",
            telefone="11977776666",
            endereco="Rua Ficha, 1",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Ficha",
            email="advogado.ficha@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="222222/SP",
            especialidade="Cível",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-FICHA-1",
            titulo="Processo da Ficha",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_ficha_de_processo_vazio_traz_listas_vazias_e_sem_contrato(self):
        resposta = self.client.get(f"/api/processos/{self.processo.id}/ficha/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(resposta.data["processo"]["id"], self.processo.id)
        self.assertEqual(resposta.data["movimentacoes"], [])
        self.assertEqual(resposta.data["documentos"], [])
        self.assertEqual(resposta.data["agenda"], [])
        self.assertEqual(resposta.data["tarefas"], [])
        self.assertEqual(resposta.data["apontamentos"], [])
        self.assertEqual(resposta.data["despesas"], [])
        self.assertIsNone(resposta.data["contrato"])
        self.assertEqual(Decimal(str(resposta.data["resumo"]["valor_contratado"])), Decimal("0.00"))

    def test_ficha_reune_todos_os_blocos_do_processo(self):
        Movimentacao.objects.create(
            processo=self.processo,
            descricao="Juntada de petição.", criado_por=self.admin,
        )
        Agenda.objects.create(
            processo=self.processo,
            titulo="Audiência", tipo="compromisso", data_evento=timezone.now(),
        )
        Tarefa.objects.create(
            escritorio=self.escritorio, processo=self.processo,
            titulo="Revisar minuta", responsavel=self.admin,
        )
        ApontamentoHora.objects.create(
            escritorio=self.escritorio, processo=self.processo, usuario=self.admin,
            data=timezone.localdate(), minutos=90, descricao="Audiência.",
        )
        Despesa.objects.create(
            escritorio=self.escritorio, processo=self.processo, tipo="custas",
            descricao="Guia de custas.", valor=Decimal("312.45"), data=timezone.localdate(),
        )
        contrato = Contrato.objects.create(
            escritorio=self.escritorio, processo=self.processo,
            tipo_honorario="fixo", valor_total=Decimal("5000.00"),
        )

        resposta = self.client.get(f"/api/processos/{self.processo.id}/ficha/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(len(resposta.data["movimentacoes"]), 1)
        self.assertEqual(len(resposta.data["agenda"]), 1)
        self.assertEqual(len(resposta.data["tarefas"]), 1)
        self.assertEqual(len(resposta.data["apontamentos"]), 1)
        self.assertEqual(len(resposta.data["despesas"]), 1)
        self.assertIsNotNone(resposta.data["contrato"])
        self.assertEqual(resposta.data["contrato"]["id"], contrato.id)
        self.assertEqual(
            Decimal(str(resposta.data["resumo"]["valor_contratado"])), Decimal("5000.00")
        )

    def test_ficha_expoe_a_origem_da_movimentacao(self):
        Movimentacao.objects.create(
            processo=self.processo,
            descricao="Lançada à mão.", criado_por=self.admin, origem="manual",
        )
        Movimentacao.objects.create(
            processo=self.processo,
            descricao="Importada do tribunal.", origem="datajud",
            identificador_externo="123:2026-01-01T00:00:00",
        )

        resposta = self.client.get(f"/api/processos/{self.processo.id}/ficha/")

        origens = {m["origem"] for m in resposta.data["movimentacoes"]}
        self.assertEqual(origens, {"manual", "datajud"})

    def test_ficha_nao_alcanca_processo_de_outro_escritorio(self):
        outro_escritorio = _criar_escritorio(nome="Escritório Alheio", cnpj="11222333000181")
        outro_cliente = Cliente.objects.create(
            escritorio=outro_escritorio, nome="Cliente Alheio", cpf="99988877766",
            email="alheio@teste.com", telefone="11966665555", endereco="Rua Alheia, 1",
        )
        outro_usuario_adv = Usuario.objects.create(
            escritorio=outro_escritorio, nome="Advogado Alheio",
            email="advogado.alheio@teste.com", senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        outro_advogado = Advogado.objects.create(
            escritorio=outro_escritorio, usuario=outro_usuario_adv,
            oab="333333/SP", especialidade="Cível",
        )
        processo_alheio = Processo.objects.create(
            escritorio=outro_escritorio, numero_processo="PROC-ALHEIO-1",
            titulo="Processo Alheio", descricao="d",
            cliente=outro_cliente, advogado=outro_advogado,
        )

        resposta = self.client.get(f"/api/processos/{processo_alheio.id}/ficha/")

        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    def test_ficha_exige_autenticacao(self):
        self.client.credentials()

        resposta = self.client.get(f"/api/processos/{self.processo.id}/ficha/")

        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_processo_serializado_traz_data_de_sincronizacao_com_datajud(self):
        agora = timezone.now()
        self.processo.datajud_sincronizado_em = agora
        self.processo.save()

        resposta = self.client.get(f"/api/processos/{self.processo.id}/ficha/")

        self.assertIsNotNone(resposta.data["processo"]["datajud_sincronizado_em"])


class ProximoPrazoDoProcessoAPITestCase(APITestCase):
    """A listagem de processos precisa sinalizar urgência sem que quem usa
    a tela tenha que abrir a ficha de cada um para descobrir se há prazo
    vencendo."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio, nome="Cliente Prazo", cpf="44455566677",
            email="cliente.prazo@teste.com", telefone="11966665555", endereco="Rua P",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio, nome="Advogado Prazo",
            email="advogado.prazo@teste.com", senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio, usuario=usuario_advogado,
            oab="555555/SP", especialidade="Cível",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio, numero_processo="PROC-PRAZO-1",
            titulo="Processo com prazo", descricao="d",
            cliente=self.cliente, advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def _processo_na_listagem(self):
        resposta = self.client.get("/api/processos/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        (item,) = [p for p in resposta.data["results"] if p["id"] == self.processo.id]
        return item

    def test_processo_sem_prazo_nao_tem_proximo_prazo(self):
        item = self._processo_na_listagem()
        self.assertIsNone(item["proximo_prazo"])

    def test_prazo_futuro_aparece_e_nao_esta_atrasado(self):
        Agenda.objects.create(
            processo=self.processo,
            titulo="Contestação", tipo="prazo",
            data_evento=timezone.now() + timedelta(days=3),
        )

        item = self._processo_na_listagem()

        self.assertIsNotNone(item["proximo_prazo"])
        self.assertFalse(item["proximo_prazo"]["atrasado"])

    def test_prazo_vencido_aparece_como_atrasado(self):
        Agenda.objects.create(
            processo=self.processo,
            titulo="Contestação", tipo="prazo",
            data_evento=timezone.now() - timedelta(days=1),
        )

        item = self._processo_na_listagem()

        self.assertTrue(item["proximo_prazo"]["atrasado"])

    def test_prazo_cumprido_nao_conta_como_proximo_prazo(self):
        Agenda.objects.create(
            processo=self.processo,
            titulo="Contestação", tipo="prazo",
            data_evento=timezone.now() - timedelta(days=1), cumprido=True,
        )

        item = self._processo_na_listagem()

        self.assertIsNone(item["proximo_prazo"])

    def test_compromisso_nao_e_confundido_com_prazo(self):
        Agenda.objects.create(
            processo=self.processo,
            titulo="Reunião", tipo="compromisso",
            data_evento=timezone.now() + timedelta(days=1),
        )

        item = self._processo_na_listagem()

        self.assertIsNone(item["proximo_prazo"])

    def test_com_varios_prazos_traz_o_mais_proximo(self):
        Agenda.objects.create(
            processo=self.processo,
            titulo="Prazo distante", tipo="prazo",
            data_evento=timezone.now() + timedelta(days=30), prioridade="normal",
        )
        Agenda.objects.create(
            processo=self.processo,
            titulo="Prazo fatal próximo", tipo="prazo",
            data_evento=timezone.now() + timedelta(days=1), prioridade="fatal",
        )

        item = self._processo_na_listagem()

        self.assertEqual(item["proximo_prazo"]["prioridade"], "fatal")

    def test_processo_recem_criado_tambem_traz_proximo_prazo(self):
        # Fora da listagem paginada (sem o prefetch), o serializer cai para
        # a consulta direta — este teste cobre esse caminho.
        Agenda.objects.create(
            processo=self.processo,
            titulo="Contestação", tipo="prazo",
            data_evento=timezone.now() + timedelta(days=2),
        )

        resposta = self.client.patch(
            f"/api/processos/{self.processo.id}/", {"titulo": "Novo título"}, format="json"
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertIsNotNone(resposta.data["proximo_prazo"])


class ExportacaoCSVSeguraAPITestCase(APITestCase):
    """Um nome ou endereço de cliente que comece com =, +, -, @, tab ou CR
    vira fórmula executável ao abrir o CSV exportado no Excel/Sheets. A
    exportação precisa neutralizar isso sem estragar valores normais."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def _linhas_csv(self, resposta):
        texto = resposta.content.decode("utf-8-sig")
        return list(csv.reader(io.StringIO(texto), delimiter=";"))

    def test_exportacao_de_clientes_neutraliza_nome_com_formula(self):
        Cliente.objects.create(
            escritorio=self.escritorio, nome="=CMD|'/c calc'!A1", cpf="11122233344",
            email="injecao@teste.com", telefone="11988887777", endereco="+SOMA(A1:A9)",
        )
        Cliente.objects.create(
            escritorio=self.escritorio, nome="Cliente Normal", cpf="22233344455",
            email="normal@teste.com", telefone="11977776666", endereco="Rua Normal, 10",
        )

        resposta = self.client.get("/api/configuracoes/exportar/clientes/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

        linhas = self._linhas_csv(resposta)
        linha_injecao = next(l for l in linhas if "CMD" in l[0])
        self.assertTrue(linha_injecao[0].startswith("'="))
        self.assertTrue(linha_injecao[6].startswith("'+"))

        linha_normal = next(l for l in linhas if "Normal" in l[0])
        self.assertEqual(linha_normal[0], "Cliente Normal")
        self.assertEqual(linha_normal[6], "Rua Normal, 10")

    def test_exportacao_de_processos_neutraliza_titulo_com_formula(self):
        cliente = Cliente.objects.create(
            escritorio=self.escritorio, nome="Cliente Proc", cpf="33344455566",
            email="clienteproc@teste.com", telefone="11966665555", endereco="Rua P",
        )
        usuario_adv = Usuario.objects.create(
            escritorio=self.escritorio, nome="Advogado Proc", email="advproc@teste.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio, usuario=usuario_adv, oab="111222/SP", especialidade="Cível",
        )
        Processo.objects.create(
            escritorio=self.escritorio, numero_processo="PROC-CSV-1",
            titulo="@SUM(1+1)*cmd|' /c calc'!A0", descricao="d",
            cliente=cliente, advogado=advogado,
        )

        resposta = self.client.get("/api/configuracoes/exportar/processos/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

        linhas = self._linhas_csv(resposta)
        linha = next(l for l in linhas if "SUM" in l[1])
        self.assertTrue(linha[1].startswith("'@"))


class DownloadAutenticadoAPITestCase(APITestCase):
    """Documento e o documento de identidade de cliente/usuário não saem
    mais como URL direta no serializer — só por uma rota autenticada que
    confere o escritório (e, para usuário, também quem está pedindo)."""

    def setUp(self):
        self.escritorio_a = _criar_escritorio()
        self.admin_a = _criar_usuario(self.escritorio_a)
        self.escritorio_b = _criar_escritorio(
            nome="Outro Escritorio", cnpj="99999999000199", email="outro@teste.com"
        )
        self.admin_b = _criar_usuario(self.escritorio_b, email="admin.b@teste.com")

        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio_a, nome="Cliente Download", cpf="11122233344",
            email="download@teste.com", telefone="11988887777", endereco="Rua D",
            documento_identidade=SimpleUploadedFile("rg.pdf", b"%PDF-1.4\nconteudo do rg"),
        )
        usuario_adv = Usuario.objects.create(
            escritorio=self.escritorio_a, nome="Advogado Download", email="advdownload@teste.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio_a, usuario=usuario_adv, oab="999999/SP", especialidade="Cível",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio_a, numero_processo="PROC-DOWNLOAD-1",
            titulo="Processo Download", descricao="d", cliente=self.cliente, advogado=self.advogado,
        )
        self.documento = Documento.objects.create(
            processo=self.processo, nome_arquivo="peticao.pdf",
            arquivo=SimpleUploadedFile("peticao.pdf", b"%PDF-1.4\nconteudo da peticao"),
        )

    def _entrar_como(self, usuario):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(usuario)}")

    # ---------- documentos do processo ----------

    def test_serializer_de_documento_nao_expoe_url_do_arquivo(self):
        self._entrar_como(self.admin_a)
        resposta = self.client.get(f"/api/documentos/{self.documento.id}/")
        self.assertNotIn("arquivo", resposta.data)

    def test_download_de_documento_do_proprio_escritorio_funciona(self):
        self._entrar_como(self.admin_a)
        resposta = self.client.get(f"/api/documentos/{self.documento.id}/download/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        conteudo = b"".join(resposta.streaming_content)
        self.assertEqual(conteudo, b"%PDF-1.4\nconteudo da peticao")

    def test_download_de_documento_de_outro_escritorio_e_404(self):
        self._entrar_como(self.admin_b)
        resposta = self.client.get(f"/api/documentos/{self.documento.id}/download/")
        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    def test_download_de_documento_sem_autenticacao_e_negado(self):
        resposta = self.client.get(f"/api/documentos/{self.documento.id}/download/")
        self.assertIn(resposta.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    # ---------- documento de identidade do cliente ----------

    def test_serializer_de_cliente_nao_expoe_url_mas_avisa_que_ha_documento(self):
        self._entrar_como(self.admin_a)
        resposta = self.client.get(f"/api/clientes/{self.cliente.id}/")
        self.assertNotIn("documento_identidade", resposta.data)
        self.assertTrue(resposta.data["documento_identidade_enviado"])

    def test_download_do_documento_de_identidade_do_cliente_funciona(self):
        self._entrar_como(self.admin_a)
        resposta = self.client.get(f"/api/clientes/{self.cliente.id}/documento-identidade/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

    def test_download_do_documento_de_identidade_de_cliente_de_outro_escritorio_e_404(self):
        self._entrar_como(self.admin_b)
        resposta = self.client.get(f"/api/clientes/{self.cliente.id}/documento-identidade/")
        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    # ---------- documento de identidade do usuário ----------

    def test_advogado_baixa_o_proprio_documento_de_identidade(self):
        usuario_com_doc = Usuario.objects.create(
            escritorio=self.escritorio_a, nome="Advogado com Doc", email="advcomdoc@teste.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
            documento_identidade=SimpleUploadedFile("oab.pdf", b"%PDF-1.4\ndoc do advogado"),
        )
        self._entrar_como(usuario_com_doc)
        resposta = self.client.get(f"/api/usuarios/{usuario_com_doc.id}/documento-identidade/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

    def test_advogado_nao_baixa_documento_de_identidade_de_outro_advogado(self):
        outro_adv = Usuario.objects.create(
            escritorio=self.escritorio_a, nome="Outro Advogado", email="outroadv@teste.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
            documento_identidade=SimpleUploadedFile("oab2.pdf", b"%PDF-1.4\ndoc do outro"),
        )
        usuario_solicitante = Usuario.objects.create(
            escritorio=self.escritorio_a, nome="Advogado Solicitante", email="solicitante@teste.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
        )
        self._entrar_como(usuario_solicitante)
        resposta = self.client.get(f"/api/usuarios/{outro_adv.id}/documento-identidade/")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_baixa_documento_de_identidade_de_qualquer_usuario_do_escritorio(self):
        usuario_com_doc = Usuario.objects.create(
            escritorio=self.escritorio_a, nome="Advogado com Doc 2", email="advcomdoc2@teste.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
            documento_identidade=SimpleUploadedFile("oab3.pdf", b"%PDF-1.4\ndoc"),
        )
        self._entrar_como(self.admin_a)
        resposta = self.client.get(f"/api/usuarios/{usuario_com_doc.id}/documento-identidade/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
