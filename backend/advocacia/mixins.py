from django.db import IntegrityError
from django.db.models import ProtectedError

from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import BasePermission

from .models import RegistroAuditoria, SuperAdmin, Usuario


def get_usuario_from_request(request):

    if not request.auth:
        return None

    if request.auth.get("is_master"):
        return None

    # A camada de autenticação já carregou e validou a conta; reaproveitar
    # evita uma segunda consulta ao banco em toda requisição.
    conta = getattr(request, "_conta_autenticada", None)
    if isinstance(conta, Usuario):
        return conta

    user_id = request.auth.get("user_id")

    if not user_id:
        return None

    try:
        # Só conta ativa em escritório ativo: um token emitido antes da
        # desativação não pode continuar valendo.
        return (
            Usuario.objects
            .select_related("escritorio")
            .get(id=user_id, ativo=True, escritorio__ativo=True)
        )
    except Usuario.DoesNotExist:
        return None


def get_superadmin_from_request(request):

    if not request.auth or not request.auth.get("is_master"):
        return None

    superadmin_id = request.auth.get("superadmin_id")

    if not superadmin_id:
        return None

    try:
        return SuperAdmin.objects.get(id=superadmin_id, ativo=True)
    except SuperAdmin.DoesNotExist:
        return None


class IsMasterUser(BasePermission):

    def has_permission(self, request, view):
        return get_superadmin_from_request(request) is not None


def obter_ip_requisicao(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def registrar_auditoria(
    request,
    acao,
    instancia=None,
    descricao="",
    escritorio=None,
    modelo=None,
    objeto_id=None,
    usuario=None,
    superadmin=None,
):
    """Cria um RegistroAuditoria para ações sensíveis (login, criação, edição,
    exclusão). Nunca deve derrubar a requisição principal caso algo falhe.

    `usuario`/`superadmin` podem ser passados explicitamente para eventos
    de login, quando ainda não existe um JWT válido na requisição para
    inferi-los automaticamente.
    """
    try:
        usuario = usuario if usuario is not None else get_usuario_from_request(request)
        superadmin = (
            superadmin if superadmin is not None else get_superadmin_from_request(request)
        )

        RegistroAuditoria.objects.create(
            escritorio=escritorio or (usuario.escritorio if usuario else None),
            usuario=usuario,
            superadmin=superadmin,
            acao=acao,
            modelo=modelo or (instancia.__class__.__name__ if instancia is not None else ""),
            objeto_id=objeto_id if objeto_id is not None else getattr(instancia, "id", None),
            descricao=descricao,
            endereco_ip=obter_ip_requisicao(request),
        )
    except Exception:
        pass


class EscritorioScopedMixin:

    def get_usuario(self):
        return get_usuario_from_request(self.request)

    def get_escritorio(self):
        usuario = self.get_usuario()
        return usuario.escritorio if usuario else None

    def get_serializer_context(self):
        """Entrega o escritório ao serializer.

        É o que permite ao EscopoDoEscritorioMixin recusar vínculo com
        registro alheio. Fica aqui, e não em cada viewset, para que o
        próximo recurso a ser escrito já nasça protegido.
        """
        contexto = super().get_serializer_context()
        contexto["escritorio"] = self.get_escritorio()
        return contexto

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

        if queryset.model.__name__ == "Parcela":
            return queryset.filter(contrato__processo__escritorio=escritorio)

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
        registrar_auditoria(
            self.request, "criacao", serializer.instance, escritorio=escritorio
        )

    def perform_update(self, serializer):
        escritorio = self.get_escritorio()
        self._salvar(serializer)
        registrar_auditoria(
            self.request, "edicao", serializer.instance, escritorio=escritorio
        )

    def perform_destroy(self, instance):
        escritorio = self.get_escritorio()
        descricao = str(instance)
        modelo = instance.__class__.__name__
        objeto_id = instance.id

        try:
            instance.delete()
        except ProtectedError:
            # Acontece quando o registro sustenta um histórico — um cliente
            # com processos, por exemplo. Recusar é melhor que apagar em
            # cascata; quem quer tirar da lista inativa o cadastro.
            raise ValidationError({
                "detail": (
                    "Este registro não pode ser excluído porque há processos "
                    "vinculados a ele. Inative-o para retirá-lo das listagens "
                    "sem perder o histórico."
                )
            })
        registrar_auditoria(
            self.request,
            "exclusao",
            descricao=descricao,
            escritorio=escritorio,
            modelo=modelo,
            objeto_id=objeto_id,
        )

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
