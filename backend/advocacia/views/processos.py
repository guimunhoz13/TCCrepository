"""Processos (ficha, DataJud, resumo para o cliente), movimentações e documentos."""


from django.db.models import Prefetch, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..datajud import ErroDataJud, consultar_processo, importar_movimentacoes
from ..mixins import (
    EscritorioScopedMixin,
    get_usuario_from_request,
    registrar_auditoria,
)
from ..models import (
    Agenda,
    ApontamentoHora,
    Contrato,
    Despesa,
    Documento,
    Movimentacao,
    Processo,
    Tarefa,
    ordenacao_de_trabalho,
)
from ..notificacoes import notificar_escritorio
from ..permissoes import EDITAR, VER, PermissaoPorPerfil, pode
from ..planos import IA, PROCESSOS_ATIVOS, STATUS_INATIVOS, tem_recurso, verificar_limite
from ..resumo_cliente import gerar_resumo_para_cliente
from ..serializers import (
    AgendaSerializer,
    ApontamentoHoraSerializer,
    ContratoSerializer,
    DespesaSerializer,
    DocumentoSerializer,
    MovimentacaoSerializer,
    ProcessoSerializer,
    TarefaSerializer,
)
from .comum import _data_do_filtro, _id_do_filtro, _resposta_download_arquivo
from .relatorios import _resumo_financeiro

# =========================================================
# PROCESSOS
# =========================================================

class ProcessoViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Processo.objects.all()

    serializer_class = ProcessoSerializer

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "processos"
    acoes_permissao = {'ficha': VER, 'consultar_datajud': EDITAR, 'resumo_cliente': VER}

    def get_throttles(self):
        # O resumo pode chamar a IA, que é paga: mesmo limite do assistente.
        if self.action == "resumo_cliente":
            self.throttle_scope = "ia"
        return super().get_throttles()

    @action(detail=True, methods=["post"], url_path="resumo-cliente")
    def resumo_cliente(self, request, pk=None):
        """Mensagem em linguagem simples sobre o andamento, para o cliente.

        Usa a IA quando o plano e o perfil têm acesso a ela e o servidor
        está configurado; senão, o modelo automático. O advogado revisa e
        envia.
        """
        processo = self.get_object()
        usuario = get_usuario_from_request(request)
        usar_ia = pode(usuario, "ia") and tem_recurso(processo.escritorio, IA)
        resultado = gerar_resumo_para_cliente(processo, usuario, usar_ia=usar_ia)
        resultado["cliente_telefone"] = processo.cliente.telefone
        resultado["cliente_nome"] = processo.cliente.nome
        return Response(resultado)

    def get_queryset(self):

        queryset = (
            super()
            .get_queryset()
            .select_related(
                "cliente",
                "advogado__usuario",
            )
            # O prazo mais próximo de cada processo, pré-carregado numa
            # única consulta para toda a página: é o que permite à listagem
            # sinalizar urgência sem uma consulta por linha.
            .prefetch_related(
                Prefetch(
                    "eventos_agenda",
                    queryset=Agenda.objects
                    .filter(tipo="prazo", cumprido=False)
                    .order_by("data_evento", "pk"),
                    to_attr="prazos_pendentes_ordenados",
                )
            )
            .order_by("-criado_em")
        )

        params = self.request.query_params

        busca = params.get("busca")
        if busca:
            queryset = queryset.filter(
                Q(numero_processo__icontains=busca)
                | Q(titulo__icontains=busca)
                | Q(cliente__nome__icontains=busca)
            )

        status_filtro = params.get("status")
        if status_filtro:
            queryset = queryset.filter(status=status_filtro)

        cliente_id = _id_do_filtro(params, "cliente")
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)

        advogado_id = _id_do_filtro(params, "advogado")
        if advogado_id:
            queryset = queryset.filter(advogado_id=advogado_id)

        data_inicio_de = _data_do_filtro(params, "data_inicio_de")
        if data_inicio_de:
            queryset = queryset.filter(data_inicio__gte=data_inicio_de)

        data_inicio_ate = _data_do_filtro(params, "data_inicio_ate")
        if data_inicio_ate:
            queryset = queryset.filter(data_inicio__lte=data_inicio_ate)

        return queryset

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
        if serializer.validated_data.get("status", "Em andamento") not in STATUS_INATIVOS:
            verificar_limite(self.get_escritorio(), PROCESSOS_ATIVOS)
        super().perform_create(serializer)

        processo = serializer.instance
        notificar_escritorio(
            processo.escritorio,
            "notificacao_novo_processo",
            "Novo processo cadastrado",
            "Um novo processo foi cadastrado no escritório.",
            [
                ("Número", processo.numero_processo),
                ("Título", processo.titulo),
                ("Cliente", processo.cliente.nome if processo.cliente_id else "—"),
            ],
            autor=self.get_usuario(),
        )

    @action(detail=True, methods=["get"], url_path="ficha")
    def ficha(self, request, pk=None):
        """Tudo o que o sistema sabe sobre um processo, numa resposta só.

        Antes desta rota, a informação de um caso estava repartida em sete
        painéis — movimentações num, documentos em outro, tarefas, agenda,
        contrato, horas e despesas cada um no seu. Responder "como está o
        processo da Maria?" exigia abrir tudo e juntar na cabeça.

        Uma requisição em vez de sete também evita que a tela precise
        orquestrar chamadas paralelas e lidar com o caso de uma delas
        falhar sozinha.
        """

        processo = self.get_object()
        contexto = {"request": request}

        movimentacoes = (
            Movimentacao.objects
            .filter(processo=processo)
            .select_related("criado_por")
            .order_by("-data_movimentacao")
        )
        documentos = Documento.objects.filter(processo=processo).order_by("-enviado_em")
        agenda = Agenda.objects.filter(processo=processo).order_by("data_evento")
        tarefas = ordenacao_de_trabalho(
            Tarefa.objects.filter(processo=processo).select_related("responsavel")
        )
        apontamentos = (
            ApontamentoHora.objects
            .filter(processo=processo)
            .select_related("usuario")
            .order_by("-data")
        )
        despesas = Despesa.objects.filter(processo=processo).order_by("-data")
        contrato = (
            Contrato.objects
            .filter(processo=processo)
            .prefetch_related("parcelas")
            .first()
        )

        return Response({
            "processo": ProcessoSerializer(processo, context=contexto).data,
            "movimentacoes": MovimentacaoSerializer(movimentacoes, many=True, context=contexto).data,
            "documentos": DocumentoSerializer(documentos, many=True, context=contexto).data,
            "agenda": AgendaSerializer(agenda, many=True, context=contexto).data,
            "tarefas": TarefaSerializer(tarefas, many=True, context=contexto).data,
            "apontamentos": ApontamentoHoraSerializer(apontamentos, many=True, context=contexto).data,
            "despesas": DespesaSerializer(despesas, many=True, context=contexto).data,
            "contrato": ContratoSerializer(contrato, context=contexto).data if contrato else None,
            "resumo": _resumo_financeiro(
                [contrato] if contrato else [], apontamentos, despesas
            ),
        })

    @action(detail=True, methods=["post"], url_path="consultar-datajud")
    def consultar_datajud(self, request, pk=None):
        """Consulta o processo na API pública do CNJ e importa os andamentos novos."""

        processo = self.get_object()

        try:
            dados = consultar_processo(processo.numero_processo)
        except ErroDataJud as erro:
            return Response({"detail": str(erro)}, status=status.HTTP_400_BAD_REQUEST)

        if dados is None:
            return Response(
                {"detail": "O tribunal não retornou nenhum processo com esse número."},
                status=status.HTTP_404_NOT_FOUND,
            )

        importadas, ignoradas = importar_movimentacoes(processo, dados["movimentos"])

        processo.datajud_sincronizado_em = timezone.now()
        processo.save(update_fields=["datajud_sincronizado_em"])

        registrar_auditoria(
            request,
            "edicao",
            processo,
            descricao=f"Consulta ao DataJud: {importadas} movimentação(ões) importada(s).",
            escritorio=processo.escritorio,
        )

        return Response({
            "capa": {
                "classe": dados["classe"],
                "orgao_julgador": dados["orgao_julgador"],
                "tribunal": dados["tribunal"],
                "grau": dados["grau"],
                "data_ajuizamento": dados["data_ajuizamento"],
                "ultima_atualizacao": dados["ultima_atualizacao"],
            },
            "movimentacoes_importadas": importadas,
            "movimentacoes_ignoradas": ignoradas,
            "sincronizado_em": processo.datajud_sincronizado_em,
        })

    def perform_update(self, serializer):
        self._verificar_numero_processo_duplicado(serializer)
        status_anterior = serializer.instance.status
        status_novo = serializer.validated_data.get("status", status_anterior)
        if status_anterior in STATUS_INATIVOS and status_novo not in STATUS_INATIVOS:
            verificar_limite(self.get_escritorio(), PROCESSOS_ATIVOS)
        super().perform_update(serializer)

        processo = serializer.instance
        if processo.status != status_anterior:
            notificar_escritorio(
                processo.escritorio,
                "notificacao_status_processo",
                "Status de processo alterado",
                "O status de um processo mudou.",
                [
                    ("Processo", processo.numero_processo),
                    ("De", status_anterior),
                    ("Para", processo.status),
                ],
                autor=self.get_usuario(),
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

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "processos"

    def get_queryset(self):

        return (
            super()
            .get_queryset()
            .select_related(
                "processo", "criado_por"
            )
            .order_by(
                "-data_movimentacao"
            )
        )

    def perform_create(self, serializer):
        escritorio = self.get_escritorio()

        if not escritorio:
            raise PermissionDenied("Escritório não identificado.")

        self._salvar(serializer, criado_por=self.get_usuario())
        registrar_auditoria(self.request, "criacao", serializer.instance, escritorio=escritorio)

    def perform_destroy(self, instance):
        # Uma movimentação importada do DataJud é registro oficial do
        # andamento processual — apagá-la deixaria a linha do tempo
        # incompleta sem que o tribunal soubesse. Só o que foi lançado à
        # mão pode ser removido.
        if instance.origem != "manual":
            raise ValidationError(
                "Só é possível excluir movimentações lançadas manualmente."
            )
        super().perform_destroy(instance)


class DocumentoViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Documento.objects.all()

    serializer_class = DocumentoSerializer

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "documentos"
    acoes_permissao = {'download': VER}

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

    def perform_create(self, serializer):
        super().perform_create(serializer)

        documento = serializer.instance
        notificar_escritorio(
            documento.processo.escritorio,
            "notificacao_novo_documento",
            "Novo documento anexado",
            "Um documento foi anexado a um processo.",
            [
                ("Arquivo", documento.nome_arquivo),
                ("Processo", documento.processo.numero_processo),
            ],
            autor=self.get_usuario(),
        )

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        documento = self.get_object()
        return _resposta_download_arquivo(documento.arquivo, documento.nome_arquivo)
