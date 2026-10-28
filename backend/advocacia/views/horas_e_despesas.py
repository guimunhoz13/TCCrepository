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
from .comum import _data_do_filtro, _id_do_filtro

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

        processo = _id_do_filtro(self.request.query_params, "processo")
        if processo:
            queryset = queryset.filter(processo_id=processo)

        usuario = _id_do_filtro(self.request.query_params, "usuario")
        if usuario:
            queryset = queryset.filter(usuario_id=usuario)

        inicio = _data_do_filtro(self.request.query_params, "inicio")
        if inicio:
            queryset = queryset.filter(data__gte=inicio)

        fim = _data_do_filtro(self.request.query_params, "fim")
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

        processo = _id_do_filtro(self.request.query_params, "processo")
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
