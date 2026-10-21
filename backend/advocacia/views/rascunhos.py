from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from ..mixins import get_usuario_from_request
from ..models import RascunhoFormulario
from ..serializers import RascunhoFormularioSerializer


class RascunhoFormularioViewSet(viewsets.ModelViewSet):
    """Rascunhos privados do usuário autenticado.

    A chave é usada como identificador legível (por exemplo,
    ``novo-cliente``). Toda consulta é filtrada pelo usuário antes de o
    objeto ser resolvido, impedindo acesso cruzado por tentativa de URL.
    """

    serializer_class = RascunhoFormularioSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "chave"
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        usuario = get_usuario_from_request(self.request)
        if usuario is None:
            return RascunhoFormulario.objects.none()
        queryset = RascunhoFormulario.objects.filter(
            escritorio=usuario.escritorio, usuario=usuario
        )
        chave = self.request.query_params.get("chave")
        return queryset.filter(chave=chave) if chave else queryset

    def create(self, request, *args, **kwargs):
        usuario = get_usuario_from_request(request)
        if usuario is None:
            raise PermissionDenied("Conta de escritório necessária.")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        objeto, criado = RascunhoFormulario.objects.update_or_create(
            escritorio=usuario.escritorio,
            usuario=usuario,
            chave=serializer.validated_data["chave"],
            defaults={"dados": serializer.validated_data["dados"]},
        )
        resposta = self.get_serializer(objeto)
        return Response(
            resposta.data,
            status=status.HTTP_201_CREATED if criado else status.HTTP_200_OK,
        )
