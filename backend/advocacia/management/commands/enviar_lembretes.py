"""Envia por e-mail os lembretes de agenda e o resumo semanal.

Feito para rodar uma vez por dia por um agendador externo (cron, Task
Scheduler ou o agendador da hospedagem). O comando é idempotente: cada
aviso é registrado em NotificacaoEnviada, então rodar duas vezes no mesmo
dia não reenvia nada.

    python manage.py enviar_lembretes
    python manage.py enviar_lembretes --dry-run
    python manage.py enviar_lembretes --resumo-semanal
"""

import logging

from django.core.management.base import BaseCommand
from django.db import IntegrityError, transaction
from django.utils import timezone

from advocacia.emails import (
    enviar_email,
    montar_email_lembrete_evento,
    montar_email_resumo_semanal,
)
from advocacia.models import Agenda, NotificacaoEnviada, Parcela, Processo, Usuario

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Envia lembretes de compromissos/prazos e o resumo semanal por e-mail."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Mostra o que seria enviado sem enviar e sem registrar nada.",
        )
        parser.add_argument(
            "--resumo-semanal",
            action="store_true",
            help="Força o envio do resumo semanal fora da segunda-feira.",
        )

    def handle(self, *args, **opcoes):
        self.dry_run = opcoes["dry_run"]
        agora = timezone.localtime()

        # O resumo sai às segundas; a flag permite demonstrar em qualquer dia.
        enviar_resumo = opcoes["resumo_semanal"] or agora.weekday() == 0

        destinatarios = (
            Usuario.objects.filter(ativo=True, escritorio__ativo=True)
            .select_related("escritorio", "preferencias")
        )

        total_lembretes = 0
        total_resumos = 0

        for usuario in destinatarios:
            preferencias = getattr(usuario, "preferencias", None)
            if preferencias is None or not usuario.email:
                continue

            total_lembretes += self._enviar_lembretes(usuario, preferencias, agora)

            if enviar_resumo and preferencias.resumo_semanal:
                total_resumos += self._enviar_resumo(usuario, agora)

        prefixo = "[dry-run] " if self.dry_run else ""
        self.stdout.write(
            self.style.SUCCESS(
                f"{prefixo}{total_lembretes} lembrete(s) e {total_resumos} resumo(s) semanal(is)."
            )
        )

    # ------------------------------------------------------------------

    def _enviar_lembretes(self, usuario, preferencias, agora):
        # "lembrete_audiencia" é como a preferência aparece na interface; no
        # modelo, o tipo correspondente é "compromisso".
        tipos = []
        if preferencias.lembrete_audiencia:
            tipos.append("compromisso")
        if preferencias.lembrete_prazo:
            tipos.append("prazo")

        if not tipos:
            return 0

        limite = agora + timezone.timedelta(days=preferencias.antecedencia_audiencia)

        eventos = (
            Agenda.objects.filter(
                processo__escritorio=usuario.escritorio,
                cumprido=False,
                tipo__in=tipos,
                data_evento__gte=agora,
                data_evento__lte=limite,
            )
            .select_related("processo")
            .order_by("data_evento")
        )

        enviados = 0
        for evento in eventos:
            # data_evento é gravado em UTC; comparar o dia exige converter para
            # o fuso local, senão um evento à noite conta um dia a mais.
            dias = (timezone.localtime(evento.data_evento).date() - agora.date()).days
            chave = f"lembrete_evento:{evento.id}"

            if self._ja_enviado(usuario, chave):
                continue

            assunto, corpo_html, corpo_texto = montar_email_lembrete_evento(
                usuario.nome, evento, usuario.escritorio.nome, dias
            )

            if self._entregar(usuario, assunto, corpo_html, corpo_texto, "lembrete_evento", chave, evento):
                enviados += 1

        return enviados

    def _enviar_resumo(self, usuario, agora):
        semana = agora.isocalendar()
        chave = f"resumo_semanal:{semana[0]}-W{semana[1]:02d}"

        if self._ja_enviado(usuario, chave):
            return 0

        escritorio = usuario.escritorio
        em_sete_dias = agora + timezone.timedelta(days=7)
        ha_sete_dias = agora - timezone.timedelta(days=7)

        eventos = list(
            Agenda.objects.filter(
                processo__escritorio=escritorio,
                cumprido=False,
                data_evento__gte=agora,
                data_evento__lte=em_sete_dias,
            )
            .select_related("processo")
            .order_by("data_evento")
        )

        processos_novos = list(
            Processo.objects.filter(escritorio=escritorio, criado_em__gte=ha_sete_dias).order_by("-criado_em")
        )

        parcelas = list(
            Parcela.objects.filter(
                contrato__escritorio=escritorio,
                status="pendente",
                data_vencimento__gte=agora.date(),
                data_vencimento__lte=em_sete_dias.date(),
            )
            .select_related("contrato__processo")
            .order_by("data_vencimento")
        )

        assunto, corpo_html, corpo_texto = montar_email_resumo_semanal(
            usuario.nome, escritorio.nome, eventos, processos_novos, parcelas
        )

        return 1 if self._entregar(usuario, assunto, corpo_html, corpo_texto, "resumo_semanal", chave, None) else 0

    # ------------------------------------------------------------------

    def _ja_enviado(self, usuario, chave):
        return NotificacaoEnviada.objects.filter(usuario=usuario, chave=chave).exists()

    def _entregar(self, usuario, assunto, corpo_html, corpo_texto, tipo, chave, evento):
        if self.dry_run:
            self.stdout.write(f"  [dry-run] {usuario.email}: {assunto}")
            return True

        # O registro é gravado antes do envio para que duas execuções
        # simultâneas não mandem o mesmo aviso duas vezes.
        try:
            with transaction.atomic():
                NotificacaoEnviada.objects.create(
                    usuario=usuario, tipo=tipo, chave=chave, agenda=evento
                )
        except IntegrityError:
            return False

        try:
            enviar_email(usuario.email, assunto, corpo_html, corpo_texto)
        except Exception:
            logger.exception("Falha ao enviar '%s' para %s", assunto, usuario.email)
            NotificacaoEnviada.objects.filter(usuario=usuario, chave=chave).delete()
            return False

        return True
