"""Escritório, usuários, perfis de acesso e advogados."""


from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..mixins import (
    EscritorioScopedMixin,
    get_usuario_from_request,
    registrar_auditoria,
)
from ..models import (
    Advogado,
    Escritorio,
    Usuario,
)
from ..permissoes import PERFIS, PermissaoPorPerfil
from ..planos import USUARIOS, verificar_limite
from ..serializers import (
    AdvogadoRegistroSerializer,
    AdvogadoSerializer,
    EscritorioSerializer,
    MembroRegistroSerializer,
    UsuarioSerializer,
)
from .comum import _resposta_download_arquivo

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
    """Usuários do escritório.

    Todo mundo autenticado lê a lista — ela alimenta o seletor de
    responsável por uma tarefa. Escrever é outra história: só o
    administrador altera outro usuário, e ninguém altera o próprio perfil
    de acesso. A restrição da tela de advogados não bastava, porque esta
    rota continuava aberta por baixo dela.
    """

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

    def _exigir_admin(self):
        usuario = self.get_usuario()
        if not usuario or usuario.tipo_usuario != "admin":
            raise PermissionDenied(
                "Apenas o administrador do escritório pode gerenciar usuários."
            )
        return usuario

    def create(self, request, *args, **kwargs):
        # O cadastro de advogado tem fluxo próprio (AdvogadoRegistroView),
        # que define a senha e cria o registro profissional. Criar usuário
        # solto por aqui geraria conta sem senha utilizável.
        raise PermissionDenied(
            "Use o cadastro de advogado para incluir um novo usuário no escritório."
        )

    def perform_update(self, serializer):
        usuario = self.get_usuario()
        alvo = serializer.instance

        # Editar os próprios dados de contato é livre; mexer em outra
        # pessoa exige ser administrador.
        if alvo.pk != usuario.pk:
            self._exigir_admin()

        super().perform_update(serializer)

    @action(detail=True, methods=["get"], url_path="documento-identidade")
    def documento_identidade_download(self, request, pk=None):
        usuario = self.get_usuario()
        alvo = self.get_object()

        # Mesma regra do perform_update: os próprios dados são livres,
        # os de outra pessoa exigem administrador.
        if alvo.pk != usuario.pk:
            self._exigir_admin()

        return _resposta_download_arquivo(alvo.documento_identidade)

    def perform_destroy(self, instance):
        admin = self._exigir_admin()

        if instance.pk == admin.pk:
            raise ValidationError(
                {"detail": "Você não pode excluir a própria conta."}
            )

        super().perform_destroy(instance)

    @action(detail=True, methods=["post"], url_path="alternar-ativo")
    def alternar_ativo(self, request, pk=None):
        """Ativa ou desativa um usuário do escritório.

        Fica fora do serializer de propósito: 'ativo' escrito junto com os
        demais campos permitia que qualquer pessoa reativasse a própria
        conta em um PATCH comum.
        """

        admin = self._exigir_admin()
        alvo = self.get_object()

        if alvo.pk == admin.pk:
            return Response(
                {"detail": "Você não pode desativar a própria conta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not alvo.ativo:
            verificar_limite(admin.escritorio, USUARIOS)
        alvo.ativo = not alvo.ativo
        alvo.save(update_fields=["ativo"])
        registrar_auditoria(
            request,
            "edicao",
            alvo,
            descricao=f"Usuário {'ativado' if alvo.ativo else 'desativado'}.",
            escritorio=admin.escritorio,
        )
        return Response(UsuarioSerializer(alvo).data)

    @action(detail=True, methods=["post"], url_path="redefinir-2fa")
    def redefinir_2fa(self, request, pk=None):
        """O administrador desliga a verificação em duas etapas de um membro
        que perdeu o celular; ele volta a entrar só com a senha e pode
        configurar de novo."""
        admin = self._exigir_admin()
        alvo = self.get_object()
        alvo.totp_ativo = False
        alvo.totp_segredo = ""
        alvo.totp_ultimo_passo = None
        alvo.save(update_fields=["totp_ativo", "totp_segredo", "totp_ultimo_passo"])
        registrar_auditoria(
            request, "edicao", alvo,
            descricao="Verificação em duas etapas redefinida pelo administrador.",
            escritorio=admin.escritorio,
        )
        return Response(UsuarioSerializer(alvo).data)

    @action(detail=True, methods=["post"], url_path="definir-perfil")
    def definir_perfil(self, request, pk=None):
        """Troca o perfil de acesso de outra pessoa.

        Nunca do próprio solicitante: era exatamente assim que um advogado
        se promovia a administrador. O escritório também não pode ficar
        sem nenhum administrador ativo.
        """

        admin = self._exigir_admin()
        alvo = self.get_object()

        if alvo.pk == admin.pk:
            return Response(
                {"detail": "Você não pode alterar o próprio perfil de acesso."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        novo_perfil = request.data.get("tipo_usuario")
        perfis_validos = [codigo for codigo, _ in PERFIS]
        if novo_perfil not in perfis_validos:
            return Response(
                {"tipo_usuario": [f"Informe um destes perfis: {', '.join(perfis_validos)}."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if alvo.tipo_usuario == "admin" and novo_perfil != "admin":
            outros_admins = (
                Usuario.objects
                .filter(escritorio=admin.escritorio, tipo_usuario="admin", ativo=True)
                .exclude(pk=alvo.pk)
                .exists()
            )
            if not outros_admins:
                return Response(
                    {"detail": "O escritório precisa de ao menos um administrador ativo."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        alvo.tipo_usuario = novo_perfil
        alvo.save(update_fields=["tipo_usuario"])
        registrar_auditoria(
            request,
            "edicao",
            alvo,
            descricao=f"Perfil de acesso alterado para {novo_perfil}.",
            escritorio=admin.escritorio,
        )
        return Response(UsuarioSerializer(alvo).data)


class MembroRegistroView(APIView):
    """Inclui no escritório alguém que não é advogado (estagiário,
    financeiro, secretária) ou outro administrador. Só o administrador."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        admin = get_usuario_from_request(request)
        if not admin or admin.tipo_usuario != "admin":
            return Response(
                {"detail": "Somente administradores podem cadastrar membros da equipe."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = MembroRegistroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verificar_limite(admin.escritorio, USUARIOS)
        membro = serializer.create(serializer.validated_data, admin.escritorio)
        registrar_auditoria(
            request,
            "criacao",
            membro,
            descricao=f"Membro {membro.nome} incluído como {membro.get_tipo_usuario_display()}.",
            escritorio=admin.escritorio,
        )
        return Response(UsuarioSerializer(membro).data, status=status.HTTP_201_CREATED)


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

        verificar_limite(usuario_logado.escritorio, USUARIOS)

        advogado = serializer.create(
            serializer.validated_data,
            usuario_logado.escritorio,
        )

        return Response(
            AdvogadoSerializer(advogado, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
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

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "advogados"

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
