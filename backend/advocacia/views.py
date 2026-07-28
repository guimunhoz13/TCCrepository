from rest_framework import viewsets

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


class UsuarioViewSet(viewsets.ModelViewSet):

    queryset = (
        Usuario.objects
        .all()
        .order_by('-criado_em')
    )

    serializer_class = UsuarioSerializer


class ClienteViewSet(viewsets.ModelViewSet):

    queryset = (
        Cliente.objects
        .all()
        .order_by('-criado_em')
    )

    serializer_class = ClienteSerializer


class AdvogadoViewSet(viewsets.ModelViewSet):

    queryset = (
        Advogado.objects
        .select_related('usuario')
        .all()
        .order_by('-id')
    )

    serializer_class = AdvogadoSerializer


class ProcessoViewSet(viewsets.ModelViewSet):

    queryset = (
        Processo.objects
        .select_related(
            'cliente',
            'advogado__usuario',
        )
        .all()
        .order_by('-criado_em')
    )

    serializer_class = ProcessoSerializer


class MovimentacaoViewSet(viewsets.ModelViewSet):

    queryset = (
        Movimentacao.objects
        .select_related('processo')
        .all()
        .order_by('-data_movimentacao')
    )

    serializer_class = MovimentacaoSerializer


class DocumentoViewSet(viewsets.ModelViewSet):

    queryset = (
        Documento.objects
        .select_related('processo')
        .all()
        .order_by('-enviado_em')
    )

    serializer_class = DocumentoSerializer


class AgendaViewSet(viewsets.ModelViewSet):

    queryset = (
        Agenda.objects
        .select_related(
            'processo__cliente',
            'processo__advogado__usuario',
        )
        .all()
        .order_by('data_evento')
    )

    serializer_class = AgendaSerializer