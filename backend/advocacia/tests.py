from unittest.mock import patch

from django.contrib.auth.hashers import check_password, make_password
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings

from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from django.utils import timezone

from .models import (
    Escritorio,
    Usuario,
    Cliente,
    Advogado,
    Processo,
    Movimentacao,
    Agenda,
    Contrato,
    Parcela,
    SuperAdmin,
    RegistroAuditoria,
    TokenRedefinicaoSenha,
    TokenVerificacaoEmail,
)
from .validators import validar_email_real, validar_tamanho_documento, validar_tamanho_imagem
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
    return str(refresh.access_token)


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
