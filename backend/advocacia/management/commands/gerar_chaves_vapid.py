"""Gera o par de chaves VAPID das notificações push.

    python manage.py gerar_chaves_vapid

Copie as duas linhas para as variáveis de ambiente do servidor. Trocar as
chaves depois invalida as inscrições já feitas (cada pessoa ativa de novo).
"""

from django.core.management.base import BaseCommand

from advocacia.push import gerar_chaves


class Command(BaseCommand):
    help = "Gera o par de chaves VAPID para as notificações push."

    def handle(self, *args, **opcoes):
        publica, privada = gerar_chaves()
        self.stdout.write(f"VAPID_PUBLIC_KEY={publica}")
        self.stdout.write(f"VAPID_PRIVATE_KEY={privada}")
