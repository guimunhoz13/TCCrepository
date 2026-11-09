"""Assistente de IA."""


from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as campos
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..ia_service import (
    gerar_resposta_ia,
    montar_contexto_sistema,
)
from ..mixins import (
    get_usuario_from_request,
)
from ..permissoes import VER, PermissaoPorPerfil
from ..planos import IA, exigir_recurso
from ..serializers import PerguntaIAEntradaSerializer

# =========================================================
# ASSISTENTE IA
# =========================================================

@extend_schema(
    tags=["ia"],
    summary="Perguntar ao assistente de IA",
    request=PerguntaIAEntradaSerializer,
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

        exigir_recurso(usuario.escritorio, IA)

        entrada = PerguntaIAEntradaSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        mensagem = entrada.validated_data["mensagem"]
        historico = entrada.validated_data["historico"]
        contexto = entrada.validated_data["contexto"]
        cliente_id = contexto.get("cliente_id")
        processo_id = contexto.get("processo_id")

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
