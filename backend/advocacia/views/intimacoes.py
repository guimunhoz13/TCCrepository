"""Intimações do Diário de Justiça Eletrônico Nacional (DJEN)."""


from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..djen import importar_intimacoes
from ..mixins import (
    EscritorioScopedMixin,
)
from ..models import (
    Intimacao,
)
from ..permissoes import EDITAR, PermissaoPorPerfil
from ..planos import INTIMACOES_DJEN, exigir_recurso
from ..serializers import (
    IntimacaoSerializer,
)

# =========================================================
# INTIMAÇÕES (DJEN)
# =========================================================

class IntimacaoViewSet(EscritorioScopedMixin, viewsets.ModelViewSet):
    """Intimações publicadas no DJEN para os advogados do escritório.

    Listar e marcar como lida; o resto vem do diário. "buscar" consulta o
    DJEN na hora (o comando buscar_intimacoes faz o mesmo de madrugada).
    """

    http_method_names = ["get", "patch", "post", "head", "options"]
    queryset = Intimacao.objects.all()
    serializer_class = IntimacaoSerializer
    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "processos"
    acoes_permissao = {"buscar": EDITAR}

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
            .select_related("advogado__usuario", "processo__cliente")
        )
        lida = self.request.query_params.get("lida")
        if lida in ("true", "false"):
            queryset = queryset.filter(lida=(lida == "true"))
        processo = self.request.query_params.get("processo")
        if processo:
            queryset = queryset.filter(processo_id=processo)
        return queryset

    def create(self, request, *args, **kwargs):
        raise PermissionDenied("Intimações vêm do DJEN; use 'Buscar no DJEN'.")

    @action(detail=False, methods=["post"], url_path="buscar")
    def buscar(self, request):
        escritorio = self.get_escritorio()
        exigir_recurso(escritorio, INTIMACOES_DJEN)
        resultado = importar_intimacoes(escritorio)
        novas = len(resultado["novas"])
        partes = [
            f"{novas} intimação nova." if novas == 1 else f"{novas} intimações novas.",
        ]
        if resultado["sem_oab"]:
            partes.append(
                "Sem OAB no formato número/UF: " + ", ".join(resultado["sem_oab"]) + "."
            )
        if resultado["erros"]:
            partes.append(resultado["erros"][0])
        return Response(
            {
                "detail": " ".join(partes),
                "novas": novas,
                "advogados_consultados": resultado["advogados_consultados"],
                "sem_oab": resultado["sem_oab"],
                "erros": resultado["erros"],
            },
            status=status.HTTP_200_OK if not resultado["erros"] or novas else status.HTTP_502_BAD_GATEWAY,
        )
