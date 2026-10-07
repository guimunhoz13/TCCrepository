"""Tempo de uso do sistema."""

from datetime import date

from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..mixins import (
    get_usuario_from_request,
)
from ..models import (
    JANELA_SESSAO_MINUTOS,
    SessaoUso,
)

# =========================================================
# TEMPO DE USO DO SISTEMA
# =========================================================

class RegistrarAtividadeView(APIView):
    """Recebe o sinal periódico do front enquanto o sistema está aberto.

    Estende a sessão em aberto do usuário ou começa uma nova, se o último
    sinal for antigo demais. Como a contagem termina no último sinal
    recebido, fechar a aba subnotifica alguns minutos — o que é preferível
    a contar tempo que o usuário não passou no sistema.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        usuario = get_usuario_from_request(request)

        if not usuario:
            raise PermissionDenied("Usuário não identificado.")

        agora = timezone.now()
        corte = agora - timezone.timedelta(minutes=JANELA_SESSAO_MINUTOS)

        sessao = (
            SessaoUso.objects.filter(usuario=usuario, ultima_atividade__gte=corte)
            .order_by("-ultima_atividade")
            .first()
        )

        if sessao:
            sessao.ultima_atividade = agora
            sessao.save(update_fields=["ultima_atividade"])
        else:
            sessao = SessaoUso.objects.create(
                escritorio=usuario.escritorio,
                usuario=usuario,
                inicio=agora,
                ultima_atividade=agora,
            )

        return Response({"sessao": sessao.id, "minutos": sessao.duracao_minutos})


class TempoDeUsoView(APIView):
    """Total de tempo de uso do sistema por usuário, em um mês."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = get_usuario_from_request(request)

        if not usuario:
            raise PermissionDenied("Usuário não identificado.")

        mes = request.query_params.get("mes") or timezone.localdate().strftime("%Y-%m")

        try:
            ano_str, mes_str = mes.split("-")
            primeiro_dia = date(int(ano_str), int(mes_str), 1)
        except (ValueError, TypeError):
            return Response(
                {"detail": "Informe o mês no formato AAAA-MM."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if primeiro_dia.month == 12:
            proximo_mes = date(primeiro_dia.year + 1, 1, 1)
        else:
            proximo_mes = date(primeiro_dia.year, primeiro_dia.month + 1, 1)

        # Só o administrador enxerga o tempo de uso da equipe inteira.
        sessoes = SessaoUso.objects.filter(
            escritorio=usuario.escritorio,
            inicio__date__gte=primeiro_dia,
            inicio__date__lt=proximo_mes,
        )

        if usuario.tipo_usuario != "admin":
            sessoes = sessoes.filter(usuario=usuario)

        totais = {}
        for sessao in sessoes.select_related("usuario"):
            registro = totais.setdefault(
                sessao.usuario_id,
                {"usuario": sessao.usuario_id, "usuario_nome": sessao.usuario.nome, "minutos": 0, "sessoes": 0},
            )
            registro["minutos"] += sessao.duracao_minutos
            registro["sessoes"] += 1

        linhas = sorted(totais.values(), key=lambda r: r["minutos"], reverse=True)
        for linha in linhas:
            linha["horas"] = round(linha["minutos"] / 60, 2)

        return Response({"mes": mes, "usuarios": linhas})
