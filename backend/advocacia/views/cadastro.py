"""Cadastro do escritório e confirmação de e-mail."""

import logging
import secrets

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..emails import (
    enviar_email,
    montar_email_verificacao,
)
from ..models import (
    TokenVerificacaoEmail,
)
from ..serializers import (
    EscritorioRegistroSerializer,
    EscritorioSerializer,
)

logger = logging.getLogger(__name__)


# =========================================================
# REGISTRO CENTRAL DO ESCRITÓRIO
# =========================================================

class EscritorioRegistroView(APIView):

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "sensivel"

    def post(self, request):

        serializer = EscritorioRegistroSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        resultado = serializer.save()
        escritorio = resultado["escritorio"]
        usuario = resultado["usuario"]

        requer_verificacao = not settings.DEBUG
        mensagem = "Escritório cadastrado com sucesso."

        if requer_verificacao:
            usuario.email_verificado = False
            usuario.save(update_fields=["email_verificado"])

            token = secrets.token_urlsafe(32)
            TokenVerificacaoEmail.objects.create(
                usuario=usuario,
                token=token,
                expira_em=timezone.now() + timezone.timedelta(hours=24),
            )

            link = f"{settings.FRONTEND_URL}/confirmar-email?token={token}"
            assunto, corpo_html, corpo_texto = montar_email_verificacao(
                usuario.nome, link, escritorio.nome
            )
            try:
                enviar_email(usuario.email, assunto, corpo_html, corpo_texto)
            except Exception:
                logger.exception("Falha ao enviar e-mail de confirmação de cadastro para %s", usuario.email)

            mensagem = (
                "Escritório cadastrado com sucesso. Enviamos um link de "
                "confirmação para o e-mail do administrador — confirme antes "
                "de fazer login."
            )

        return Response(
            {
                "detail": mensagem,
                "requer_verificacao_email": requer_verificacao,

                "escritorio": EscritorioSerializer(escritorio).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ConfirmarEmailView(APIView):

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "sensivel"

    def post(self, request):
        token_valor = request.data.get("token", "").strip()

        if not token_valor:
            return Response({"detail": "Token inválido."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = TokenVerificacaoEmail.objects.select_related("usuario").get(token=token_valor)
        except TokenVerificacaoEmail.DoesNotExist:
            return Response({"detail": "Token inválido ou expirado."}, status=status.HTTP_400_BAD_REQUEST)

        if token.usado or token.expira_em < timezone.now():
            return Response({"detail": "Token inválido ou expirado."}, status=status.HTTP_400_BAD_REQUEST)

        usuario = token.usuario
        usuario.email_verificado = True
        usuario.save(update_fields=["email_verificado"])

        token.usado = True
        token.save(update_fields=["usado"])

        return Response({"detail": "E-mail confirmado com sucesso. Você já pode fazer login."})
