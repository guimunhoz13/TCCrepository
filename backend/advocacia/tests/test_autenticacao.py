"""Login, bloqueio, tokens, logout, troca e redefinição de senha, 2FA e limites de taxa."""

from unittest.mock import patch

from django.contrib.auth.hashers import check_password, make_password
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import (
    Cliente,
    RegistroAuditoria,
    SuperAdmin,
    TokenRedefinicaoSenha,
)
from ..views import SolicitarRedefinicaoSenhaView
from .base import (
    _criar_escritorio,
    _criar_usuario,
    _gerar_refresh_token,
    _gerar_token_de_acesso,
)


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

    def _refresh_do_login(self):
        login = self.client.post(
            "/api/login/",
            {"email": "ana@escritorio.com", "senha": "senha12345"},
            format="json",
        )
        return login.data["refresh"]

    def test_renovacao_devolve_um_refresh_novo(self):
        refresh_antigo = self._refresh_do_login()

        resposta = self.client.post(
            "/api/token/refresh/", {"refresh": refresh_antigo}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertIn("refresh", resposta.data)
        self.assertNotEqual(resposta.data["refresh"], refresh_antigo)

    def test_refresh_ja_usado_nao_renova_de_novo(self):
        refresh_antigo = self._refresh_do_login()
        self.client.post("/api/token/refresh/", {"refresh": refresh_antigo}, format="json")

        reuso = self.client.post(
            "/api/token/refresh/", {"refresh": refresh_antigo}, format="json"
        )
        self.assertEqual(reuso.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rotacionado_continua_renovando_e_mantem_as_claims(self):
        refresh_antigo = self._refresh_do_login()
        primeira = self.client.post(
            "/api/token/refresh/", {"refresh": refresh_antigo}, format="json"
        )

        segunda = self.client.post(
            "/api/token/refresh/", {"refresh": primeira.data["refresh"]}, format="json"
        )
        self.assertEqual(segunda.status_code, status.HTTP_200_OK)

        token = RefreshToken(segunda.data["refresh"])
        self.assertEqual(token["user_id"], self.usuario.id)
        self.assertEqual(token["escritorio_id"], self.escritorio.id)
        self.assertEqual(token["session_version"], self.usuario.session_version)

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

    def test_endpoint_sensivel_bloqueia_apos_exceder_o_limite(self):
        # `throttle_classes` de uma view baseada em APIView é resolvido de
        # `api_settings.DEFAULT_THROTTLE_CLASSES` uma única vez, na
        # importação do módulo — antes de qualquer teste rodar, quando
        # TESTING já vale () (ver core/settings.py). Por isso, para este
        # teste específico validar o throttling de verdade, a classe de
        # throttle é ligada diretamente na view em vez de via
        # override_settings (que não afeta um atributo já resolvido).
        from rest_framework.throttling import ScopedRateThrottle

        # As taxas também ficam congeladas em ScopedRateThrottle.THROTTLE_RATES
        # na primeira importação, então são fixadas direto na classe.
        with patch.object(SolicitarRedefinicaoSenhaView, "throttle_classes", [ScopedRateThrottle]), \
                patch.object(ScopedRateThrottle, "THROTTLE_RATES", {"sensivel": "2/minute"}):
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


@override_settings(DEBUG=True)
class VerificacaoEmDuasEtapasAPITestCase(APITestCase):

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)

    def _autenticar(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.usuario)}")

    def _ativar(self):
        import pyotp

        self._autenticar()
        segredo = self.client.post("/api/configuracoes/2fa/", {"acao": "iniciar"}).data["segredo"]
        totp = pyotp.TOTP(segredo)
        ativado = self.client.post("/api/configuracoes/2fa/", {"acao": "ativar", "codigo": totp.now()})
        self.assertEqual(ativado.status_code, status.HTTP_200_OK, ativado.data)
        self.client.credentials()
        return totp

    def _codigo_seguinte(self, totp):
        import time

        return totp.at(time.time() + totp.interval)

    def _login(self):
        return self.client.post(
            "/api/login/", {"email": "ana@escritorio.com", "senha": "senha12345"}, format="json"
        )

    def test_iniciar_devolve_qr_code_sem_ativar_ainda(self):
        self._autenticar()
        resposta = self.client.post("/api/configuracoes/2fa/", {"acao": "iniciar"})
        self.assertTrue(resposta.data["qr_code"].startswith("data:image/svg+xml;base64,"))
        self.assertIn("otpauth://totp/", resposta.data["uri"])
        self.usuario.refresh_from_db()
        self.assertFalse(self.usuario.totp_ativo)

    def test_com_2fa_ativo_a_senha_sozinha_nao_abre_sessao(self):
        self._ativar()
        resposta = self._login()
        self.assertTrue(resposta.data["requer_2fa"])
        self.assertNotIn("access", resposta.data)

    def test_desafio_mais_codigo_abre_a_sessao(self):
        totp = self._ativar()
        desafio = self._login().data["desafio"]
        resposta = self.client.post(
            "/api/login/2fa/", {"desafio": desafio, "codigo": self._codigo_seguinte(totp)}
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertIn("access", resposta.data)

    def test_codigo_errado_e_recusado(self):
        self._ativar()
        desafio = self._login().data["desafio"]
        resposta = self.client.post("/api/login/2fa/", {"desafio": desafio, "codigo": "000000"})
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mesmo_codigo_nao_serve_duas_vezes(self):
        totp = self._ativar()
        codigo = self._codigo_seguinte(totp)
        primeira = self.client.post("/api/login/2fa/", {"desafio": self._login().data["desafio"], "codigo": codigo})
        self.assertEqual(primeira.status_code, status.HTTP_200_OK)
        segunda = self.client.post("/api/login/2fa/", {"desafio": self._login().data["desafio"], "codigo": codigo})
        self.assertEqual(segunda.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_desafio_adulterado_e_recusado(self):
        totp = self._ativar()
        desafio = self._login().data["desafio"] + "x"
        resposta = self.client.post("/api/login/2fa/", {"desafio": desafio, "codigo": totp.now()})
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_desativar_exige_senha_e_codigo(self):
        totp = self._ativar()
        self._autenticar()
        sem_senha = self.client.post(
            "/api/configuracoes/2fa/", {"acao": "desativar", "senha": "errada", "codigo": self._codigo_seguinte(totp)}
        )
        self.assertEqual(sem_senha.status_code, status.HTTP_400_BAD_REQUEST)
        ok = self.client.post(
            "/api/configuracoes/2fa/", {"acao": "desativar", "senha": "senha12345", "codigo": self._codigo_seguinte(totp)}
        )
        self.assertEqual(ok.status_code, status.HTTP_200_OK, ok.data)
        self.assertIn("access", self._login().data)

    def test_admin_redefine_2fa_de_quem_perdeu_o_celular(self):
        self._ativar()
        admin = _criar_usuario(self.escritorio, email="chefe@escritorio.com")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(admin)}")
        resposta = self.client.post(f"/api/usuarios/{self.usuario.id}/redefinir-2fa/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.client.credentials()
        self.assertIn("access", self._login().data)
