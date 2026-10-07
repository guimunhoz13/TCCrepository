"""Login (com segunda etapa), renovação e revogação de tokens e redefinição de senha."""

import logging
import secrets

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiExample, extend_schema, inline_serializer
from rest_framework import serializers as campos
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.utils import datetime_from_epoch

from ..autenticacao import conta_ativa
from ..dois_fatores import (
    abrir_desafio,
    assinar_desafio,
    conferir_codigo,
)
from ..emails import (
    enviar_email,
    montar_email_redefinicao_senha,
)
from ..mixins import (
    registrar_auditoria,
)
from ..models import (
    SuperAdmin,
    TokenRedefinicaoSenha,
    Usuario,
)
from ..permissoes import permissoes_do_perfil
from ..validators import validar_senha_forte

logger = logging.getLogger(__name__)


@extend_schema(
    tags=["autenticacao"],
    summary="Renovar o access token",
    description="Rotaciona o refresh: o enviado é revogado e um novo par volta na resposta.",
    request=inline_serializer("Renovacao", {"refresh": campos.CharField()}),
    responses={200: inline_serializer("TokensRenovados", {"access": campos.CharField(), "refresh": campos.CharField()}), 401: OpenApiTypes.OBJECT},
)
class RenovarTokenView(APIView):
    """Emite um novo access token a partir de um refresh token válido.

    Não usa o TokenRefreshView padrão do simplejwt: sua serializer tenta
    confirmar que o usuário ainda existe via
    get_user_model().objects.get(id=<claim user_id>) contra o model padrão
    do Django (auth.User) — mas este sistema não usa auth.User, e sim os
    models Usuario/SuperAdmin, com autenticação stateless
    (JWTStatelessUserAuthentication não consulta o banco a cada
    requisição). Essa checagem sempre falharia com User.DoesNotExist. Em
    vez disso, seguimos o mesmo padrão já usado em LoginView/
    MasterLoginView: construir o access token diretamente a partir do
    RefreshToken.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_str = request.data.get("refresh", "")

        if not refresh_str:
            return Response(
                {"detail": "Informe o refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(refresh_str)
        except TokenError:
            return Response(
                {"detail": "Token inválido ou expirado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Um refresh válido não basta: a conta pode ter sido desativada
        # depois de ele ser emitido. Sem esta checagem, desativar um
        # usuário não o tirava do ar — ele seguia renovando o acesso.
        try:
            conta_ativa(refresh)
        except AuthenticationFailed as exc:
            return Response({"detail": exc.detail}, status=status.HTTP_401_UNAUTHORIZED)

        # Rotação: o refresh usado é revogado e um novo (mesmos claims, novo
        # jti e nova validade) volta junto com o access. Assim um refresh
        # vazado só serve até a próxima renovação do dono legítimo, em vez de
        # valer os 7 dias inteiros.
        _revogar_refresh_token(refresh)
        refresh.set_jti()
        refresh.set_exp()
        refresh.set_iat()

        return Response({"access": str(refresh.access_token), "refresh": str(refresh)})


def _revogar_refresh_token(refresh):
    """Equivalente a RefreshToken.blacklist(), mas sem a consulta que a
    própria biblioteca faz a get_user_model().objects.get(id=<user_id>)
    (auth.User) — este sistema não usa auth.User, e o claim "user_id" nos
    tokens do painel mestre é uma string ("master-<id>", não numérica).
    Passada como está, essa consulta da biblioteca levanta um ValueError
    não tratado (não um DoesNotExist) e derruba a requisição. Como esse
    FK para auth.User não tem nenhum uso neste sistema, simplesmente
    deixamos "user" em branco.
    """
    jti = refresh.payload[jwt_settings.JTI_CLAIM]
    exp = refresh.payload["exp"]

    token, _ = OutstandingToken.objects.get_or_create(
        jti=jti,
        defaults={
            "user": None,
            "created_at": refresh.current_time,
            "token": str(refresh),
            "expires_at": datetime_from_epoch(exp),
        },
    )
    BlacklistedToken.objects.get_or_create(token=token)


@extend_schema(
    tags=["autenticacao"],
    summary="Sair (revoga o refresh token)",
    request=inline_serializer("Logout", {"refresh": campos.CharField()}),
    responses={205: None, 400: OpenApiTypes.OBJECT},
)
class LogoutView(APIView):
    """Revoga (blacklista) o refresh token, encerrando a sessão de verdade
    no servidor. Sem isso, "sair" só apagava os tokens do navegador — uma
    cópia do refresh token (notebook compartilhado, XSS, etc.) continuava
    válida por até 7 dias mesmo depois do usuário ter clicado em "Sair".
    Um access token já emitido continua válido até expirar naturalmente
    (até 30 minutos): a autenticação é stateless e não consulta a
    blacklist a cada requisição, só na hora de renovar o token.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_str = request.data.get("refresh", "")

        if not refresh_str:
            return Response(
                {"detail": "Informe o refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(refresh_str)
            _revogar_refresh_token(refresh)
        except TokenError:
            # Já inválido/expirado/revogado — o objetivo (token inutilizável)
            # já está garantido, não há nada a fazer.
            return Response({"detail": "Sessão encerrada."})

        payload = refresh.payload

        if payload.get("is_master"):
            superadmin = SuperAdmin.objects.filter(id=payload.get("superadmin_id")).first()
            registrar_auditoria(
                request,
                "logout",
                superadmin=superadmin,
                descricao="Logout do painel mestre.",
            )
        else:
            usuario = (
                Usuario.objects.filter(id=payload.get("user_id"))
                .select_related("escritorio")
                .first()
            )
            registrar_auditoria(
                request,
                "logout",
                usuario=usuario,
                escritorio=usuario.escritorio if usuario else None,
                descricao="Logout realizado.",
            )

        return Response({"detail": "Sessão encerrada."})


# =========================================================
# LOGIN
# =========================================================

def _dados_do_usuario_logado(request, usuario):
    """O que o frontend guarda sobre quem entrou — inclusive o que o perfil
    pode fazer, para esconder da tela o que a API recusaria."""
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "tipo_usuario": usuario.tipo_usuario,
        "tipo_usuario_display": usuario.get_tipo_usuario_display(),
        "escritorio_id": usuario.escritorio_id,
        "escritorio_nome": usuario.escritorio.nome,
        "foto": request.build_absolute_uri(usuario.foto.url) if usuario.foto else None,
        "permissoes": permissoes_do_perfil(usuario.tipo_usuario),
    }


# Resposta comum ao login e à segunda etapa (documentação da API).
_SESSAO_ABERTA = inline_serializer("Sessao", {
    "access": campos.CharField(),
    "refresh": campos.CharField(),
    "usuario": campos.DictField(help_text="Dados do usuário logado, perfil e permissões."),
})


@extend_schema(
    tags=["autenticacao"],
    summary="Entrar com e-mail e senha",
    description=(
        "Devolve o par de tokens e o usuário. Se a conta tem verificação em duas "
        "etapas, devolve `requer_2fa: true` e um `desafio` (válido por 5 minutos) "
        "para concluir em /api/login/2fa/. Cinco senhas erradas bloqueiam por 15 minutos."
    ),
    request=inline_serializer("Login", {"email": campos.EmailField(), "senha": campos.CharField()}),
    responses={200: _SESSAO_ABERTA, 401: OpenApiTypes.OBJECT, 403: OpenApiTypes.OBJECT},
    examples=[OpenApiExample("Demo", value={"email": "admin@silvasabino.adv.br", "senha": "Demo@1234"}, request_only=True)],
)
class LoginView(APIView):

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "login"

    def post(self, request):

        email = request.data.get("email", "").strip()
        senha = request.data.get("senha", "")

        if not email or not senha:
            return Response(
                {
                    "detail": "Informe o e-mail e a senha."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            usuario = (
                Usuario.objects
                .select_related("escritorio")
                .get(email__iexact=email)
            )

        except Usuario.DoesNotExist:
            return Response(
                {
                    "detail": "E-mail ou senha inválidos."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not usuario.ativo:
            return Response(
                {
                    "detail": "Este usuário está desativado."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not usuario.escritorio.ativo:
            return Response(
                {
                    "detail": "Este escritório está desativado."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if usuario.bloqueado_ate and usuario.bloqueado_ate > timezone.now():
            minutos_restantes = max(
                1,
                int((usuario.bloqueado_ate - timezone.now()).total_seconds() // 60) + 1,
            )
            return Response(
                {
                    "detail": f"Conta bloqueada por excesso de tentativas. Tente novamente em {minutos_restantes} minuto(s)."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not check_password(senha, usuario.senha):
            usuario.tentativas_login += 1

            if usuario.tentativas_login >= 3:
                usuario.bloqueado_ate = timezone.now() + timezone.timedelta(minutes=15)
                usuario.tentativas_login = 0
                usuario.save(update_fields=["tentativas_login", "bloqueado_ate"])
                registrar_auditoria(
                    request,
                    "login_bloqueado",
                    usuario=usuario,
                    escritorio=usuario.escritorio,
                    descricao=f"Login bloqueado para {usuario.email} por 15 minutos.",
                )
                return Response(
                    {
                        "detail": "Conta bloqueada por 15 minutos após 3 tentativas de senha inválidas."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            usuario.save(update_fields=["tentativas_login"])
            registrar_auditoria(
                request,
                "login_falha",
                usuario=usuario,
                escritorio=usuario.escritorio,
                descricao=f"Senha inválida para {usuario.email}.",
            )
            return Response(
                {
                    "detail": "E-mail ou senha inválidos."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not settings.DEBUG and not usuario.email_verificado:
            return Response(
                {
                    "detail": "Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada (e o spam)."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if usuario.tentativas_login or usuario.bloqueado_ate:
            usuario.tentativas_login = 0
            usuario.bloqueado_ate = None
            usuario.save(update_fields=["tentativas_login", "bloqueado_ate"])

        # Com a verificação em duas etapas ativa, a senha certa não abre a
        # sessão: devolve um desafio de 5 minutos que só vale junto com o
        # código do aplicativo (LoginSegundoFatorView).
        if usuario.totp_ativo:
            return Response(
                {"requer_2fa": True, "desafio": assinar_desafio(usuario)},
                status=status.HTTP_200_OK,
            )

        return _abrir_sessao(request, usuario)


def _abrir_sessao(request, usuario):
    registrar_auditoria(
        request,
        "login_sucesso",
        usuario=usuario,
        escritorio=usuario.escritorio,
        descricao=f"Login realizado por {usuario.email}.",
    )

    refresh = RefreshToken()

    refresh["user_id"] = usuario.id
    refresh["nome"] = usuario.nome
    refresh["email"] = usuario.email
    refresh["tipo_usuario"] = usuario.tipo_usuario
    refresh["escritorio_id"] = usuario.escritorio_id
    refresh["escritorio_nome"] = usuario.escritorio.nome
    refresh["session_version"] = usuario.session_version

    return Response(
        {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "usuario": _dados_do_usuario_logado(request, usuario),
        },
        status=status.HTTP_200_OK,
    )


TENTATIVAS_SEGUNDO_FATOR = 5


@extend_schema(
    tags=["autenticacao"],
    summary="Concluir o login com o código do autenticador",
    request=inline_serializer("LoginSegundoFator", {"desafio": campos.CharField(), "codigo": campos.CharField()}),
    responses={200: _SESSAO_ABERTA, 400: OpenApiTypes.OBJECT},
)
class LoginSegundoFatorView(APIView):
    """Segunda fase do login: desafio (da primeira fase) + código do app."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "login"

    def post(self, request):
        aberto = abrir_desafio(request.data.get("desafio", ""))
        if not aberto:
            return Response(
                {"detail": "A verificação expirou. Entre com e-mail e senha novamente."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        usuario_id, versao = aberto
        usuario = (
            Usuario.objects.select_related("escritorio")
            .filter(pk=usuario_id, ativo=True, escritorio__ativo=True, totp_ativo=True)
            .first()
        )
        # Troca de senha no meio do caminho também invalida o desafio.
        if not usuario or usuario.session_version != versao:
            return Response(
                {"detail": "A verificação expirou. Entre com e-mail e senha novamente."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if usuario.bloqueado_ate and usuario.bloqueado_ate > timezone.now():
            return Response(
                {"detail": "Conta bloqueada por excesso de tentativas. Tente mais tarde."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not conferir_codigo(usuario, request.data.get("codigo")):
            usuario.tentativas_login += 1
            campos = ["tentativas_login"]
            if usuario.tentativas_login >= TENTATIVAS_SEGUNDO_FATOR:
                usuario.bloqueado_ate = timezone.now() + timezone.timedelta(minutes=15)
                usuario.tentativas_login = 0
                campos.append("bloqueado_ate")
            usuario.save(update_fields=campos)
            registrar_auditoria(
                request,
                "login_falha",
                usuario=usuario,
                escritorio=usuario.escritorio,
                descricao=f"Código de verificação em duas etapas inválido para {usuario.email}.",
            )
            return Response(
                {"detail": "Código inválido. Confira o aplicativo autenticador."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if usuario.tentativas_login:
            usuario.tentativas_login = 0
            usuario.save(update_fields=["tentativas_login"])

        return _abrir_sessao(request, usuario)


# =========================================================
# REDEFINIÇÃO DE SENHA
# =========================================================

class SolicitarRedefinicaoSenhaView(APIView):

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "sensivel"

    def post(self, request):
        email = request.data.get("email", "").strip()

        resposta_generica = Response(
            {"detail": "Se este e-mail estiver cadastrado, enviaremos um link de redefinição."},
            status=status.HTTP_200_OK,
        )

        if not email:
            return resposta_generica

        try:
            usuario = Usuario.objects.select_related("escritorio").get(email__iexact=email, ativo=True)
        except Usuario.DoesNotExist:
            return resposta_generica

        token = secrets.token_urlsafe(32)
        TokenRedefinicaoSenha.objects.create(
            usuario=usuario,
            token=token,
            expira_em=timezone.now() + timezone.timedelta(hours=1),
        )

        link = f"{settings.FRONTEND_URL}/redefinir-senha?token={token}"
        assunto, corpo_html, corpo_texto = montar_email_redefinicao_senha(
            usuario.nome, link, usuario.escritorio.nome
        )
        try:
            enviar_email(usuario.email, assunto, corpo_html, corpo_texto)
        except Exception:
            # A resposta ao cliente é sempre genérica (não revela se o
            # e-mail existe), mas uma falha real de envio (credenciais SMTP
            # erradas/ausentes, etc.) precisa aparecer em algum lugar — sem
            # isso, o problema mais comum ("o e-mail não chega") vira um
            # mistério sem nenhuma pista nos logs.
            logger.exception("Falha ao enviar e-mail de redefinição de senha para %s", usuario.email)

        return resposta_generica


class RedefinirSenhaView(APIView):

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "sensivel"

    def post(self, request):
        token_valor = request.data.get("token", "").strip()
        nova_senha = request.data.get("nova_senha", "")
        confirmar_senha = request.data.get("confirmar_senha", "")

        if not token_valor:
            return Response({"detail": "Token inválido."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = TokenRedefinicaoSenha.objects.select_related("usuario").get(token=token_valor)
        except TokenRedefinicaoSenha.DoesNotExist:
            return Response({"detail": "Token inválido ou expirado."}, status=status.HTTP_400_BAD_REQUEST)

        if token.usado or token.expira_em < timezone.now():
            return Response({"detail": "Token inválido ou expirado."}, status=status.HTTP_400_BAD_REQUEST)

        if nova_senha != confirmar_senha:
            return Response({"detail": "A confirmação da nova senha não confere."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validar_senha_forte(nova_senha)
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)

        usuario = token.usuario
        usuario.senha = make_password(nova_senha)
        usuario.tentativas_login = 0
        usuario.bloqueado_ate = None
        usuario.session_version += 1
        usuario.save(update_fields=["senha", "tentativas_login", "bloqueado_ate", "session_version"])

        token.usado = True
        token.save(update_fields=["usado"])

        registrar_auditoria(
            request,
            "edicao",
            usuario=usuario,
            escritorio=usuario.escritorio,
            descricao=f"Senha redefinida via link de recuperação para {usuario.email}.",
            modelo="Usuario",
            objeto_id=usuario.id,
        )

        return Response({"detail": "Senha redefinida com sucesso."})
