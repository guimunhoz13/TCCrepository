"""Configurações da conta, segurança, preferências e escritório."""


from django.contrib.auth.hashers import check_password, make_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from ..dois_fatores import (
    conferir_codigo,
    novo_segredo,
    qr_code_svg,
    uri_de_cadastro,
)
from ..mixins import (
    get_usuario_from_request,
    registrar_auditoria,
)
from ..models import (
    ConfiguracaoEscritorio,
    PreferenciasUsuario,
    Usuario,
)
from ..serializers import (
    ConfiguracaoEscritorioSerializer,
    EscritorioSerializer,
    PreferenciasUsuarioSerializer,
    UsuarioResumoSerializer,
    UsuarioSerializer,
)
from ..validators import validar_email_real, validar_senha_forte, validar_telefone

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
            "membros": UsuarioResumoSerializer(membros, many=True, context=contexto).data,
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
        usuario.session_version += 1
        usuario.save(update_fields=["senha", "session_version"])

        # A troca de senha invalida todo token emitido antes dela — inclusive
        # o desta própria requisição, já autenticada com o token antigo. Sem
        # devolver um par novo aqui, a página que acabou de trocar a senha
        # cairia deslogada na primeira ação seguinte.
        refresh = RefreshToken()
        refresh["user_id"] = usuario.id
        refresh["nome"] = usuario.nome
        refresh["email"] = usuario.email
        refresh["tipo_usuario"] = usuario.tipo_usuario
        refresh["escritorio_id"] = usuario.escritorio_id
        refresh["escritorio_nome"] = usuario.escritorio.nome
        refresh["session_version"] = usuario.session_version

        return Response({
            "detail": "Senha alterada com sucesso.",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


class ConfiguracoesDoisFatoresView(APIView):
    """Liga e desliga a verificação em duas etapas da própria conta.

    POST {"acao": "iniciar"} — gera o segredo e devolve o QR code.
    POST {"acao": "ativar", "codigo"} — confirma com um código do app.
    POST {"acao": "desativar", "senha", "codigo"} — exige os dois.
    """

    permission_classes = [IsAuthenticated]
    throttle_scope = "sensivel"

    def post(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)

        acao = request.data.get("acao")

        if acao == "iniciar":
            if usuario.totp_ativo:
                return Response(
                    {"detail": "A verificação em duas etapas já está ativa."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            usuario.totp_segredo = novo_segredo()
            usuario.totp_ultimo_passo = None
            usuario.save(update_fields=["totp_segredo", "totp_ultimo_passo"])
            uri = uri_de_cadastro(usuario, usuario.totp_segredo)
            return Response({"segredo": usuario.totp_segredo, "uri": uri, "qr_code": qr_code_svg(uri)})

        if acao == "ativar":
            if usuario.totp_ativo:
                return Response({"detail": "Já está ativa."}, status=status.HTTP_400_BAD_REQUEST)
            if not conferir_codigo(usuario, request.data.get("codigo")):
                return Response(
                    {"codigo": ["Código inválido. Confira se o relógio do celular está certo."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            usuario.totp_ativo = True
            usuario.save(update_fields=["totp_ativo"])
            registrar_auditoria(
                request, "edicao", usuario,
                descricao="Verificação em duas etapas ativada.",
                escritorio=usuario.escritorio,
            )
            return Response({"totp_ativo": True})

        if acao == "desativar":
            if not usuario.totp_ativo:
                return Response({"detail": "Não está ativa."}, status=status.HTTP_400_BAD_REQUEST)
            if not check_password(request.data.get("senha", ""), usuario.senha):
                return Response({"senha": ["Senha incorreta."]}, status=status.HTTP_400_BAD_REQUEST)
            if not conferir_codigo(usuario, request.data.get("codigo")):
                return Response({"codigo": ["Código inválido."]}, status=status.HTTP_400_BAD_REQUEST)
            usuario.totp_ativo = False
            usuario.totp_segredo = ""
            usuario.totp_ultimo_passo = None
            usuario.save(update_fields=["totp_ativo", "totp_segredo", "totp_ultimo_passo"])
            registrar_auditoria(
                request, "edicao", usuario,
                descricao="Verificação em duas etapas desativada.",
                escritorio=usuario.escritorio,
            )
            return Response({"totp_ativo": False})

        return Response(
            {"acao": ["Use 'iniciar', 'ativar' ou 'desativar'."]},
            status=status.HTTP_400_BAD_REQUEST,
        )


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
        config_data = {
            k: request.data[k]
            for k in [
                "timezone", "formato_data", "retencao_documentos",
                "tipo_chave_pix", "chave_pix", "nome_recebedor_pix", "cidade_pix",
            ]
            if k in request.data
        }
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
