"""Indicadores da dashboard (estatísticas, financeiro do mês e gráfico)."""

from decimal import Decimal

from django.db.models import Count, Prefetch, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..mixins import (
    get_usuario_from_request,
)
from ..models import (
    Advogado,
    Agenda,
    ApontamentoHora,
    Cliente,
    Despesa,
    Documento,
    Parcela,
    Processo,
    Tarefa,
    ordenacao_de_trabalho,
)
from ..permissoes import VER, permissoes_do_perfil, pode
from ..serializers import (
    AgendaSerializer,
    DocumentoSerializer,
    EscritorioSerializer,
    ProcessoSerializer,
    TarefaSerializer,
)
from ..sigilo import esconder_sigilosos
from .financeiro import _somar_meses

# =========================================================
# DASHBOARD
# =========================================================

def _indicadores_financeiros(escritorio):
    """Números do dia a dia financeiro do escritório.

    Todos olham para o escritório inteiro, não para um cliente: é o que a
    dashboard precisa responder logo na abertura — quanto há a receber,
    quanto entrou no mês e o que já passou do vencimento.
    """

    zero = Decimal("0.00")
    hoje = timezone.localdate()
    inicio_do_mes = hoje.replace(day=1)

    parcelas = Parcela.objects.filter(contrato__escritorio=escritorio)

    a_receber = parcelas.exclude(status="pago").aggregate(total=Sum("valor"))["total"] or zero

    recebido_no_mes = (
        parcelas
        .filter(status="pago", pago_em__date__gte=inicio_do_mes)
        .aggregate(total=Sum("valor"))["total"]
        or zero
    )

    # O status "atrasado" da parcela existe no modelo mas nada o atribui:
    # o vencimento é comparado com a data de hoje na hora da consulta.
    vencidas = parcelas.exclude(status="pago").filter(data_vencimento__lt=hoje)
    vencidas_resumo = vencidas.aggregate(quantidade=Count("id"), total=Sum("valor"))

    horas_do_mes = ApontamentoHora.objects.filter(
        escritorio=escritorio, faturavel=True, data__gte=inicio_do_mes
    )
    minutos_do_mes = horas_do_mes.aggregate(total=Sum("minutos"))["total"] or 0
    valor_horas_do_mes = sum((a.valor or zero) for a in horas_do_mes)

    despesas_a_reembolsar = (
        Despesa.objects
        .filter(escritorio=escritorio, reembolsavel=True, reembolsada=False)
        .aggregate(total=Sum("valor"))["total"]
        or zero
    )

    return {
        "a_receber": a_receber,
        "recebido_no_mes": recebido_no_mes,
        "parcelas_vencidas": vencidas_resumo["quantidade"] or 0,
        "valor_vencido": vencidas_resumo["total"] or zero,
        "minutos_faturaveis_no_mes": minutos_do_mes,
        "valor_horas_faturaveis_no_mes": valor_horas_do_mes or zero,
        "despesas_a_reembolsar": despesas_a_reembolsar,
    }


def _estatisticas_do_escritorio(escritorio):
    processos_por_status = (
        Processo.objects
        .filter(escritorio=escritorio)
        .values("status")
        .annotate(total=Count("id"))
        .order_by("status")
    )

    return (
        {
            "escritorio": EscritorioSerializer(
                escritorio
            ).data,

            "totais": {
                "clientes": Cliente.objects.filter(
                    escritorio=escritorio
                ).count(),

                "processos": Processo.objects.filter(
                    escritorio=escritorio
                ).count(),

                "advogados": Advogado.objects.filter(
                    escritorio=escritorio
                ).count(),

                "documentos": Documento.objects.filter(
                    processo__escritorio=escritorio
                ).count(),

                "agenda": Agenda.objects.filter(
                    escritorio=escritorio
                ).count(),
            },

            "processos_por_status": list(
                processos_por_status
            ),

            "financeiro": _indicadores_financeiros(escritorio),
        }
    )


class DashboardStatsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response(
                {"detail": "Usuário não identificado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response(_estatisticas_do_escritorio(usuario.escritorio))


QUANTIDADE_RECENTES_DASHBOARD = 5


MESES_NO_GRAFICO_FINANCEIRO = 6


def _financeiro_mensal(escritorio, meses=MESES_NO_GRAFICO_FINANCEIRO):
    """Recebido (parcelas pagas) e despesas lançadas, mês a mês, dos últimos
    `meses` meses incluindo o atual — a série do gráfico da dashboard.

    Os meses sem movimento aparecem com zero: um buraco no eixo faria um mês
    parado parecer dado faltando.
    """
    zero = Decimal("0.00")
    hoje = timezone.localdate()
    primeiro = _somar_meses(hoje.replace(day=1), -(meses - 1))

    recebido = {
        (linha["mes"].year, linha["mes"].month): linha["total"]
        for linha in Parcela.objects.filter(
            contrato__escritorio=escritorio, status="pago", pago_em__date__gte=primeiro
        )
        .annotate(mes=TruncMonth("pago_em"))
        .values("mes")
        .annotate(total=Sum("valor"))
    }
    despesas = {
        (linha["mes"].year, linha["mes"].month): linha["total"]
        for linha in Despesa.objects.filter(escritorio=escritorio, data__gte=primeiro)
        .annotate(mes=TruncMonth("data"))
        .values("mes")
        .annotate(total=Sum("valor"))
    }

    serie = []
    for i in range(meses):
        mes = _somar_meses(primeiro, i)
        chave = (mes.year, mes.month)
        serie.append({
            "mes": mes.strftime("%Y-%m"),
            "recebido": str(recebido.get(chave) or zero),
            "despesas": str(despesas.get(chave) or zero),
        })
    return serie


class DashboardResumoView(APIView):
    """Tudo o que a dashboard desenha numa única requisição.

    Antes a tela abria com 14 chamadas, uma lista completa por área (inclusive
    as que ela nem desenhava, só para a busca do topo). Agora vêm só os
    totais, os cinco itens mais recentes de cada cartão e a agenda do
    calendário; a busca consulta /api/busca/ sob demanda.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response(
                {"detail": "Usuário não identificado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        escritorio = usuario.escritorio
        contexto = {"request": request}
        n = QUANTIDADE_RECENTES_DASHBOARD
        semana_passada = timezone.now() - timezone.timedelta(days=7)

        processos = (
            esconder_sigilosos(Processo.objects.filter(escritorio=escritorio), usuario)
            .select_related("cliente", "advogado__usuario")
            .prefetch_related(
                Prefetch(
                    "eventos_agenda",
                    queryset=Agenda.objects.filter(tipo="prazo", cumprido=False)
                    .order_by("data_evento", "pk"),
                    to_attr="prazos_pendentes_ordenados",
                )
            )
            .order_by("-criado_em")[:n]
        )
        documentos = (
            esconder_sigilosos(Documento.objects.filter(processo__escritorio=escritorio), usuario)
            .select_related("processo")
            .order_by("-enviado_em")[:n]
        )
        minhas_tarefas = ordenacao_de_trabalho(
            esconder_sigilosos(
                Tarefa.objects.filter(escritorio=escritorio, responsavel=usuario), usuario
            )
            .exclude(status__in=Tarefa.STATUS_ENCERRADOS)
            .select_related("processo", "processo__cliente", "responsavel", "criado_por")
        )[:n]
        # O calendário navega entre meses, então a agenda vai inteira — mas
        # só ela, e não mais junto com todas as outras listas.
        agenda = (
            esconder_sigilosos(Agenda.objects.filter(escritorio=escritorio), usuario)
            .select_related("processo__cliente", "processo__advogado__usuario")
            .order_by("data_evento")
        )

        dados = _estatisticas_do_escritorio(escritorio)
        # Quem não tem acesso ao financeiro (estagiário, secretária) não
        # recebe valores — nem para a tela esconder depois.
        if not pode(usuario, "financeiro", VER):
            dados.pop("financeiro", None)
        dados.update({
            "novos_na_semana": {
                "clientes": Cliente.objects.filter(
                    escritorio=escritorio, criado_em__gte=semana_passada
                ).count(),
                "processos": Processo.objects.filter(
                    escritorio=escritorio, criado_em__gte=semana_passada
                ).count(),
                "agenda": Agenda.objects.filter(
                    escritorio=escritorio, criado_em__gte=semana_passada
                ).count(),
                "documentos": Documento.objects.filter(
                    processo__escritorio=escritorio, enviado_em__gte=semana_passada
                ).count(),
            },
            "processos_recentes": ProcessoSerializer(processos, many=True, context=contexto).data,
            "documentos_recentes": DocumentoSerializer(documentos, many=True, context=contexto).data,
            "minhas_tarefas": TarefaSerializer(minhas_tarefas, many=True, context=contexto).data,
            "agenda": AgendaSerializer(agenda, many=True, context=contexto).data,
            "financeiro_mensal": (
                _financeiro_mensal(escritorio) if pode(usuario, "financeiro", VER) else None
            ),
            "tipo_usuario": usuario.tipo_usuario,
            "permissoes": permissoes_do_perfil(usuario.tipo_usuario),
        })
        return Response(dados)
