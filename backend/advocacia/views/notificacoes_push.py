"""Inscrição e teste das notificações push."""


from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..mixins import (
    get_usuario_from_request,
)
from ..models import (
    InscricaoPush,
)
from ..push import endpoint_push_permitido, notificar_usuario, push_ativo


def _usuario_push(request):
    usuario = get_usuario_from_request(request)
    if usuario is None:
        raise PermissionDenied("Entre com uma conta de membro do escritório.")
    return usuario

# =========================================================
# NOTIFICAÇÕES PUSH
# =========================================================

class PushView(APIView):
    """Situação do push para quem está logado: se o servidor tem chaves,
    a chave pública para o navegador se inscrever e quantos aparelhos
    a pessoa já inscreveu."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = _usuario_push(request)
        return Response({
            "ativo": push_ativo(),
            "chave_publica": settings.VAPID_PUBLIC_KEY if push_ativo() else "",
            "aparelhos": usuario.inscricoes_push.count() if usuario else 0,
        })


class PushInscreverView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        usuario = _usuario_push(request)
        if not push_ativo():
            return Response(
                {"detail": "As notificações push não estão configuradas neste servidor."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        endpoint = request.data.get("endpoint")
        chaves = request.data.get("keys") or {}
        if (not endpoint_push_permitido(endpoint) or not isinstance(chaves, dict)
                or not all(isinstance(chaves.get(c), str) and 0 < len(chaves[c]) <= 255
                           for c in ("p256dh", "auth"))):
            return Response({"detail": "Inscrição inválida."}, status=status.HTTP_400_BAD_REQUEST)

        # O mesmo aparelho pode trocar de dono (outra pessoa entra no
        # mesmo navegador): a inscrição passa a ser de quem está logado.
        InscricaoPush.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                "usuario": usuario,
                "p256dh": str(chaves["p256dh"])[:255],
                "auth": str(chaves["auth"])[:255],
                "navegador": request.META.get("HTTP_USER_AGENT", "")[:255],
            },
        )
        return Response({"aparelhos": usuario.inscricoes_push.count()}, status=status.HTTP_201_CREATED)


class PushCancelarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        usuario = _usuario_push(request)
        InscricaoPush.objects.filter(usuario=usuario, endpoint=request.data.get("endpoint", "")).delete()
        return Response({"aparelhos": usuario.inscricoes_push.count()})


class PushTestarView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "sensivel"

    def post(self, request):
        usuario = _usuario_push(request)
        enviados = notificar_usuario(
            usuario, "LexNexo", "Notificações funcionando neste aparelho.", tag="teste"
        )
        if not enviados:
            return Response(
                {"detail": "Nenhum aparelho recebeu. Ative as notificações neste aparelho primeiro."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"detail": f"Notificação enviada para {enviados} aparelho(s)."})
