"""Agenda, cálculo de prazo e calendário .ics."""

import secrets
from datetime import date

from django.http import Http404, HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as campos
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..calendario import eventos_para_calendario, gerar_ics
from ..feriados import FeriadosLocais, calcular_prazo, calendario_do_ano, feriados_locais_no_periodo
from ..mixins import (
    EscritorioScopedMixin,
    get_usuario_from_request,
)
from ..models import (
    Agenda,
    FeriadoLocal,
    Usuario,
)
from ..permissoes import VER, PermissaoPorPerfil, pode
from ..serializers import (
    AgendaSerializer,
    FeriadoLocalSerializer,
)
from ..sigilo import esconder_sigilosos

# =========================================================
# AGENDA
# =========================================================

@extend_schema(
    tags=["agenda"],
    summary="Calcular a data final de um prazo",
    request=inline_serializer("CalculoDePrazo", {
        "data_inicio": campos.DateField(),
        "dias": campos.IntegerField(min_value=1),
        "dias_uteis": campos.BooleanField(default=True),
    }),
    responses={200: OpenApiTypes.OBJECT},
)
class CalcularPrazoView(APIView):
    """Calcula a data final de um prazo a partir de uma data de início e
    uma quantidade de dias, contando em dias úteis (pulando fins de semana
    e feriados nacionais e locais) ou em dias corridos, conforme solicitado. Apoia
    o preenchimento da agenda ao cadastrar um prazo processual (RN — CPC
    art. 219: prazos processuais cíveis contam em dias úteis)."""

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "agenda"
    acoes_permissao = {None: VER}

    def post(self, request):
        data_inicio_str = request.data.get("data_inicio", "")
        dias = request.data.get("dias")
        dias_uteis = request.data.get("dias_uteis", True)

        if not data_inicio_str or dias in (None, ""):
            return Response(
                {"detail": "Informe a data de início e a quantidade de dias."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data_inicio = date.fromisoformat(data_inicio_str)
            dias = int(dias)
        except (ValueError, TypeError):
            return Response(
                {"detail": "Data de início ou quantidade de dias inválida."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if dias <= 0:
            return Response(
                {"detail": "A quantidade de dias deve ser maior que zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario = get_usuario_from_request(request)
        locais = FeriadosLocais.do_escritorio(usuario.escritorio) if usuario else FeriadosLocais()
        data_final = calcular_prazo(data_inicio, dias, dias_uteis=bool(dias_uteis), locais=locais)

        return Response({
            "data_final": data_final.isoformat(),
            # Os feriados locais que pularam a contagem, para o usuário
            # conferir de onde veio a data.
            "feriados_locais": feriados_locais_no_periodo(data_inicio, data_final, locais) if dias_uteis else [],
        })


class FeriadoLocalViewSet(EscritorioScopedMixin, viewsets.ModelViewSet):
    """Feriados municipais, estaduais e suspensões de expediente do
    escritório, que entram no cálculo de prazos."""

    queryset = FeriadoLocal.objects.all()
    serializer_class = FeriadoLocalSerializer
    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "agenda"
    pagination_class = None


class AgendaViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Agenda.objects.all()

    serializer_class = AgendaSerializer

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "agenda"

    @extend_schema(summary="Feriados e recesso forense de um ano, para o calendário", responses={200: OpenApiTypes.OBJECT})
    @action(detail=False, methods=["get"], url_path="feriados")
    def feriados(self, request):
        """Feriados nacionais, feriados locais do escritório e recesso
        forense do ano pedido (?ano=2026; padrão: o ano atual)."""
        try:
            ano = int(request.query_params.get("ano") or date.today().year)
        except ValueError:
            ano = date.today().year
        if not 1900 <= ano <= 2200:
            return Response({"detail": "Ano fora do intervalo aceito."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(calendario_do_ano(ano, FeriadosLocais.do_escritorio(self.get_escritorio())))

    def get_queryset(self):

        queryset = (
            super()
            .get_queryset()
            .select_related(
                "processo__cliente",
                "processo__advogado__usuario",
            )
            .order_by(
                "data_evento"
            )
        )

        tipo = self.request.query_params.get("tipo")
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        cumprido = self.request.query_params.get("cumprido")
        if cumprido in ("true", "false"):
            queryset = queryset.filter(cumprido=(cumprido == "true"))

        return queryset

    @action(detail=False, methods=["get"], url_path="exportar-ics")
    def exportar_ics(self, request):
        """Agenda em .ics para importar no Google Agenda, Outlook ou iPhone."""
        escritorio = self.get_escritorio()
        conteudo = gerar_ics(
            eventos_para_calendario(self.get_queryset()),
            f"LexOffice — {escritorio.nome}" if escritorio else "LexOffice",
        )
        resposta = HttpResponse(conteudo, content_type="text/calendar; charset=utf-8")
        resposta["Content-Disposition"] = 'attachment; filename="agenda-lexoffice.ics"'
        return resposta

    @action(detail=False, methods=["get", "post", "delete"], url_path="assinatura")
    def assinatura(self, request):
        """Link privado para o aplicativo de agenda assinar.

        GET mostra o link atual (se houver), POST gera um novo — o antigo
        para de funcionar na hora — e DELETE desliga a assinatura.
        """
        usuario = get_usuario_from_request(request)
        if request.method == "POST":
            usuario.agenda_feed_token = secrets.token_urlsafe(32)
            usuario.save(update_fields=["agenda_feed_token"])
        elif request.method == "DELETE":
            usuario.agenda_feed_token = ""
            usuario.save(update_fields=["agenda_feed_token"])

        url = ""
        if usuario.agenda_feed_token:
            url = request.build_absolute_uri(f"/api/agenda/feed/{usuario.agenda_feed_token}.ics")
        return Response({"url": url})


class AgendaFeedView(APIView):
    """Agenda assinada pelo Google Agenda/Outlook, sem login.

    O aplicativo de agenda não envia token JWT; quem autoriza é o próprio
    link, longo e aleatório. Segue as mesmas regras da tela: só o
    escritório da pessoa, sem processos sigilosos que ela não veria, e
    nada se a conta, o escritório ou o perfil não permitirem mais.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, token):
        usuario = (
            Usuario.objects.select_related("escritorio")
            .filter(agenda_feed_token=token)
            .first()
            if len(token) >= 32
            else None
        )
        if (
            usuario is None
            or not usuario.ativo
            or not usuario.escritorio.ativo
            or not pode(usuario, "agenda")
        ):
            raise Http404

        eventos = esconder_sigilosos(
            Agenda.objects.filter(escritorio=usuario.escritorio), usuario
        )
        conteudo = gerar_ics(
            eventos_para_calendario(eventos), f"LexOffice — {usuario.escritorio.nome}"
        )
        return HttpResponse(conteudo, content_type="text/calendar; charset=utf-8")
