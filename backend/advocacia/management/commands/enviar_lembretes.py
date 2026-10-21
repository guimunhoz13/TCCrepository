"""Envia por e-mail e push os lembretes de agenda e o resumo semanal.

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
from advocacia.permissoes import VER, pode
from advocacia.push import notificar_usuario
from advocacia.sigilo import esconder_sigilosos

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Envia lembretes de compromissos/prazos por e-mail e push, além do resumo semanal."

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
            if preferencias is None:
                continue

            total_lembretes += self._enviar_lembretes(usuario, preferencias, agora)

            if enviar_resumo and preferencias.resumo_semanal and usuario.email:
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

        antecedencia = preferencias.antecedencia_audiencia
        # Mesmo que a pessoa tenha escolhido apenas um dia, o prazo fatal
        # começa a alertar dois dias antes. Compromissos e prazos comuns
        # continuam respeitando exatamente a antecedência escolhida.
        alcance = max(antecedencia, 2 if preferencias.lembrete_prazo else antecedencia)
        inicio_hoje = agora.replace(hour=0, minute=0, second=0, microsecond=0)
        # A preferência é expressa em dias de calendário, não em uma janela
        # exata de 24 horas. Às 7h, um evento de depois das 7h daqui a dois
        # dias já precisa entrar no aviso de "2 dias antes".
        limite = (agora + timezone.timedelta(days=alcance)).replace(
            hour=23, minute=59, second=59, microsecond=999999
        )

        eventos = (
            esconder_sigilosos(
                Agenda.objects.filter(
                    escritorio=usuario.escritorio,
                    cumprido=False,
                    tipo__in=tipos,
                    data_evento__gte=inicio_hoje,
                    data_evento__lte=limite,
                ),
                usuario,
            )
            .select_related("processo")
            .order_by("data_evento")
        )

        enviados = 0
        for evento in eventos:
            # data_evento é gravado em UTC; comparar o dia exige converter para
            # o fuso local, senão um evento à noite conta um dia a mais.
            dias = (timezone.localtime(evento.data_evento).date() - agora.date()).days
            fatal = evento.tipo == "prazo" and evento.prioridade == "fatal"
            if dias > antecedencia and not (fatal and dias <= 2):
                continue

            chave_legada = f"lembrete_evento:{evento.id}"
            chave_base = self._chave_do_lembrete(evento, dias)

            # Registros da versão anterior não tinham canal nem etapa. Eles
            # equivalem ao primeiro aviso; os reforços posteriores de prazo
            # fatal continuam podendo sair em 2 dias, 1 dia e no próprio dia.
            etapa_inicial = chave_base.endswith(":inicial")
            if self._ja_enviado(usuario, chave_legada) and (not fatal or etapa_inicial):
                continue

            email_enviado = False
            chave_email = f"{chave_base}:email"
            if usuario.email and not self._ja_enviado(usuario, chave_email):
                assunto, corpo_html, corpo_texto = montar_email_lembrete_evento(
                    usuario.nome, evento, usuario.escritorio.nome, dias
                )
                email_enviado = self._entregar(
                    usuario,
                    assunto,
                    corpo_html,
                    corpo_texto,
                    "lembrete_evento",
                    chave_email,
                    evento,
                )

            push_enviado = False
            chave_push = f"{chave_base}:push"
            if not self._ja_enviado(usuario, chave_push):
                quando = "hoje" if dias <= 0 else ("amanhã" if dias == 1 else f"em {dias} dias")
                rotulo = (
                    "PRAZO FATAL"
                    if fatal
                    else ("Prazo" if evento.tipo == "prazo" else "Compromisso")
                )
                processo = (
                    f" · Proc. {evento.processo.numero_processo}"
                    if evento.processo_id
                    else ""
                )
                push_enviado = self._entregar_push(
                    usuario,
                    f"{rotulo} {quando}",
                    f"{evento.titulo}{processo}",
                    chave_push,
                    evento,
                )

            if email_enviado or push_enviado:
                enviados += 1

        return enviados

    def _enviar_resumo(self, usuario, agora):
        if not usuario.email:
            return 0
        semana = agora.isocalendar()
        chave = f"resumo_semanal:{semana[0]}-W{semana[1]:02d}"

        if self._ja_enviado(usuario, chave):
            return 0

        escritorio = usuario.escritorio
        em_sete_dias = agora + timezone.timedelta(days=7)
        ha_sete_dias = agora - timezone.timedelta(days=7)

        eventos = list(
            esconder_sigilosos(
                Agenda.objects.filter(
                    escritorio=escritorio,
                    cumprido=False,
                    data_evento__gte=agora,
                    data_evento__lte=em_sete_dias,
                ),
                usuario,
            )
            .select_related("processo")
            .order_by("data_evento")
        )

        processos_novos = list(
            esconder_sigilosos(
                Processo.objects.filter(escritorio=escritorio, criado_em__gte=ha_sete_dias),
                usuario,
            ).order_by("-criado_em")
        )

        # Cobranças só no resumo de quem tem acesso ao financeiro.
        parcelas = []
        if pode(usuario, "financeiro", VER):
            parcelas = list(
                esconder_sigilosos(
                    Parcela.objects.filter(
                        contrato__escritorio=escritorio,
                        status="pendente",
                        data_vencimento__gte=agora.date(),
                        data_vencimento__lte=em_sete_dias.date(),
                    ),
                    usuario,
                    "contrato__processo",
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

    @staticmethod
    def _chave_do_lembrete(evento, dias):
        base = f"lembrete_evento:{evento.id}"
        if evento.tipo != "prazo" or evento.prioridade != "fatal":
            return base
        if dias <= 0:
            return f"{base}:fatal:hoje"
        if dias == 1:
            return f"{base}:fatal:1d"
        if dias == 2:
            return f"{base}:fatal:2d"
        return f"{base}:fatal:inicial"

    def _entregar_push(self, usuario, titulo, corpo, chave, evento):
        # Sem aparelho inscrito não há falha: simplesmente não existe um
        # destino push. O e-mail segue independente desse canal.
        if not usuario.inscricoes_push.exists():
            return False
        if self.dry_run:
            self.stdout.write(f"  [dry-run push] {usuario.nome}: {titulo}")
            return True

        try:
            with transaction.atomic():
                NotificacaoEnviada.objects.create(
                    usuario=usuario,
                    tipo="lembrete_evento",
                    chave=chave,
                    agenda=evento,
                )
        except IntegrityError:
            return False

        enviados = notificar_usuario(
            usuario,
            titulo,
            corpo,
            url="/dashboard",
            # O mesmo evento substitui a notificação anterior no aparelho,
            # evitando empilhar quatro cartões para um único prazo fatal.
            tag=f"lembrete-{evento.pk}",
        )
        if enviados <= 0:
            NotificacaoEnviada.objects.filter(usuario=usuario, chave=chave).delete()
            return False
        return True

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
