"""Fotos privadas servidas apenas aos membros do escritório dono."""

import mimetypes

from django.http import FileResponse, Http404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from ..mixins import get_usuario_from_request
from ..models import Cliente, Usuario
from ..permissoes import VER, pode


class FotoProtegidaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, arquivo):
        usuario = get_usuario_from_request(request)
        if not usuario:
            raise Http404

        if arquivo.startswith("usuarios/fotos/"):
            dono = Usuario.objects.filter(escritorio=usuario.escritorio, foto=arquivo).first()
        elif arquivo.startswith("clientes/fotos/") and pode(usuario, "clientes", VER):
            dono = Cliente.objects.filter(escritorio=usuario.escritorio, foto=arquivo).first()
        else:
            dono = None

        if dono is None or not dono.foto:
            raise Http404

        tipo, _ = mimetypes.guess_type(dono.foto.name)
        if tipo not in {"image/jpeg", "image/png", "image/webp"}:
            raise Http404
        try:
            resposta = FileResponse(dono.foto.open("rb"), content_type=tipo)
        except (FileNotFoundError, OSError):
            raise Http404
        resposta["Cache-Control"] = "private, no-store"
        resposta["X-Content-Type-Options"] = "nosniff"
        return resposta
