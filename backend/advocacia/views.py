from django.contrib.auth.hashers import check_password, make_password
from django.db.models import Count
from django.http import HttpResponse
from django.utils import timezone
import csv

from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken

from django.core.exceptions import ValidationError as DjangoValidationError

from .mixins import EscritorioScopedMixin, get_usuario_from_request
from .validators import validar_email_real, validar_telefone, validar_senha_forte
from .emails import (
    enviar_email,
    montar_email_relatorio_cliente,
    montar_email_relatorio_processo,
)

from .models import (
    Escritorio,
    Usuario,
    Cliente,
    Advogado,
    Processo,
    Movimentacao,
    Documento,
    Agenda,
    PreferenciasUsuario,
    ConfiguracaoEscritorio,
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
    PreferenciasUsuarioSerializer,
    ConfiguracaoEscritorioSerializer,
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
                    "foto": request.build_absolute_uri(usuario.foto.url) if usuario.foto else None,
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
            AdvogadoSerializer(advogado, context={"request": request}).data,
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

    def _verificar_cpf_duplicado(self, serializer):
        cpf = serializer.validated_data.get("cpf")
        if not cpf:
            return
        escritorio = self.get_escritorio()
        conflito = Cliente.objects.filter(escritorio=escritorio, cpf=cpf)
        if serializer.instance:
            conflito = conflito.exclude(pk=serializer.instance.pk)
        if conflito.exists():
            raise ValidationError({"cpf": ["Já existe um cliente com este CPF neste escritório."]})

    def perform_create(self, serializer):
        self._verificar_cpf_duplicado(serializer)
        super().perform_create(serializer)

    def perform_update(self, serializer):
        self._verificar_cpf_duplicado(serializer)
        super().perform_update(serializer)


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

    def perform_update(self, serializer):
        oab = serializer.validated_data.get("oab")
        if oab:
            escritorio = self.get_escritorio()
            conflito = Advogado.objects.filter(escritorio=escritorio, oab=oab).exclude(
                pk=serializer.instance.pk
            )
            if conflito.exists():
                raise ValidationError({"oab": ["OAB já cadastrada neste escritório."]})
        super().perform_update(serializer)


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

    def _verificar_numero_processo_duplicado(self, serializer):
        numero_processo = serializer.validated_data.get("numero_processo")
        if not numero_processo:
            return
        escritorio = self.get_escritorio()
        conflito = Processo.objects.filter(escritorio=escritorio, numero_processo=numero_processo)
        if serializer.instance:
            conflito = conflito.exclude(pk=serializer.instance.pk)
        if conflito.exists():
            raise ValidationError(
                {"numero_processo": ["Já existe um processo com este número neste escritório."]}
            )

    def perform_create(self, serializer):
        self._verificar_numero_processo_duplicado(serializer)
        super().perform_create(serializer)

    def perform_update(self, serializer):
        self._verificar_numero_processo_duplicado(serializer)
        super().perform_update(serializer)


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

# =========================================================
# CONFIGURAÇÕES
# =========================================================

class ConfiguracoesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)

        preferencias, _ = PreferenciasUsuario.objects.get_or_create(usuario=usuario)
        config_escritorio, _ = ConfiguracaoEscritorio.objects.get_or_create(escritorio=usuario.escritorio)

        membros = Usuario.objects.filter(escritorio=usuario.escritorio).order_by("nome")

        contexto = {"request": request}

        return Response({
            "usuario": UsuarioSerializer(usuario, context=contexto).data,
            "escritorio": EscritorioSerializer(usuario.escritorio).data,
            "preferencias": PreferenciasUsuarioSerializer(preferencias).data,
            "configuracao_escritorio": ConfiguracaoEscritorioSerializer(config_escritorio).data,
            "membros": UsuarioSerializer(membros, many=True, context=contexto).data,
        })


