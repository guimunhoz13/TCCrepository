"""Intimações do Diário de Justiça Eletrônico Nacional (DJEN)."""


from datetime import datetime

from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..djen import importar_intimacoes
from ..mixins import (
    EscritorioScopedMixin,
    registrar_auditoria,
)
from ..models import (
    Intimacao,
)
from ..permissoes import EDITAR, PermissaoPorPerfil
from ..planos import INTIMACOES_DJEN, exigir_recurso
from ..serializers import (
    IntimacaoSerializer,
    ConferenciaPrazoSerializer,
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
    acoes_permissao = {"buscar": EDITAR, "conferir": EDITAR}

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
            .select_related("advogado__usuario", "processo__cliente", "conferido_por", "evento_agenda")
        )
        lida = self.request.query_params.get("lida")
        if lida in ("true", "false"):
            queryset = queryset.filter(lida=(lida == "true"))
        processo = self.request.query_params.get("processo")
        if processo:
            queryset = queryset.filter(processo_id=processo)
        if self.request.query_params.get("conferencia") == "pendente":
            queryset = queryset.filter(conferido_em__isnull=True)
        return queryset

    @extend_schema(request=ConferenciaPrazoSerializer, responses={200: IntimacaoSerializer})
    @action(detail=True, methods=["post"], url_path="conferir")
    def conferir(self, request, pk=None):
        usuario = self.get_usuario()
        if usuario.tipo_usuario not in ("admin", "advogado"):
            raise PermissionDenied("A conferência de prazo precisa ser feita por um advogado ou administrador.")
        intimacao = self.get_object()
        entrada = ConferenciaPrazoSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        dados = entrada.validated_data
        with transaction.atomic():
            intimacao = Intimacao.objects.select_for_update().get(pk=intimacao.pk)
            if dados["prazo_referencia"] != intimacao.prazo_final:
                return Response({"detail": "O prazo mudou desde que você abriu a tela. Atualize a lista e confira novamente."}, status=409)
            anterior = intimacao.prazo_final
            intimacao.prazo_final = dados["prazo_final"]
            intimacao.conferido_por = usuario
            intimacao.conferido_em = timezone.now()
            intimacao.observacao_conferencia = dados["observacao"]
            intimacao.save(update_fields=["prazo_final", "conferido_por", "conferido_em", "observacao_conferencia"])
            if intimacao.evento_agenda_id:
                evento = intimacao.evento_agenda
                horario = timezone.localtime(evento.data_evento).time()
                evento.data_evento = timezone.make_aware(datetime.combine(intimacao.prazo_final, horario))
                evento.save(update_fields=["data_evento"])
            registrar_auditoria(request, "edicao", intimacao, escritorio=usuario.escritorio,
                                descricao="Prazo de intimação conferido com publicação e calendário do tribunal.",
                                alteracoes=[{"campo": "prazo_final", "rotulo": "Prazo conferido",
                                             "anterior": str(anterior), "novo": str(intimacao.prazo_final)}])
        return Response(self.get_serializer(intimacao).data)

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
