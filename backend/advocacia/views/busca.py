"""Busca global (Ctrl+K), sem diferenciar acento."""

import unicodedata

from django.db.models import CharField, F, Func, Q, Value
from django.db.models.functions import Lower
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..mixins import (
    get_usuario_from_request,
)
from ..models import (
    Agenda,
    ApontamentoHora,
    Cliente,
    Contrato,
    Documento,
    ModeloDocumento,
    Processo,
    Tarefa,
)
from ..permissoes import VER, pode
from ..serializers import (
    AgendaSerializer,
    ApontamentoHoraSerializer,
    ClienteSerializer,
    ContratoSerializer,
    DocumentoSerializer,
    ModeloDocumentoSerializer,
    ProcessoSerializer,
    TarefaSerializer,
)
from ..sigilo import caminho_ate_processo, esconder_sigilosos

_COM_ACENTO = "áàâãäéèêëíìîïóòôõöúùûüçñ"


_SEM_ACENTO = "aaaaaeeeeiiiiooooouuuucn"


def _sem_acento_sql(campo):
    return Func(
        Lower(F(campo)), Value(_COM_ACENTO), Value(_SEM_ACENTO),
        function="translate", output_field=CharField(),
    )


def _sem_acento(texto):
    return "".join(
        c for c in unicodedata.normalize("NFD", texto.lower())
        if unicodedata.category(c) != "Mn"
    )


def _filtrar_sem_acento(queryset, campos, termo):
    anotacoes = {f"_busca_{i}": _sem_acento_sql(campo) for i, campo in enumerate(campos)}
    filtro = Q()
    for nome in anotacoes:
        filtro |= Q(**{f"{nome}__contains": termo})
    return queryset.annotate(**anotacoes).filter(filtro)


class BuscaGlobalView(APIView):
    """Busca do topo do sistema, feita no servidor.

    Antes ela filtrava, no navegador, listas que a dashboard baixava inteiras
    só para isso — e enxergava apenas a primeira página de cada uma. Aqui a
    consulta vai direto ao banco, ignora acentos ("acao" acha "Ação") e
    devolve no máximo alguns itens por área.
    """

    permission_classes = [IsAuthenticated]

    MINIMO_CARACTERES = 2
    POR_GRUPO = 4

    def get(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response(
                {"detail": "Usuário não identificado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        termo = _sem_acento((request.query_params.get("q") or "").strip())
        if len(termo) < self.MINIMO_CARACTERES:
            return Response({})

        escritorio = usuario.escritorio
        contexto = {"request": request}
        grupos = {
            "clientes": (
                Cliente.objects.filter(escritorio=escritorio).order_by("nome"),
                ["nome", "cpf", "cnpj", "email", "telefone"],
                ClienteSerializer,
            ),
            "processos": (
                Processo.objects.filter(escritorio=escritorio)
                .select_related("cliente", "advogado__usuario").order_by("-criado_em"),
                ["numero_processo", "titulo", "cliente__nome"],
                ProcessoSerializer,
            ),
            "tarefas": (
                Tarefa.objects.filter(escritorio=escritorio)
                .select_related("processo", "processo__cliente", "responsavel", "criado_por")
                .order_by("-criado_em"),
                ["titulo", "descricao", "responsavel__nome", "processo__numero_processo"],
                TarefaSerializer,
            ),
            "agenda": (
                Agenda.objects.filter(escritorio=escritorio)
                .select_related("processo__cliente", "processo__advogado__usuario")
                .order_by("-data_evento"),
                ["titulo", "descricao", "local_evento", "processo__numero_processo",
                 "processo__cliente__nome"],
                AgendaSerializer,
            ),
            "documentos": (
                Documento.objects.filter(processo__escritorio=escritorio)
                .select_related("processo").order_by("-enviado_em"),
                ["nome_arquivo", "processo__numero_processo"],
                DocumentoSerializer,
            ),
            "contratos": (
                Contrato.objects.filter(escritorio=escritorio)
                .select_related("processo__cliente").order_by("-criado_em"),
                ["processo__numero_processo", "processo__titulo", "processo__cliente__nome"],
                ContratoSerializer,
            ),
            "apontamentos": (
                ApontamentoHora.objects.filter(escritorio=escritorio)
                .select_related("processo", "usuario"),
                ["descricao", "processo__numero_processo", "usuario__nome"],
                ApontamentoHoraSerializer,
            ),
            "modelos": (
                ModeloDocumento.objects.filter(escritorio=escritorio),
                ["nome", "conteudo"],
                ModeloDocumentoSerializer,
            ),
        }

        # Cada área só entra na busca se o perfil puder vê-la; processos
        # sigilosos (e o que pende deles) ficam de fora para quem não pode.
        area_do_grupo = {
            "clientes": "clientes", "processos": "processos", "tarefas": "tarefas",
            "agenda": "agenda", "documentos": "documentos", "contratos": "financeiro",
            "apontamentos": "horas", "modelos": "modelos",
        }
        resultado = {}
        for chave, (queryset, campos, serializer) in grupos.items():
            if not pode(usuario, area_do_grupo[chave], VER):
                continue
            caminho = caminho_ate_processo(queryset.model)
            if caminho is not None:
                queryset = esconder_sigilosos(queryset, usuario, caminho)
            itens = _filtrar_sem_acento(queryset, campos, termo)[: self.POR_GRUPO]
            resultado[chave] = serializer(itens, many=True, context=contexto).data
        return Response(resultado)
