from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError

from advocacia.models import SuperAdmin


class Command(BaseCommand):
    help = "Cria (ou atualiza a senha de) um administrador do sistema (painel mestre)."

    def add_arguments(self, parser):
        parser.add_argument("--nome", required=True)
        parser.add_argument("--email", required=True)
        parser.add_argument("--senha", required=True)

    def handle(self, *args, **options):
        nome = options["nome"]
        email = options["email"].strip().lower()
        senha = options["senha"]

        if len(senha) < 6:
            raise CommandError("A senha deve ter pelo menos 6 caracteres.")

        superadmin, criado = SuperAdmin.objects.update_or_create(
            email=email,
            defaults={"nome": nome, "senha": make_password(senha), "ativo": True},
        )

        acao = "criado" if criado else "atualizado"
        self.stdout.write(self.style.SUCCESS(f"Administrador do sistema {acao}: {superadmin.email}"))
