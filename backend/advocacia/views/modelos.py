"""Modelos de documento com variáveis."""


from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..mixins import (
    EscritorioScopedMixin,
)
from ..modelos_documento import VARIAVEIS_DISPONIVEIS, montar_contexto, preencher
from ..models import (
    Cliente,
    ModeloDocumento,
    Processo,
)
from ..permissoes import VER, PermissaoPorPerfil
from ..serializers import (
    ModeloDocumentoSerializer,
)
from ..sigilo import esconder_sigilosos

# =========================================================
# MODELOS DE DOCUMENTO (automação)
# =========================================================

class ModeloDocumentoViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = ModeloDocumento.objects.all()

    serializer_class = ModeloDocumentoSerializer

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "modelos"
    acoes_permissao = {'variaveis': VER, 'gerar': VER}

    @action(detail=False, methods=["get"], url_path="variaveis")
    def variaveis(self, request):
        """Catálogo do que pode ser usado nos modelos, para a interface listar."""
        return Response(
            [{"chave": chave, "descricao": descricao}
             for chave, descricao in VARIAVEIS_DISPONIVEIS.items()]
        )

    @action(detail=True, methods=["post"], url_path="gerar")
    def gerar(self, request, pk=None):
        modelo = self.get_object()
        escritorio = self.get_escritorio()

        processo_id = request.data.get("processo")
        cliente_id = request.data.get("cliente")

        if not processo_id and not cliente_id:
            return Response(
                {"detail": "Informe um processo ou um cliente para preencher o modelo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        processo = None
        cliente = None

        # O escritório entra no filtro para que um id de outro escritório
        # não seja usado para preencher — e vazar — dados alheios.
        if processo_id:
            processo = (
                esconder_sigilosos(
                    Processo.objects.filter(pk=processo_id, escritorio=escritorio),
                    self.get_usuario(),
                )
                .select_related("cliente", "advogado__usuario")
                .first()
            )
            if not processo:
                return Response(
                    {"detail": "Processo não encontrado."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        if cliente_id:
            cliente = Cliente.objects.filter(pk=cliente_id, escritorio=escritorio).first()
            if not cliente:
                return Response(
                    {"detail": "Cliente não encontrado."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        contexto = montar_contexto(escritorio, cliente=cliente, processo=processo)
        conteudo, nao_encontradas, vazias = preencher(modelo.conteudo, contexto)

        return Response({
            "modelo": modelo.id,
            "nome": modelo.nome,
            "conteudo": conteudo,
            "variaveis_desconhecidas": nao_encontradas,
            "variaveis_vazias": vazias,
        })
