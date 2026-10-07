"""Clientes e os pedidos do titular pela LGPD."""


from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..mixins import (
    EscritorioScopedMixin,
    registrar_auditoria,
)
from ..models import (
    Cliente,
    Contrato,
    RegistroAuditoria,
)
from ..notificacoes import notificar_escritorio
from ..permissoes import EXCLUIR, VER, PermissaoPorPerfil
from ..serializers import (
    ClienteSerializer,
)
from ..sigilo import esconder_sigilosos
from .comum import _resposta_download_arquivo

# =========================================================
# CLIENTES
# =========================================================

class ClienteViewSet(
    EscritorioScopedMixin,
    viewsets.ModelViewSet
):

    queryset = Cliente.objects.all()

    serializer_class = ClienteSerializer

    permission_classes = [IsAuthenticated, PermissaoPorPerfil]
    area_permissao = "clientes"
    # Pedidos do titular (LGPD) exigem o mesmo nível de quem pode excluir o
    # cliente — administrador e advogado.
    acoes_permissao = {
        'documento_identidade_download': VER,
        'exportar_dados': EXCLUIR,
        'anonimizar': EXCLUIR,
    }

    def get_queryset(self):

        queryset = (
            super()
            .get_queryset()
            .order_by("-criado_em")
        )

        busca = self.request.query_params.get("busca")
        if busca:
            queryset = queryset.filter(
                Q(nome__icontains=busca)
                | Q(cpf__icontains=busca)
                | Q(cnpj__icontains=busca)
                | Q(email__icontains=busca)
            )

        ativo = self.request.query_params.get("ativo")
        if ativo in ("true", "false"):
            queryset = queryset.filter(ativo=(ativo == "true"))

        return queryset

    def _verificar_cpf_duplicado(self, serializer):
        cpf = serializer.validated_data.get("cpf")
        if not cpf:
            return
        escritorio = self.get_escritorio()
        conflito = Cliente.objects.filter(escritorio=escritorio, cpf=cpf)
        if serializer.instance:
            conflito = conflito.exclude(pk=serializer.instance.pk)
        if conflito.exists():
            raise ValidationError({"cpf": ["Já existe um cliente com este CPF neste escritório."]})

    def _verificar_cnpj_duplicado(self, serializer):
        cnpj = serializer.validated_data.get("cnpj")
        if not cnpj:
            return
        escritorio = self.get_escritorio()
        conflito = Cliente.objects.filter(escritorio=escritorio, cnpj=cnpj)
        if serializer.instance:
            conflito = conflito.exclude(pk=serializer.instance.pk)
        if conflito.exists():
            raise ValidationError({"cnpj": ["Já existe um cliente com este CNPJ neste escritório."]})

    def perform_create(self, serializer):
        self._verificar_cpf_duplicado(serializer)
        self._verificar_cnpj_duplicado(serializer)
        super().perform_create(serializer)

        cliente = serializer.instance
        documento = cliente.cnpj if cliente.tipo_pessoa == "juridica" else cliente.cpf
        rotulo_documento = "CNPJ" if cliente.tipo_pessoa == "juridica" else "CPF"
        notificar_escritorio(
            cliente.escritorio,
            "notificacao_novo_cliente",
            "Novo cliente cadastrado",
            "Um novo cliente foi cadastrado no escritório.",
            [("Nome", cliente.nome), (rotulo_documento, documento or "—")],
            autor=self.get_usuario(),
        )

    def perform_update(self, serializer):
        self._verificar_cpf_duplicado(serializer)
        self._verificar_cnpj_duplicado(serializer)
        super().perform_update(serializer)

    @action(detail=True, methods=["get"], url_path="documento-identidade")
    def documento_identidade_download(self, request, pk=None):
        cliente = self.get_object()
        return _resposta_download_arquivo(cliente.documento_identidade)

    @action(detail=True, methods=["get"], url_path="exportar-dados")
    def exportar_dados(self, request, pk=None):
        """Direito de acesso do titular (LGPD, art. 18, II): tudo o que o
        escritório guarda sobre o cliente, num arquivo JSON legível."""
        cliente = self.get_object()
        usuario = self.get_usuario()
        dados = _dados_do_titular(cliente, usuario)
        registrar_auditoria(
            request, "exportacao", cliente,
            descricao="Dados do titular exportados (LGPD).",
            escritorio=usuario.escritorio,
        )
        resposta = JsonResponse(dados, json_dumps_params={"ensure_ascii": False, "indent": 2})
        resposta["Content-Disposition"] = f'attachment; filename="dados-cliente-{cliente.pk}.json"'
        return resposta

    @action(detail=True, methods=["post"], url_path="anonimizar")
    def anonimizar(self, request, pk=None):
        """Eliminação a pedido do titular (LGPD, art. 18, VI): apaga os
        dados pessoais e mantém o vínculo com os processos, que o escritório
        precisa guardar. Também tira o nome dos registros de auditoria."""
        cliente = self.get_object()
        usuario = self.get_usuario()
        if cliente.anonimizado_em:
            return Response(
                {"detail": "Este cliente já foi anonimizado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        nome_anterior = cliente.nome
        with transaction.atomic():
            cliente.anonimizar()
            for registro in RegistroAuditoria.objects.filter(
                escritorio=cliente.escritorio, descricao__icontains=nome_anterior
            ):
                registro.descricao = registro.descricao.replace(nome_anterior, cliente.nome)
                registro.save(update_fields=["descricao"])
            registrar_auditoria(
                request, "edicao", cliente,
                descricao="Dados pessoais anonimizados a pedido do titular (LGPD).",
                escritorio=usuario.escritorio,
            )
        return Response(ClienteSerializer(cliente, context={"request": request}).data)


def _dados_do_titular(cliente, usuario):
    def data(valor):
        return valor.isoformat() if valor else None

    processos = esconder_sigilosos(cliente.processos.all(), usuario).select_related(
        "advogado__usuario"
    )
    return {
        "gerado_em": timezone.now().isoformat(),
        "escritorio": cliente.escritorio.nome,
        "base_legal": "Lei 13.709/2018 (LGPD), art. 18, II — confirmação e acesso aos dados.",
        "cliente": {
            "nome": cliente.nome,
            "tipo_pessoa": cliente.get_tipo_pessoa_display(),
            "cpf": cliente.cpf,
            "cnpj": cliente.cnpj,
            "rg": cliente.rg,
            "email": cliente.email,
            "telefone": cliente.telefone,
            "endereco": cliente.endereco,
            "data_nascimento": data(cliente.data_nascimento),
            "estado_civil": cliente.get_estado_civil_display() if cliente.estado_civil else "",
            "nacionalidade": cliente.nacionalidade,
            "foto_enviada": bool(cliente.foto),
            "documento_identidade_enviado": bool(cliente.documento_identidade),
            "consentimento_lgpd": cliente.consentimento_lgpd,
            "consentimento_lgpd_em": data(cliente.consentimento_lgpd_em),
            "cadastrado_em": data(cliente.criado_em),
        },
        "processos": [
            {
                "numero": processo.numero_processo,
                "titulo": processo.titulo,
                "status": processo.status,
                "advogado_responsavel": processo.advogado.usuario.nome,
                "inicio": data(processo.data_inicio),
                "movimentacoes": [
                    {"data": data(m.data_movimentacao), "descricao": m.descricao}
                    for m in processo.movimentacoes.order_by("data_movimentacao")
                ],
                "compromissos": [
                    {"data": data(a.data_evento), "titulo": a.titulo, "tipo": a.tipo}
                    for a in processo.eventos_agenda.order_by("data_evento")
                ],
                "documentos": [
                    {"nome": d.nome_arquivo, "enviado_em": data(d.enviado_em)}
                    for d in processo.documentos.order_by("enviado_em")
                ],
            }
            for processo in processos
        ],
        "contratos": [
            {
                "processo": contrato.processo.numero_processo,
                "valor_total": str(contrato.valor_total),
                "parcelas": [
                    {
                        "numero": p.numero,
                        "valor": str(p.valor),
                        "vencimento": data(p.data_vencimento),
                        "status": p.status,
                    }
                    for p in contrato.parcelas.order_by("numero")
                ],
            }
            for contrato in esconder_sigilosos(
                Contrato.objects.filter(processo__cliente=cliente), usuario
            ).select_related("processo")
        ],
    }
