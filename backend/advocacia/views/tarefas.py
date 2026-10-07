"""Tarefas com responsável e quadro Kanban."""

import logging
from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from ..emails import (
    enviar_email,
    montar_email_aviso,
)
from ..mixins import (
    EscritorioScopedMixin,
    registrar_auditoria,
)
from ..models import (
    Tarefa,
    ordenacao_de_trabalho,
)
from ..permissoes import PermissaoPorPerfil
from ..push import notificar_usuario
from ..serializers import (
    TarefaSerializer,
)

logger = logging.getLogger(__name__)


# =========================================================
# TAREFAS
# =========================================================

def _avisar_responsavel(request, tarefa, escritorio, autor):
    """Avisa por e-mail quem acabou de receber a tarefa.

    Atribuir uma tarefa sem avisar é o mesmo que não atribuir. Quem se
    atribui uma tarefa não recebe aviso de si mesmo.
    """

    responsavel = tarefa.responsavel

    if autor is not None and responsavel.pk == autor.pk:
        return
    if not responsavel.ativo:
        return

    preferencias = getattr(responsavel, "preferencias", None)
    if preferencias is not None and not preferencias.notificacao_tarefa_atribuida:
        return

    notificar_usuario(
        responsavel,
        "Nova tarefa para você",
        tarefa.titulo + (f" — prazo {tarefa.prazo:%d/%m}" if tarefa.prazo else ""),
        tag=f"tarefa-{tarefa.pk}",
    )
    if not responsavel.email:
        return

    linhas = [("Tarefa", tarefa.titulo), ("Prioridade", tarefa.get_prioridade_display())]
    if tarefa.prazo:
        linhas.append(("Prazo", tarefa.prazo.strftime("%d/%m/%Y")))
    if tarefa.processo_id:
        linhas.append(("Processo", tarefa.processo.numero_processo))
    if autor is not None:
        linhas.append(("Atribuída por", autor.nome))

    assunto, corpo_html, corpo_texto = montar_email_aviso(
        responsavel.nome,
        escritorio.nome,
        "Nova tarefa atribuída a você",
        "Uma tarefa foi atribuída a você no sistema.",
        linhas,
    )

    try:
        enviar_email(responsavel.email, assunto, corpo_html, corpo_texto)
    except Exception:
        # O aviso nunca pode derrubar a criação da tarefa: sem fila de
        # tarefas no projeto, o envio acontece dentro da própria requisição.
        logger.exception("Falha ao avisar %s sobre a tarefa %s", responsavel.email, tarefa.id)


class TarefaViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Tarefa.objects.all()

    serializer_class = TarefaSerializer

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "tarefas"

    def get_queryset(self):
        queryset = ordenacao_de_trabalho(
            super()
            .get_queryset()
            .select_related("processo", "processo__cliente", "responsavel", "criado_por")
        )

        responsavel = self.request.query_params.get("responsavel")
        if responsavel == "eu":
            usuario = self.get_usuario()
            queryset = queryset.filter(responsavel=usuario) if usuario else queryset.none()
        elif responsavel:
            queryset = queryset.filter(responsavel_id=responsavel)

        processo = self.request.query_params.get("processo")
        if processo:
            queryset = queryset.filter(processo_id=processo)

        status_filtro = self.request.query_params.get("status")
        if status_filtro == "abertas":
            queryset = queryset.exclude(status__in=Tarefa.STATUS_ENCERRADOS)
        elif status_filtro == "quadro":
            # Quadro Kanban: o que está por fazer, em andamento e o que foi
            # concluído nas últimas duas semanas (o resto vira histórico).
            queryset = queryset.filter(
                Q(status__in=("aberta", "em_andamento"))
                | Q(status="concluida", concluida_em__gte=timezone.now() - timedelta(days=14))
            )
        elif status_filtro:
            queryset = queryset.filter(status=status_filtro)

        prioridade = self.request.query_params.get("prioridade")
        if prioridade:
            queryset = queryset.filter(prioridade=prioridade)

        return queryset

    def perform_create(self, serializer):
        escritorio = self.get_escritorio()

        if not escritorio:
            raise PermissionDenied("Escritório não identificado.")

        autor = self.get_usuario()
        self._salvar(serializer, escritorio=escritorio, criado_por=autor)
        registrar_auditoria(self.request, "criacao", serializer.instance, escritorio=escritorio)
        _avisar_responsavel(self.request, serializer.instance, escritorio, autor)

    def perform_update(self, serializer):
        escritorio = self.get_escritorio()
        tarefa = serializer.instance
        status_anterior = tarefa.status
        responsavel_anterior_id = tarefa.responsavel_id

        novo_status = serializer.validated_data.get("status", status_anterior)

        extras = {}
        if novo_status == "concluida" and status_anterior != "concluida":
            extras["concluida_em"] = timezone.now()
        elif novo_status != "concluida" and status_anterior == "concluida":
            # Tarefa reaberta: a data de conclusão anterior não vale mais.
            extras["concluida_em"] = None

        self._salvar(serializer, **extras)
        registrar_auditoria(self.request, "edicao", serializer.instance, escritorio=escritorio)

        if serializer.instance.responsavel_id != responsavel_anterior_id:
            _avisar_responsavel(
                self.request, serializer.instance, escritorio, self.get_usuario()
            )
