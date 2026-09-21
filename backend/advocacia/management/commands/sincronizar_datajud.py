"""Consulta o DataJud para os processos ativos e avisa sobre andamentos novos.

Separado de `enviar_lembretes` de propósito: cada consulta é uma chamada
HTTP a um serviço externo, então esta rotina é lenta e sujeita a falhas que
não devem atrapalhar o envio dos lembretes.

    python manage.py sincronizar_datajud
    python manage.py sincronizar_datajud --dry-run
    python manage.py sincronizar_datajud --limite 20 --intervalo-horas 24
"""

import logging
import time

from django.core.management.base import BaseCommand
from django.db.models import F, Q
from django.utils import timezone

from advocacia.datajud import ErroDataJud, consultar_processo, importar_movimentacoes
from advocacia.emails import enviar_email, montar_email_movimentacoes
from advocacia.models import Movimentacao, Processo, Usuario

logger = logging.getLogger(__name__)

# Status em que ainda faz sentido acompanhar o andamento. Processo concluído
# ou arquivado não é consultado, para não gastar chamada à API à toa.
STATUS_ACOMPANHADOS = ("Em andamento", "Suspenso")

# Pausa entre consultas, para não pressionar a API pública do CNJ.
PAUSA_ENTRE_CONSULTAS = 1.0


class Command(BaseCommand):
    help = "Consulta o DataJud para os processos ativos e importa os andamentos novos."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Mostra o que seria consultado, sem chamar a API nem gravar nada.",
        )
        parser.add_argument(
            "--limite",
            type=int,
            default=50,
            help="Máximo de processos por execução (padrão: 50).",
        )
        parser.add_argument(
            "--intervalo-horas",
            type=int,
            default=12,
            help="Não reconsulta um processo sincronizado há menos de N horas (padrão: 12).",
        )

    def handle(self, *args, **opcoes):
        dry_run = opcoes["dry_run"]
        limite = opcoes["limite"]
        corte = timezone.now() - timezone.timedelta(hours=opcoes["intervalo_horas"])

        processos = (
            Processo.objects.filter(
                status__in=STATUS_ACOMPANHADOS,
                escritorio__ativo=True,
            )
            .filter(
                # Nunca sincronizado, ou sincronizado antes do corte.
                Q(datajud_sincronizado_em__isnull=True)
                | Q(datajud_sincronizado_em__lt=corte)
            )
            .select_related("escritorio")
            # No Postgres, ASC coloca NULL por último. Sem nulls_first, um
            # processo nunca sincronizado ficaria no fim da fila e poderia
            # nunca ser alcançado pelo limite da execução.
            .order_by(F("datajud_sincronizado_em").asc(nulls_first=True))[:limite]
        )

        consultados = 0
        importados = 0
        falhas = 0

        for processo in processos:
            if dry_run:
                self.stdout.write(f"  [dry-run] consultaria {processo.numero_processo}")
                consultados += 1
                continue

            try:
                dados = consultar_processo(processo.numero_processo)
            except ErroDataJud as erro:
                # Um processo com número fora do padrão ou de um tribunal não
                # coberto não pode interromper a varredura dos demais.
                logger.info("DataJud não consultou %s: %s", processo.numero_processo, erro)
                falhas += 1
                continue
            except Exception:
                logger.exception("Falha inesperada ao consultar %s", processo.numero_processo)
                falhas += 1
                continue

            consultados += 1
            processo.datajud_sincronizado_em = timezone.now()
            processo.save(update_fields=["datajud_sincronizado_em"])

            if dados is None:
                continue

            quantidade, _ = importar_movimentacoes(processo, dados["movimentos"])

            if quantidade:
                importados += quantidade
                self._avisar(processo, quantidade)

            time.sleep(PAUSA_ENTRE_CONSULTAS)

        prefixo = "[dry-run] " if dry_run else ""
        self.stdout.write(
            self.style.SUCCESS(
                f"{prefixo}{consultados} processo(s) consultado(s), "
                f"{importados} andamento(s) importado(s), {falhas} falha(s)."
            )
        )

    def _avisar(self, processo, quantidade):
        """Avisa quem optou por receber aviso de andamento novo."""

        novos = list(
            Movimentacao.objects.filter(processo=processo, origem="datajud")
            .order_by("-data_movimentacao")[:quantidade]
        )

        destinatarios = (
            Usuario.objects.filter(
                ativo=True,
                escritorio=processo.escritorio,
                preferencias__notificacao_movimentacao=True,
            )
            .exclude(email="")
        )

        for usuario in destinatarios:
            assunto, corpo_html, corpo_texto = montar_email_movimentacoes(
                usuario.nome, processo.escritorio.nome, processo, novos
            )
            try:
                enviar_email(usuario.email, assunto, corpo_html, corpo_texto)
            except Exception:
                logger.exception(
                    "Falha ao avisar %s sobre andamento em %s",
                    usuario.email,
                    processo.numero_processo,
                )