class ConfiguracoesContaView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)

        nome = request.data.get("nome", usuario.nome).strip()
        email = request.data.get("email", usuario.email).strip()
        telefone = request.data.get("telefone", usuario.telefone).strip()

        if not nome or not email:
            return Response({"detail": "Nome e e-mail são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validar_email_real(email)
        except DjangoValidationError as exc:
            return Response({"email": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        if Usuario.objects.filter(email__iexact=email).exclude(id=usuario.id).exists():
            return Response({"email": ["E-mail já cadastrado."]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validar_telefone(telefone)
        except DjangoValidationError as exc:
            return Response({"telefone": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        usuario.nome = nome
        usuario.email = email
        usuario.telefone = telefone
        campos_alterados = ["nome", "email", "telefone"]

        if "foto" in request.FILES:
            usuario.foto = request.FILES["foto"]
            campos_alterados.append("foto")

        if "documento_identidade" in request.FILES:
            usuario.documento_identidade = request.FILES["documento_identidade"]
            campos_alterados.append("documento_identidade")

        usuario.save(update_fields=campos_alterados)

        return Response({
            "detail": "Dados pessoais atualizados com sucesso.",
            "usuario": UsuarioSerializer(usuario, context={"request": request}).data,
        })


class ConfiguracoesSenhaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)

        senha_atual = request.data.get("senha_atual", "")
        nova_senha = request.data.get("nova_senha", "")
        confirmar_senha = request.data.get("confirmar_senha", "")

        if not check_password(senha_atual, usuario.senha):
            return Response({"detail": "Senha atual incorreta."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validar_senha_forte(nova_senha)
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)
        if nova_senha != confirmar_senha:
            return Response({"detail": "A confirmação da nova senha não confere."}, status=status.HTTP_400_BAD_REQUEST)

        usuario.senha = make_password(nova_senha)
        usuario.save(update_fields=["senha"])
        return Response({"detail": "Senha alterada com sucesso."})


class ConfiguracoesPreferenciasView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)

        preferencias, _ = PreferenciasUsuario.objects.get_or_create(usuario=usuario)
        serializer = PreferenciasUsuarioSerializer(preferencias, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Preferências salvas com sucesso.", "preferencias": serializer.data})


class ConfiguracoesEscritorioView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)
        if usuario.tipo_usuario != "admin":
            return Response({"detail": "Somente administradores podem alterar o escritório."}, status=status.HTTP_403_FORBIDDEN)

        if "email" in request.data:
            try:
                validar_email_real(request.data["email"])
            except DjangoValidationError as exc:
                return Response({"email": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        if "telefone" in request.data:
            try:
                validar_telefone(request.data["telefone"])
            except DjangoValidationError as exc:
                return Response({"telefone": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        campos = ["nome", "email", "telefone", "endereco", "cidade", "estado"]
        for campo in campos:
            if campo in request.data:
                setattr(usuario.escritorio, campo, request.data[campo])
        usuario.escritorio.save()

        config, _ = ConfiguracaoEscritorio.objects.get_or_create(escritorio=usuario.escritorio)
        config_data = {k: request.data[k] for k in ["timezone", "formato_data", "retencao_documentos"] if k in request.data}
        config_serializer = ConfiguracaoEscritorioSerializer(config, data=config_data, partial=True)
        config_serializer.is_valid(raise_exception=True)
        config_serializer.save()

        return Response({
            "detail": "Dados do escritório atualizados com sucesso.",
            "escritorio": EscritorioSerializer(usuario.escritorio).data,
            "configuracao_escritorio": config_serializer.data,
        })


class ConfiguracoesDesativarEscritorioView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)
        if usuario.tipo_usuario != "admin":
            return Response({"detail": "Somente o administrador pode desativar o escritório."}, status=status.HTTP_403_FORBIDDEN)

        senha = request.data.get("senha", "")
        confirmacao = request.data.get("confirmacao", "")
        if confirmacao != "EXCLUIR":
            return Response({"detail": 'Digite EXCLUIR para confirmar.'}, status=status.HTTP_400_BAD_REQUEST)
        if not check_password(senha, usuario.senha):
            return Response({"detail": "Senha incorreta."}, status=status.HTTP_400_BAD_REQUEST)

        escritorio = usuario.escritorio
        escritorio.ativo = False
        escritorio.save(update_fields=["ativo"])
        Usuario.objects.filter(escritorio=escritorio).update(ativo=False)
        return Response({"detail": "Escritório desativado com sucesso."})


def _montar_dados_relatorio_cliente(usuario, cliente_id, request=None):
    """Monta o payload de relatório de um cliente. Levanta Cliente.DoesNotExist
    quando o cliente não existe ou não pertence ao escritório do usuário."""

    cliente = Cliente.objects.get(id=cliente_id, escritorio=usuario.escritorio)

    processos = (
        Processo.objects
        .filter(cliente=cliente)
        .select_related("advogado__usuario")
        .order_by("-criado_em")
    )
    documentos = (
        Documento.objects
        .filter(processo__cliente=cliente)
        .select_related("processo")
        .order_by("-enviado_em")
    )
    agenda = (
        Agenda.objects
        .filter(processo__cliente=cliente)
        .select_related("processo")
        .order_by("data_evento")
    )

    contexto = {"request": request} if request else {}

    return {
        "gerado_em": timezone.now(),
        "escritorio": EscritorioSerializer(usuario.escritorio).data,
        "cliente": ClienteSerializer(cliente, context=contexto).data,
        "processos": ProcessoSerializer(processos, many=True, context=contexto).data,
        "documentos": DocumentoSerializer(documentos, many=True, context=contexto).data,
        "agenda": AgendaSerializer(agenda, many=True, context=contexto).data,
        "resumo": {
            "total_processos": processos.count(),
            "total_documentos": documentos.count(),
            "total_eventos": agenda.count(),
            "processos_por_status": list(
                processos.values("status").annotate(total=Count("id")).order_by("status")
            ),
        },
    }


def _montar_dados_relatorio_processo(usuario, processo_id, request=None):
    """Monta o payload de relatório de um processo. Levanta Processo.DoesNotExist
    quando o processo não existe ou não pertence ao escritório do usuário."""

    processo = (
        Processo.objects
        .select_related("cliente", "advogado__usuario")
        .get(id=processo_id, escritorio=usuario.escritorio)
    )

    documentos = Documento.objects.filter(processo=processo).order_by("-enviado_em")
    movimentacoes = Movimentacao.objects.filter(processo=processo).order_by("-data_movimentacao")
    agenda = Agenda.objects.filter(processo=processo).order_by("data_evento")

    contexto = {"request": request} if request else {}

    return {
        "gerado_em": timezone.now(),
        "escritorio": EscritorioSerializer(usuario.escritorio).data,
        "processo": ProcessoSerializer(processo, context=contexto).data,
        "cliente": ClienteSerializer(processo.cliente, context=contexto).data,
        "documentos": DocumentoSerializer(documentos, many=True, context=contexto).data,
        "movimentacoes": MovimentacaoSerializer(movimentacoes, many=True, context=contexto).data,
        "agenda": AgendaSerializer(agenda, many=True, context=contexto).data,
    }


class RelatorioClienteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, cliente_id):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            dados = _montar_dados_relatorio_cliente(usuario, cliente_id, request)
        except Cliente.DoesNotExist:
            return Response({"detail": "Cliente não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        return Response(dados)


class RelatorioProcessoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, processo_id):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            dados = _montar_dados_relatorio_processo(usuario, processo_id, request)
        except Processo.DoesNotExist:
            return Response({"detail": "Processo não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        return Response(dados)


class RelatorioClienteEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, cliente_id):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)

        destinatario = (request.data.get("destinatario") or "").strip()
        try:
            validar_email_real(destinatario)
        except DjangoValidationError as exc:
            return Response({"destinatario": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            dados = _montar_dados_relatorio_cliente(usuario, cliente_id, request)
        except Cliente.DoesNotExist:
            return Response({"detail": "Cliente não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        assunto, corpo_html, corpo_texto = montar_email_relatorio_cliente(dados)
        try:
            enviar_email(destinatario, assunto, corpo_html, corpo_texto)
        except Exception:
            return Response(
                {"detail": "Não foi possível enviar o e-mail. Verifique a configuração de envio."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"detail": f"Relatório enviado para {destinatario}."})


class RelatorioProcessoEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, processo_id):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)

        destinatario = (request.data.get("destinatario") or "").strip()
        try:
            validar_email_real(destinatario)
        except DjangoValidationError as exc:
            return Response({"destinatario": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            dados = _montar_dados_relatorio_processo(usuario, processo_id, request)
        except Processo.DoesNotExist:
            return Response({"detail": "Processo não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        assunto, corpo_html, corpo_texto = montar_email_relatorio_processo(dados)
        try:
            enviar_email(destinatario, assunto, corpo_html, corpo_texto)
        except Exception:
            return Response(
                {"detail": "Não foi possível enviar o e-mail. Verifique a configuração de envio."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"detail": f"Relatório enviado para {destinatario}."})


class ExportarClientesCSVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="clientes.csv"'
        response.write("\ufeff")
        writer = csv.writer(response, delimiter=";")
        writer.writerow(["Nome", "CPF", "E-mail", "Telefone", "Endereço", "Status", "Criado em"])
        for cliente in Cliente.objects.filter(escritorio=usuario.escritorio).order_by("nome"):
            writer.writerow([cliente.nome, cliente.cpf, cliente.email, cliente.telefone, cliente.endereco, "Ativo" if cliente.ativo else "Inativo", cliente.criado_em.strftime("%d/%m/%Y %H:%M")])
        return response


class ExportarProcessosCSVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="processos.csv"'
        response.write("\ufeff")
        writer = csv.writer(response, delimiter=";")
        writer.writerow(["Número", "Título", "Status", "Cliente", "Advogado", "Data início", "Data fim"])
        queryset = Processo.objects.filter(escritorio=usuario.escritorio).select_related("cliente", "advogado__usuario").order_by("numero_processo")
        for processo in queryset:
            writer.writerow([processo.numero_processo, processo.titulo, processo.get_status_display(), processo.cliente.nome, processo.advogado.usuario.nome, processo.data_inicio or "", processo.data_fim or ""])
        return response
