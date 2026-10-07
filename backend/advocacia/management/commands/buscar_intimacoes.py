"""Busca no DJEN as intimações dos advogados de todos os escritórios ativos.

Para rodar uma vez por dia (o DJEN publica de madrugada):

    python manage.py buscar_intimacoes
    python manage.py buscar_intimacoes --dias 15
"""

from django.core.management.base import BaseCommand

from advocacia.djen import DIAS_PARA_TRAS, importar_intimacoes
from advocacia.models import Escritorio


class Command(BaseCommand):
    help = "Busca no DJEN as intimações novas e lança os prazos na agenda."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dias",
            type=int,
            default=DIAS_PARA_TRAS,
            help=f"Quantos dias para trás consultar (padrão: {DIAS_PARA_TRAS}).",
        )

    def handle(self, *args, **opcoes):
        total = 0
        for escritorio in Escritorio.objects.filter(ativo=True):
            resultado = importar_intimacoes(escritorio, dias=opcoes["dias"])
            novas = len(resultado["novas"])
            total += novas
            self.stdout.write(
                f"{escritorio.nome}: {novas} nova(s), "
                f"{resultado['advogados_consultados']} advogado(s) consultado(s)"
                + (f", sem OAB válida: {', '.join(resultado['sem_oab'])}" if resultado["sem_oab"] else "")
                + (f", erro: {resultado['erros'][0]}" if resultado["erros"] else "")
            )
        self.stdout.write(self.style.SUCCESS(f"Total: {total} intimação(ões) nova(s)."))
