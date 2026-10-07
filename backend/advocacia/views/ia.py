"""Assistente de IA."""


from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as campos
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..ia_service import (
    TAMANHO_MAXIMO_MENSAGEM_IA,
    gerar_resposta_ia,
    montar_contexto_sistema,
)
from ..mixins import (
    get_usuario_from_request,
)
from ..permissoes import VER, PermissaoPorPerfil

# =========================================================
# ASSISTENTE IA
# =========================================================

@extend_schema(
    tags=["ia"],
    summary="Perguntar ao assistente de IA",
    request=inline_serializer("PerguntaIA", {
        "mensagem": campos.CharField(max_length=4000),
        "historico": campos.ListField(child=campos.DictField(), required=False),
        "contexto": inline_serializer("ContextoIA", {
            "cliente_id": campos.IntegerField(required=False),
            "processo_id": campos.IntegerField(required=False),
        }, required=False),
    }),
    responses={200: inline_serializer("RespostaIA", {"resposta": campos.CharField()}), 503: OpenApiTypes.OBJECT},
)
class AssistenteIAView(APIView):

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "ia"
    acoes_permissao = {None: VER}

    # Cada chamada é cobrada pela OpenAI: o limite geral por usuário
    # (1000/min) deixaria uma conta comprometida gerar uma conta alta.
    throttle_scope = "ia"

    def post(self, request):

        usuario = get_usuario_from_request(request)

        if not usuario:
            return Response(
                {"detail": "Usuário não identificado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        mensagem = (request.data.get("mensagem") or "").strip()

        if not mensagem:
            return Response(
                {"detail": "Informe uma mensagem."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(mensagem) > TAMANHO_MAXIMO_MENSAGEM_IA:
            return Response(
                {
                    "detail": (
                        f"A mensagem passou de {TAMANHO_MAXIMO_MENSAGEM_IA} caracteres. "
                        "Resuma a pergunta ou divida em partes."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        historico = request.data.get("historico") or []
        contexto = request.data.get("contexto") or {}

        cliente_id = contexto.get("cliente_id")
        processo_id = contexto.get("processo_id")

        if cliente_id is not None:
            try:
                cliente_id = int(cliente_id)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "cliente_id inválido."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if processo_id is not None:
            try:
                processo_id = int(processo_id)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "processo_id inválido."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        contexto_sistema = montar_contexto_sistema(
            usuario,
            cliente_id=cliente_id,
            processo_id=processo_id,
        )

        try:
            resposta = gerar_resposta_ia(
                mensagem=mensagem,
                historico=historico,
                contexto_sistema=contexto_sistema,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception:
            return Response(
                {"detail": "Não foi possível obter resposta da IA. Tente novamente."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"resposta": resposta})
