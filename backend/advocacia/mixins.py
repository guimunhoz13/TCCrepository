from django.db import IntegrityError

from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Usuario


def get_usuario_from_request(request):

    if not request.auth:
        return None

    user_id = request.auth.get("user_id")

    if not user_id:
        return None

    try:
        return Usuario.objects.select_related("escritorio").get(id=user_id)
    except Usuario.DoesNotExist:
        return None


class EscritorioScopedMixin:

    def get_usuario(self):
        return get_usuario_from_request(self.request)

    def get_escritorio(self):
        usuario = self.get_usuario()
        return usuario.escritorio if usuario else None

    def get_queryset(self):
        queryset = super().get_queryset()
        escritorio = self.get_escritorio()

        if not escritorio:
            return queryset.none()

        if hasattr(queryset.model, "escritorio"):
            return queryset.filter(escritorio=escritorio)

        if queryset.model.__name__ == "Movimentacao":
            return queryset.filter(processo__escritorio=escritorio)

        if queryset.model.__name__ == "Documento":
            return queryset.filter(processo__escritorio=escritorio)

        if queryset.model.__name__ == "Agenda":
            return queryset.filter(processo__escritorio=escritorio)

        return queryset

    def perform_create(self, serializer):
        escritorio = self.get_escritorio()

        if not escritorio:
            raise PermissionDenied("Escritório não identificado.")

        kwargs = {}
        if "escritorio" in serializer.validated_data or hasattr(
            serializer.Meta.model, "escritorio"
        ):
            kwargs["escritorio"] = escritorio

        self._salvar(serializer, **kwargs)

    def perform_update(self, serializer):
        self._salvar(serializer)

    def _salvar(self, serializer, **kwargs):
        """Salva o serializer, convertendo uma violação de constraint única
        (ex.: CPF/número de processo/OAB repetido no mesmo escritório — não
        detectável pelo DRF porque o campo "escritorio" não é exposto no
        serializer) num erro 400 claro, em vez de deixar o IntegrityError
        virar um 500 sem mensagem específica para o usuário.
        """
        try:
            serializer.save(**kwargs)
        except IntegrityError:
            raise ValidationError(
                {"detail": "Já existe um registro com esses dados neste escritório."}
            )
