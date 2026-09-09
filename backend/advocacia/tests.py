from unittest.mock import patch

from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Escritorio, Usuario, Cliente
from .validators import validar_email_real


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

    def test_isolamento_multi_tenant_entre_escritorios(self, _mock_mx):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_b)}"
        )
        resposta = self.client.get("/api/clientes/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        nomes = [cliente["nome"] for cliente in resposta.data]
        self.assertNotIn("Cliente A", nomes)
        self.assertEqual(len(resposta.data), 0)

    def test_admin_ve_apenas_clientes_do_proprio_escritorio(self, _mock_mx):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.get("/api/clientes/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        nomes = [cliente["nome"] for cliente in resposta.data]
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
