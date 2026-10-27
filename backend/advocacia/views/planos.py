"""Planos: o catálogo (público) e a situação do escritório logado."""


from django.conf import settings
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..mixins import get_usuario_from_request
from ..planos import PLANOS, catalogo, situacao
from ..dois_fatores import qr_code_svg


@extend_schema(tags=["planos"], summary="Planos disponíveis", responses={200: OpenApiTypes.OBJECT})
class PlanosView(APIView):
    """Público: a página inicial mostra os planos antes do cadastro."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({
            "planos": catalogo(),
            "contato_comercial": getattr(settings, "CONTATO_COMERCIAL", ""),
        })


@extend_schema(tags=["planos"], summary="Plano do escritório, com uso e limites", responses={200: OpenApiTypes.OBJECT})
class PlanoAtualView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(situacao(usuario.escritorio))


@extend_schema(tags=["planos"], summary="Demonstração de Pix de assinatura, sem cobrança ou ativação", responses={200: OpenApiTypes.OBJECT})
class PixTestePlanoView(APIView):
    permission_classes = [IsAuthenticated]

    def _dados(self, request, plano_id):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return None, Response({"detail": "Usuário não identificado."}, status=401)
        plano = PLANOS.get(plano_id) if isinstance(plano_id, str) else None
        if not plano or plano["preco_mensal"] <= 0:
            return None, Response({"detail": "Escolha um plano pago do catálogo para testar."}, status=400)
        return {
            "modo": "teste", "plano": plano_id, "nome": plano["nome"],
            "valor": f"{plano['preco_mensal']:.2f}",
            "payload": f"LEXNEXO-TESTE-SEM-VALOR:PLANO:{usuario.escritorio_id}:{plano_id}",
        }, None

    def get(self, request):
        dados, erro = self._dados(request, request.query_params.get("plano"))
        if erro is not None:
            return erro
        return Response({**dados, "qr_code": qr_code_svg(dados["payload"])})

    def patch(self, request):
        dados, erro = self._dados(request, request.data.get("plano"))
        if erro is not None:
            return erro
        if request.data.get("codigo") != dados["payload"]:
            return Response({"detail": "Use o código de teste deste escritório e plano."}, status=400)
        # Não altera plano, validade, limites ou financeiro do escritório.
        return Response({
            "modo": "teste", "status": "confirmado", "plano_ativado": False,
            "detail": "Assinatura simulada. Nenhum dinheiro foi movimentado e seu plano real não foi alterado.",
        })
