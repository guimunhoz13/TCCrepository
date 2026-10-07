"""Planos: o catálogo (público) e a situação do escritório logado."""


from django.conf import settings
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..mixins import get_usuario_from_request
from ..planos import catalogo, situacao


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
