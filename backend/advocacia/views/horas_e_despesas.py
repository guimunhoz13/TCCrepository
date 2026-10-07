"""Apontamento de horas (timesheet) e despesas/custas."""


from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from ..mixins import (
    EscritorioScopedMixin,
    registrar_auditoria,
)
from ..models import (
    ApontamentoHora,
    Despesa,
)
from ..permissoes import PermissaoPorPerfil
from ..serializers import (
    ApontamentoHoraSerializer,
    DespesaSerializer,
)

# =========================================================
# APONTAMENTO DE HORAS (TIMESHEET)
# =========================================================

class ApontamentoHoraViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = ApontamentoHora.objects.all()

    serializer_class = ApontamentoHoraSerializer

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "horas"

    def get_queryset(self):
        queryset = super().get_queryset().select_related("processo", "usuario")

        processo = self.request.query_params.get("processo")
        if processo:
            queryset = queryset.filter(processo_id=processo)

        usuario = self.request.query_params.get("usuario")
        if usuario:
            queryset = queryset.filter(usuario_id=usuario)

        inicio = self.request.query_params.get("inicio")
        if inicio:
            queryset = queryset.filter(data__gte=inicio)

        fim = self.request.query_params.get("fim")
        if fim:
            queryset = queryset.filter(data__lte=fim)

        return queryset

    def perform_create(self, serializer):
        escritorio = self.get_escritorio()

        if not escritorio:
            raise PermissionDenied("Escritório não identificado.")

        # As horas são sempre lançadas em nome de quem está autenticado:
        # um apontamento de tempo precisa ser rastreável a uma pessoa.
        self._salvar(serializer, escritorio=escritorio, usuario=self.get_usuario())
        registrar_auditoria(self.request, "criacao", serializer.instance, escritorio=escritorio)


# =========================================================
# DESPESAS E CUSTAS PROCESSUAIS
# =========================================================

class DespesaViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Despesa.objects.all()

    serializer_class = DespesaSerializer

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "despesas"

    def get_queryset(self):
        queryset = super().get_queryset().select_related("processo", "processo__cliente")

        processo = self.request.query_params.get("processo")
        if processo:
            queryset = queryset.filter(processo_id=processo)

        reembolsavel = self.request.query_params.get("reembolsavel")
        if reembolsavel in ("true", "false"):
            queryset = queryset.filter(reembolsavel=reembolsavel == "true")

        reembolsada = self.request.query_params.get("reembolsada")
        if reembolsada in ("true", "false"):
            queryset = queryset.filter(reembolsada=reembolsada == "true")

        return queryset

    def perform_create(self, serializer):
        escritorio = self.get_escritorio()

        if not escritorio:
            raise PermissionDenied("Escritório não identificado.")

        self._salvar(serializer, escritorio=escritorio, criado_por=self.get_usuario())
        registrar_auditoria(self.request, "criacao", serializer.instance, escritorio=escritorio)
