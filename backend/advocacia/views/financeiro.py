"""Contratos de honorários, parcelas e PIX."""

from decimal import ROUND_HALF_UP, Decimal

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..mixins import (
    EscritorioScopedMixin,
)
from ..models import (
    ConfiguracaoEscritorio,
    Contrato,
    Parcela,
)
from ..permissoes import PermissaoPorPerfil
from ..pix import ErroPix, pix_da_parcela
from ..serializers import (
    ContratoSerializer,
    ParcelaSerializer,
)

# =========================================================
# CONTRATOS E HONORÁRIOS
# =========================================================

def _somar_meses(data, meses):
    import calendar

    mes_total = data.month - 1 + meses
    ano = data.year + mes_total // 12
    mes = mes_total % 12 + 1
    dia = min(data.day, calendar.monthrange(ano, mes)[1])
    return data.replace(year=ano, month=mes, day=dia)


def _gerar_parcelas(contrato):
    total_parcelas = contrato.numero_parcelas if contrato.forma_pagamento == "parcelado" else 1
    total_parcelas = max(1, total_parcelas)

    valor_parcela = (contrato.valor_total / total_parcelas).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    hoje = timezone.now().date()
    soma = Decimal("0.00")

    for numero in range(1, total_parcelas + 1):
        valor = valor_parcela
        if numero == total_parcelas:
            valor = contrato.valor_total - soma
        soma += valor

        Parcela.objects.create(
            contrato=contrato,
            numero=numero,
            valor=valor,
            data_vencimento=_somar_meses(hoje, numero - 1),
        )


class ContratoViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Contrato.objects.all()

    serializer_class = ContratoSerializer

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "financeiro"

    def get_queryset(self):

        return (
            super()
            .get_queryset()
            .select_related("processo__cliente")
            .prefetch_related("parcelas")
            .order_by("-criado_em")
        )

    def perform_create(self, serializer):
        escritorio = self.get_escritorio()

        if not escritorio:
            raise PermissionDenied("Escritório não identificado.")

        contrato = serializer.save(escritorio=escritorio)
        _gerar_parcelas(contrato)


class ParcelaViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    http_method_names = ["get", "patch", "head", "options"]

    queryset = Parcela.objects.all()

    serializer_class = ParcelaSerializer

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "financeiro"

    def get_queryset(self):

        return (
            super()
            .get_queryset()
            .select_related("contrato__processo")
            .order_by("data_vencimento")
        )

    @action(detail=True, methods=["get"], url_path="pix")
    def pix(self, request, pk=None):
        """QR code e "copia e cola" do PIX desta parcela."""
        parcela = self.get_object()
        if parcela.status == "pago":
            return Response({"detail": "Esta parcela já está paga."}, status=status.HTTP_400_BAD_REQUEST)
        configuracao, _ = ConfiguracaoEscritorio.objects.get_or_create(
            escritorio=parcela.contrato.escritorio
        )
        try:
            return Response(pix_da_parcela(parcela, configuracao))
        except ErroPix as erro:
            return Response({"detail": str(erro)}, status=status.HTTP_400_BAD_REQUEST)

    def perform_update(self, serializer):
        parcela = serializer.instance
        novo_status = serializer.validated_data.get("status", parcela.status)

        if novo_status == "pago" and parcela.status != "pago":
            serializer.save(pago_em=timezone.now())
        else:
            serializer.save()
