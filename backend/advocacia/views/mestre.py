"""Painel mestre (administração do sistema pelo desenvolvedor)."""


from django.contrib.auth.hashers import check_password
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from ..mixins import (
    IsMasterUser,
    registrar_auditoria,
)
from ..models import (
    Advogado,
    Cliente,
    Escritorio,
    Processo,
    RegistroAuditoria,
    SuperAdmin,
)
from ..serializers import (
    EscritorioAdminSerializer,
    RegistroAuditoriaSerializer,
)

# =========================================================
# PAINEL MESTRE (DESENVOLVEDOR)
# =========================================================

class MasterLoginView(APIView):

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "login"

    def post(self, request):

        email = request.data.get("email", "").strip()
        senha = request.data.get("senha", "")

        if not email or not senha:
            return Response(
                {"detail": "Informe o e-mail e a senha."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            superadmin = SuperAdmin.objects.get(email__iexact=email)
        except SuperAdmin.DoesNotExist:
            return Response(
                {"detail": "E-mail ou senha inválidos."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not superadmin.ativo:
            return Response(
                {"detail": "Este acesso está desativado."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not check_password(senha, superadmin.senha):
            registrar_auditoria(
                request,
                "login_falha",
                superadmin=superadmin,
                descricao=f"Senha inválida para o mestre {superadmin.email}.",
            )
            return Response(
                {"detail": "E-mail ou senha inválidos."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        registrar_auditoria(
            request,
            "login_sucesso",
            superadmin=superadmin,
            descricao=f"Login mestre realizado por {superadmin.email}.",
        )

        refresh = RefreshToken()
        refresh["user_id"] = f"master-{superadmin.id}"
        refresh["is_master"] = True
        refresh["superadmin_id"] = superadmin.id
        refresh["nome"] = superadmin.nome
        refresh["email"] = superadmin.email

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "superadmin": {
                    "id": superadmin.id,
                    "nome": superadmin.nome,
                    "email": superadmin.email,
                },
            },
            status=status.HTTP_200_OK,
        )


class MasterEscritorioViewSet(viewsets.ModelViewSet):

    queryset = Escritorio.objects.all().order_by("-criado_em")

    serializer_class = EscritorioAdminSerializer

    permission_classes = [IsMasterUser]

    def perform_create(self, serializer):
        serializer.save()
        registrar_auditoria(
            self.request, "criacao", serializer.instance, escritorio=serializer.instance
        )

    def perform_update(self, serializer):
        serializer.save()
        registrar_auditoria(
            self.request, "edicao", serializer.instance, escritorio=serializer.instance
        )

    def perform_destroy(self, instance):
        descricao = str(instance)
        objeto_id = instance.id
        instance.delete()
        registrar_auditoria(
            self.request,
            "exclusao",
            descricao=descricao,
            modelo="Escritorio",
            objeto_id=objeto_id,
        )


class MasterAuditoriaViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = (
        RegistroAuditoria.objects.all()
        .select_related("usuario", "superadmin", "escritorio")
        .order_by("-criado_em")
    )

    serializer_class = RegistroAuditoriaSerializer

    permission_classes = [IsMasterUser]


class MasterStatsView(APIView):

    permission_classes = [IsMasterUser]

    def get(self, request):
        return Response(
            {
                "total_escritorios": Escritorio.objects.count(),
                "escritorios_ativos": Escritorio.objects.filter(ativo=True).count(),
                "escritorios_inativos": Escritorio.objects.filter(ativo=False).count(),
                "total_advogados": Advogado.objects.count(),
                "total_clientes": Cliente.objects.count(),
                "total_processos": Processo.objects.count(),
            }
        )
