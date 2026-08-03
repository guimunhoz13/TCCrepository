from django.contrib.auth.hashers import check_password

from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Usuario,
    Cliente,
    Advogado,
    Processo,
    Movimentacao,
    Documento,
    Agenda,
)

from .serializers import (
    UsuarioSerializer,
    ClienteSerializer,
    AdvogadoSerializer,
    ProcessoSerializer,
    MovimentacaoSerializer,
    DocumentoSerializer,
    AgendaSerializer,
)


class LoginView(APIView):

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):

        email = request.data.get("email", "").strip()
        senha = request.data.get("senha", "")

        if not email or not senha:
            return Response(
                {
                    "detail": "Informe o e-mail e a senha."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            usuario = Usuario.objects.get(
                email__iexact=email
            )

        except Usuario.DoesNotExist:
            return Response(
                {
                    "detail": "E-mail ou senha inválidos."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not usuario.ativo:
            return Response(
                {
                    "detail": "Este usuário está desativado."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if not check_password(senha, usuario.senha):
            return Response(
                {
                    "detail": "E-mail ou senha inválidos."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken()

        refresh["user_id"] = usuario.id
        refresh["nome"] = usuario.nome
        refresh["email"] = usuario.email
        refresh["tipo_usuario"] = usuario.tipo_usuario

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),

                "usuario": {
                    "id": usuario.id,
                    "nome": usuario.nome,
                    "email": usuario.email,
                    "tipo_usuario": usuario.tipo_usuario,
                }
            },
            status=status.HTTP_200_OK
        )


class UsuarioViewSet(viewsets.ModelViewSet):

    queryset = Usuario.objects.all().order_by("-criado_em")
    serializer_class = UsuarioSerializer

    def get_permissions(self):

        if self.action == "create":
            return [AllowAny()]

        return [IsAuthenticated()]


class ClienteViewSet(viewsets.ModelViewSet):

    queryset = Cliente.objects.all().order_by("-criado_em")
    serializer_class = ClienteSerializer

    def get_permissions(self):

        if self.action == "create":
            return [AllowAny()]

        return [IsAuthenticated()]


class AdvogadoViewSet(viewsets.ModelViewSet):

    queryset = (
        Advogado.objects
        .select_related("usuario")
        .all()
        .order_by("-id")
    )

    serializer_class = AdvogadoSerializer
    permission_classes = [IsAuthenticated]


class ProcessoViewSet(viewsets.ModelViewSet):

    queryset = (
        Processo.objects
        .select_related(
            "cliente",
            "advogado__usuario",
        )
        .all()
        .order_by("-criado_em")
    )

    serializer_class = ProcessoSerializer
    permission_classes = [IsAuthenticated]


class MovimentacaoViewSet(viewsets.ModelViewSet):

    queryset = (
        Movimentacao.objects
        .select_related("processo")
        .all()
        .order_by("-data_movimentacao")
    )

    serializer_class = MovimentacaoSerializer
    permission_classes = [IsAuthenticated]


class DocumentoViewSet(viewsets.ModelViewSet):

    queryset = (
        Documento.objects
        .select_related("processo")
        .all()
        .order_by("-enviado_em")
    )

    serializer_class = DocumentoSerializer
    permission_classes = [IsAuthenticated]


class AgendaViewSet(viewsets.ModelViewSet):

    queryset = (
        Agenda.objects
        .select_related(
            "processo__cliente",
            "processo__advogado__usuario",
        )
        .all()
        .order_by("data_evento")
    )

    serializer_class = AgendaSerializer
    permission_classes = [IsAuthenticated]