"""Relatórios de cliente/processo e exportação CSV."""

import csv
from decimal import Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..emails import (
    enviar_email,
    montar_email_relatorio_cliente,
    montar_email_relatorio_processo,
)
from ..mixins import (
    get_usuario_from_request,
)
from ..models import (
    Agenda,
    ApontamentoHora,
    Cliente,
    Contrato,
    Despesa,
    Documento,
    Movimentacao,
    Processo,
)
from ..permissoes import VER, PermissaoPorPerfil
from ..serializers import (
    AgendaSerializer,
    ApontamentoHoraSerializer,
    ClienteSerializer,
    ContratoSerializer,
    DespesaSerializer,
    DocumentoSerializer,
    EscritorioSerializer,
    MovimentacaoSerializer,
    ProcessoSerializer,
)
from ..sigilo import esconder_sigilosos, processos_ocultos
from ..validators import validar_email_real


def _resumo_financeiro(contratos, apontamentos, despesas):
    """Consolida o quadro financeiro de um cliente ou processo.

    O tempo é somado em minutos e só vira valor quando a hora é faturável e
    tem valor/hora informado — hora de cortesia entra no total trabalhado
    mas não no que há a cobrar.
    """

    zero = Decimal("0.00")

    minutos_total = sum(a.minutos for a in apontamentos)
    minutos_faturaveis = sum(a.minutos for a in apontamentos if a.faturavel)
    valor_horas = sum((a.valor or zero) for a in apontamentos)

    total_despesas = sum(d.valor for d in despesas)
    despesas_a_reembolsar = sum(
        d.valor for d in despesas if d.reembolsavel and not d.reembolsada
    )

    valor_contratado = sum(c.valor_total for c in contratos)
    parcelas = [parcela for contrato in contratos for parcela in contrato.parcelas.all()]
    valor_pago = sum(p.valor for p in parcelas if p.status == "pago")

    return {
        "minutos_trabalhados": minutos_total,
        "minutos_faturaveis": minutos_faturaveis,
        "valor_horas_faturaveis": valor_horas or zero,
        "total_despesas": total_despesas or zero,
        "despesas_a_reembolsar": despesas_a_reembolsar or zero,
        "valor_contratado": valor_contratado or zero,
        "valor_pago": valor_pago or zero,
        "valor_pendente": (valor_contratado or zero) - (valor_pago or zero),
    }


def _montar_dados_relatorio_cliente(usuario, cliente_id, request=None):
    """Monta o payload de relatório de um cliente. Levanta Cliente.DoesNotExist
    quando o cliente não existe ou não pertence ao escritório do usuário."""

    cliente = Cliente.objects.get(id=cliente_id, escritorio=usuario.escritorio)
    ocultos = processos_ocultos(usuario).values("pk")

    processos = (
        Processo.objects
        .filter(cliente=cliente)
        .exclude(pk__in=ocultos)
        .select_related("advogado__usuario")
        .order_by("-criado_em")
    )
    documentos = (
        Documento.objects
        .filter(processo__cliente=cliente)
        .exclude(processo__in=ocultos)
        .select_related("processo")
        .order_by("-enviado_em")
    )
    agenda = (
        Agenda.objects
        .filter(processo__cliente=cliente)
        .exclude(processo__in=ocultos)
        .select_related("processo")
        .order_by("data_evento")
    )

    contratos = list(
        Contrato.objects
        .filter(processo__cliente=cliente)
        .exclude(processo__in=ocultos)
        .select_related("processo")
        .prefetch_related("parcelas")
        .order_by("-criado_em")
    )
    apontamentos = list(
        ApontamentoHora.objects
        .filter(processo__cliente=cliente)
        .exclude(processo__in=ocultos)
        .select_related("processo", "usuario")
        .order_by("-data")
    )
    despesas = list(
        Despesa.objects
        .filter(processo__cliente=cliente)
        .exclude(processo__in=ocultos)
        .select_related("processo")
        .order_by("-data")
    )

    contexto = {"request": request} if request else {}

    return {
        "gerado_em": timezone.now(),
        "escritorio": EscritorioSerializer(usuario.escritorio).data,
        "cliente": ClienteSerializer(cliente, context=contexto).data,
        "processos": ProcessoSerializer(processos, many=True, context=contexto).data,
        "documentos": DocumentoSerializer(documentos, many=True, context=contexto).data,
        "agenda": AgendaSerializer(agenda, many=True, context=contexto).data,
        "contratos": ContratoSerializer(contratos, many=True, context=contexto).data,
        "apontamentos": ApontamentoHoraSerializer(apontamentos, many=True, context=contexto).data,
        "despesas": DespesaSerializer(despesas, many=True, context=contexto).data,
        "resumo": {
            "total_processos": processos.count(),
            "total_documentos": documentos.count(),
            "total_eventos": agenda.count(),
            "processos_por_status": list(
                processos.values("status").annotate(total=Count("id")).order_by("status")
            ),
            **_resumo_financeiro(contratos, apontamentos, despesas),
        },
    }


