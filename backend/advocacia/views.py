from django.contrib.auth.hashers import check_password
from django.db.models import Count

from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken

from .mixins import EscritorioScopedMixin, get_usuario_from_request

from .models import (
    Escritorio,
    Usuario,
    Cliente,
    Advogado,
    Processo,
    Movimentacao,
    Documento,
    Agenda,
)

from .serializers import (
    EscritorioSerializer,
    EscritorioRegistroSerializer,
    UsuarioSerializer,
    AdvogadoRegistroSerializer,
    ClienteSerializer,
    AdvogadoSerializer,
    ProcessoSerializer,
    MovimentacaoSerializer,
    DocumentoSerializer,
    AgendaSerializer,
)

from .ia_service import montar_contexto_sistema, gerar_resposta_ia


# =========================================================
# LOGIN
# =========================================================

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
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            usuario = (
                Usuario.objects
                .select_related("escritorio")
                .get(email__iexact=email)
            )

        except Usuario.DoesNotExist:
            return Response(
                {
                    "detail": "E-mail ou senha inválidos."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not usuario.ativo:
            return Response(
                {
                    "detail": "Este usuário está desativado."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not usuario.escritorio.ativo:
            return Response(
                {
                    "detail": "Este escritório está desativado."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not check_password(senha, usuario.senha):
            return Response(
                {
                    "detail": "E-mail ou senha inválidos."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken()

        refresh["user_id"] = usuario.id
        refresh["nome"] = usuario.nome
        refresh["email"] = usuario.email
        refresh["tipo_usuario"] = usuario.tipo_usuario
        refresh["escritorio_id"] = usuario.escritorio_id
        refresh["escritorio_nome"] = usuario.escritorio.nome

        return Response(
            {
                "refresh": str(refresh),

                "access": str(refresh.access_token),

                "usuario": {
                    "id": usuario.id,
                    "nome": usuario.nome,
                    "email": usuario.email,
                    "tipo_usuario": usuario.tipo_usuario,
                    "escritorio_id": usuario.escritorio_id,
                    "escritorio_nome": usuario.escritorio.nome,
                },
            },
            status=status.HTTP_200_OK,
        )


class VerificarEmailView(APIView):

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):

        email = request.data.get("email", "").strip()

        if not email:
            return Response(
                {"detail": "Informe o e-mail."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            usuario = (
                Usuario.objects
                .select_related("escritorio")
                .get(email__iexact=email)
            )
        except Usuario.DoesNotExist:
            return Response(
                {
                    "existe": False,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "existe": True,
                "tipo_usuario": usuario.tipo_usuario,
                "nome": usuario.nome,
                "escritorio_nome": usuario.escritorio.nome,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# REGISTRO CENTRAL DO ESCRITÓRIO
# =========================================================

class EscritorioRegistroView(APIView):

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):

        serializer = EscritorioRegistroSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        resultado = serializer.save()

        return Response(
            {
                "detail": "Escritório cadastrado com sucesso.",

                "escritorio": EscritorioSerializer(
                    resultado["escritorio"]
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


# =========================================================
# DASHBOARD
# =========================================================

class DashboardStatsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        usuario = get_usuario_from_request(request)

        if not usuario:
            return Response(
                {
                    "detail": "Usuário não identificado."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        escritorio = usuario.escritorio

        processos_por_status = (
            Processo.objects
            .filter(escritorio=escritorio)
            .values("status")
            .annotate(total=Count("id"))
            .order_by("status")
        )

        return Response(
            {
                "escritorio": EscritorioSerializer(
                    escritorio
                ).data,

                "totais": {
                    "clientes": Cliente.objects.filter(
                        escritorio=escritorio
                    ).count(),

                    "processos": Processo.objects.filter(
                        escritorio=escritorio
                    ).count(),

                    "advogados": Advogado.objects.filter(
                        escritorio=escritorio
                    ).count(),

                    "documentos": Documento.objects.filter(
                        processo__escritorio=escritorio
                    ).count(),

                    "agenda": Agenda.objects.filter(
                        processo__escritorio=escritorio
                    ).count(),
                },

                "processos_por_status": list(
                    processos_por_status
                ),
            }
        )


# =========================================================
# ESCRITÓRIO
# =========================================================

class EscritorioViewSet(
    EscritorioScopedMixin,
    viewsets.ReadOnlyModelViewSet
):

    queryset = Escritorio.objects.all()

    serializer_class = EscritorioSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        escritorio = self.get_escritorio()

        if not escritorio:
            return Escritorio.objects.none()

        return Escritorio.objects.filter(
            id=escritorio.id
        )


# =========================================================
# USUÁRIOS
# =========================================================

class UsuarioViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Usuario.objects.all()

    serializer_class = UsuarioSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            super()
            .get_queryset()
            .filter(
                escritorio=self.get_escritorio()
            )
            .order_by("-criado_em")
        )


# =========================================================
# CADASTRO DE ADVOGADO
# =========================================================

class AdvogadoRegistroView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        usuario_logado = get_usuario_from_request(
            request
        )

        if not usuario_logado:
            return Response(
                {
                    "detail": "Usuário não identificado."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if usuario_logado.tipo_usuario != "admin":
            return Response(
                {
                    "detail":
                    "Somente administradores podem cadastrar advogados."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AdvogadoRegistroSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Advogado.objects.filter(
            escritorio=usuario_logado.escritorio,
            oab=serializer.validated_data["oab"],
        ).exists():

            return Response(
                {
                    "oab": [
                        "OAB já cadastrada neste escritório."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        advogado = serializer.create(
            serializer.validated_data,
            usuario_logado.escritorio,
        )

        return Response(
            AdvogadoSerializer(advogado).data,
            status=status.HTTP_201_CREATED,
        )


# =========================================================
# CLIENTES
# =========================================================

class ClienteViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Cliente.objects.all()

    serializer_class = ClienteSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            super()
            .get_queryset()
            .order_by("-criado_em")
        )


# =========================================================
# ADVOGADOS
# =========================================================

class AdvogadoViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Advogado.objects.all()

    serializer_class = AdvogadoSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            super()
            .get_queryset()
            .select_related(
                "usuario"
            )
            .order_by("-id")
        )


# =========================================================
# PROCESSOS
# =========================================================

class ProcessoViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Processo.objects.all()

    serializer_class = ProcessoSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            super()
            .get_queryset()
            .select_related(
                "cliente",
                "advogado__usuario",
            )
            .order_by("-criado_em")
        )


# =========================================================
# MOVIMENTAÇÕES
# =========================================================

class MovimentacaoViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Movimentacao.objects.all()

    serializer_class = MovimentacaoSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            super()
            .get_queryset()
            .select_related(
                "processo"
            )
            .order_by(
                "-data_movimentacao"
            )
        )


# =========================================================
# DOCUMENTOS
# =========================================================

class DocumentoViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Documento.objects.all()

    serializer_class = DocumentoSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            super()
            .get_queryset()
            .select_related(
                "processo"
            )
            .order_by(
                "-enviado_em"
            )
        )


# =========================================================
# AGENDA
# =========================================================

class AgendaViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Agenda.objects.all()

    serializer_class = AgendaSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            super()
            .get_queryset()
            .select_related(
                "processo__cliente",
                "processo__advogado__usuario",
            )
            .order_by(
                "data_evento"
            )
        )


# =========================================================
# ASSISTENTE IA
# =========================================================

class AssistenteIAView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        usuario = get_usuario_from_request(request)

        if not usuario:
            return Response(
                {"detail": "Usuário não identificado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        mensagem = (request.data.get("mensagem") or "").strip()

        if not mensagem:
            return Response(
                {"detail": "Informe uma mensagem."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        historico = request.data.get("historico") or []
        contexto = request.data.get("contexto") or {}

        cliente_id = contexto.get("cliente_id")
        processo_id = contexto.get("processo_id")

        if cliente_id is not None:
            try:
                cliente_id = int(cliente_id)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "cliente_id inválido."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if processo_id is not None:
            try:
                processo_id = int(processo_id)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "processo_id inválido."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        contexto_sistema = montar_contexto_sistema(
            usuario,
            cliente_id=cliente_id,
            processo_id=processo_id,
        )

        try:
            resposta = gerar_resposta_ia(
                mensagem=mensagem,
                historico=historico,
                contexto_sistema=contexto_sistema,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception:
            return Response(
                {"detail": "Não foi possível obter resposta da IA. Tente novamente."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"resposta": resposta})