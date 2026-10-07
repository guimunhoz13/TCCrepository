from django.apps import AppConfig


class AdvocaciaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'advocacia'

    def ready(self):
        # Registra a extensão de autenticação da documentação da API.
        from . import esquema_api  # noqa: F401