def _montar_dados_relatorio_processo(usuario, processo_id, request=None):
    """Monta o payload de relatório de um processo. Levanta Processo.DoesNotExist
    quando o processo não existe ou não pertence ao escritório do usuário."""

    processo = (
        esconder_sigilosos(Processo.objects, usuario)
        .select_related("cliente", "advogado__usuario")
        .get(id=processo_id, escritorio=usuario.escritorio)
    )

    documentos = Documento.objects.filter(processo=processo).order_by("-enviado_em")
    movimentacoes = Movimentacao.objects.filter(processo=processo).order_by("-data_movimentacao")
    agenda = Agenda.objects.filter(processo=processo).order_by("data_evento")

    contratos = list(
        Contrato.objects
        .filter(processo=processo)
        .select_related("processo")
        .prefetch_related("parcelas")
    )
    apontamentos = list(
        ApontamentoHora.objects
        .filter(processo=processo)
        .select_related("processo", "usuario")
        .order_by("-data")
    )
    despesas = list(
        Despesa.objects.filter(processo=processo).select_related("processo").order_by("-data")
    )

    contexto = {"request": request} if request else {}

    return {
        "gerado_em": timezone.now(),
        "escritorio": EscritorioSerializer(usuario.escritorio).data,
        "processo": ProcessoSerializer(processo, context=contexto).data,
        "cliente": ClienteSerializer(processo.cliente, context=contexto).data,
        "documentos": DocumentoSerializer(documentos, many=True, context=contexto).data,
        "movimentacoes": MovimentacaoSerializer(movimentacoes, many=True, context=contexto).data,
        "agenda": AgendaSerializer(agenda, many=True, context=contexto).data,
        "contratos": ContratoSerializer(contratos, many=True, context=contexto).data,
        "apontamentos": ApontamentoHoraSerializer(apontamentos, many=True, context=contexto).data,
        "despesas": DespesaSerializer(despesas, many=True, context=contexto).data,
        "resumo": _resumo_financeiro(contratos, apontamentos, despesas),
    }


class RelatorioClienteView(APIView):
    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "relatorios"
    acoes_permissao = {None: VER}

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
    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "relatorios"
    acoes_permissao = {None: VER}

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
    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "relatorios"
    acoes_permissao = {None: VER}
    throttle_scope = "sensivel"

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
    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "relatorios"
    acoes_permissao = {None: VER}
    throttle_scope = "sensivel"

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


# Um valor de célula que começa com um desses caracteres é lido como
# fórmula por Excel, Sheets e LibreOffice ao abrir o CSV — um nome ou
# endereço de cliente digitado como "=CMD|'/c calc'!A1" executaria ao
# abrir a planilha. Prefixar com aspas simples faz o texto aparecer como
# está, sem virar fórmula.
_CARACTERES_FORMULA_CSV = ("=", "+", "-", "@", "\t", "\r")


def _celula_csv_segura(valor):
    texto = "" if valor is None else str(valor)
    if texto.startswith(_CARACTERES_FORMULA_CSV):
        return "'" + texto
    return texto


def _linha_csv_segura(valores):
    return [_celula_csv_segura(valor) for valor in valores]


class ExportarClientesCSVView(APIView):
    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "exportar"
    acoes_permissao = {None: VER}

    def get(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="clientes.csv"'
        response.write("\ufeff")
        writer = csv.writer(response, delimiter=";")
        writer.writerow(["Nome", "Tipo", "CPF", "CNPJ", "E-mail", "Telefone", "Endereço", "Status", "Criado em"])
        for cliente in Cliente.objects.filter(escritorio=usuario.escritorio).order_by("nome"):
            writer.writerow(_linha_csv_segura([
                cliente.nome,
                cliente.get_tipo_pessoa_display(),
                cliente.cpf, cliente.cnpj, cliente.email, cliente.telefone, cliente.endereco,
                "Ativo" if cliente.ativo else "Inativo", cliente.criado_em.strftime("%d/%m/%Y %H:%M"),
            ]))
        return response


class ExportarProcessosCSVView(APIView):
    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "exportar"
    acoes_permissao = {None: VER}

    def get(self, request):
        usuario = get_usuario_from_request(request)
        if not usuario:
            return Response({"detail": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="processos.csv"'
        response.write("\ufeff")
        writer = csv.writer(response, delimiter=";")
        writer.writerow(["Número", "Título", "Status", "Cliente", "Advogado", "Data início", "Data fim"])
        queryset = (
            esconder_sigilosos(Processo.objects.filter(escritorio=usuario.escritorio), usuario)
            .select_related("cliente", "advogado__usuario")
            .order_by("numero_processo")
        )
        for processo in queryset:
            writer.writerow(_linha_csv_segura([
                processo.numero_processo, processo.titulo, processo.get_status_display(),
                processo.cliente.nome, processo.advogado.usuario.nome,
                processo.data_inicio or "", processo.data_fim or "",
            ]))
        return response
