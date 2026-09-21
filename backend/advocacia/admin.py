from django.contrib import admin

from .models import (
    Usuario,
    Cliente,
    Advogado,
    Processo,
    Movimentacao,
    Documento,
    Agenda,
    Contrato,
    Parcela,
    ApontamentoHora,
    Despesa,
    Tarefa,
    ModeloDocumento,
    NotificacaoEnviada,
    SessaoUso,
    RegistroAuditoria,
)


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'nome',
        'email',
        'tipo_usuario',
        'ativo',
        'email_verificado',
        'criado_em',
    )

    search_fields = (
        'nome',
        'email',
    )

    list_filter = (
        'tipo_usuario',
        'ativo',
        'email_verificado',
        'criado_em',
    )

    ordering = (
        '-criado_em',
    )


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'nome',
        'cpf',
        'email',
        'telefone',
        'ativo',
        'criado_em',
    )

    search_fields = (
        'nome',
        'cpf',
        'email',
        'telefone',
    )

    list_filter = (
        'ativo',
        'criado_em',
    )

    ordering = (
        '-criado_em',
    )


@admin.register(Advogado)
class AdvogadoAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'nome_advogado',
        'email_advogado',
        'oab',
        'especialidade',
    )

    search_fields = (
        'usuario__nome',
        'usuario__email',
        'oab',
        'especialidade',
    )

    list_select_related = (
        'usuario',
    )

    @admin.display(description='Nome')
    def nome_advogado(self, obj):
        return obj.usuario.nome

    @admin.display(description='E-mail')
    def email_advogado(self, obj):
        return obj.usuario.email


@admin.register(Processo)
class ProcessoAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'numero_processo',
        'titulo',
        'status',
        'cliente',
        'advogado',
        'data_inicio',
        'data_fim',
        'criado_em',
    )

    search_fields = (
        'numero_processo',
        'titulo',
        'cliente__nome',
        'advogado__usuario__nome',
    )

    list_filter = (
        'status',
        'data_inicio',
        'data_fim',
        'criado_em',
    )

    list_select_related = (
        'cliente',
        'advogado__usuario',
    )

    ordering = (
        '-criado_em',
    )


@admin.register(Movimentacao)
class MovimentacaoAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'processo',
        'descricao_resumida',
        'data_movimentacao',
    )

    search_fields = (
        'processo__numero_processo',
        'processo__titulo',
        'descricao',
    )

    list_filter = (
        'data_movimentacao',
    )

    list_select_related = (
        'processo',
    )

    ordering = (
        '-data_movimentacao',
    )

    @admin.display(description='Descrição')
    def descricao_resumida(self, obj):
        if len(obj.descricao) > 60:
            return f'{obj.descricao[:60]}...'

        return obj.descricao


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'nome_arquivo',
        'processo',
        'enviado_em',
    )

    search_fields = (
        'nome_arquivo',
        'processo__numero_processo',
        'processo__titulo',
    )

    list_filter = (
        'enviado_em',
    )

    list_select_related = (
        'processo',
    )

    ordering = (
        '-enviado_em',
    )


@admin.register(Agenda)
class AgendaAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'titulo',
        'processo',
        'cliente_evento',
        'data_evento',
        'local_evento',
        'criado_em',
    )

    search_fields = (
        'titulo',
        'descricao',
        'local_evento',
        'processo__numero_processo',
        'processo__titulo',
        'processo__cliente__nome',
    )

    list_filter = (
        'data_evento',
        'criado_em',
    )

    list_select_related = (
        'processo__cliente',
    )

    ordering = (
        'data_evento',
    )

    @admin.display(description='Cliente')
    def cliente_evento(self, obj):
        return obj.processo.cliente.nome


@admin.register(Contrato)
class ContratoAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'processo',
        'tipo_honorario',
        'valor_total',
        'forma_pagamento',
        'status',
        'criado_em',
    )

    search_fields = (
        'processo__numero_processo',
        'processo__titulo',
        'processo__cliente__nome',
    )

    list_filter = (
        'tipo_honorario',
        'forma_pagamento',
        'status',
    )

    list_select_related = (
        'processo__cliente',
    )

    ordering = (
        '-criado_em',
    )


@admin.register(Parcela)
class ParcelaAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'contrato',
        'numero',
        'valor',
        'data_vencimento',
        'status',
    )

    list_filter = (
        'status',
        'data_vencimento',
    )

    list_select_related = (
        'contrato__processo',
    )

    ordering = (
        'data_vencimento',
    )


@admin.register(RegistroAuditoria)
class RegistroAuditoriaAdmin(admin.ModelAdmin):
    """Somente leitura: um registro de auditoria nunca deve ser editável ou
    apagável pelo admin — isso anularia o propósito da trilha de auditoria.
    """

    list_display = (
        'id',
        'acao',
        'usuario',
        'superadmin',
        'escritorio',
        'modelo',
        'objeto_id',
        'criado_em',
    )

    search_fields = (
        'usuario__nome',
        'superadmin__nome',
        'escritorio__nome',
        'modelo',
        'descricao',
    )

    list_filter = (
        'acao',
        'modelo',
        'criado_em',
    )

    ordering = (
        '-criado_em',
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(NotificacaoEnviada)
class NotificacaoEnviadaAdmin(admin.ModelAdmin):

    list_display = (
        'enviado_em',
        'usuario',
        'tipo',
        'chave',
    )

    search_fields = (
        'usuario__nome',
        'usuario__email',
        'chave',
    )

    list_filter = (
        'tipo',
        'enviado_em',
    )

    ordering = (
        '-enviado_em',
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ApontamentoHora)
class ApontamentoHoraAdmin(admin.ModelAdmin):

    list_display = (
        'data',
        'processo',
        'usuario',
        'minutos',
        'faturavel',
        'valor_hora',
    )

    search_fields = (
        'processo__numero_processo',
        'usuario__nome',
        'descricao',
    )

    list_filter = (
        'faturavel',
        'data',
    )

    ordering = (
        '-data',
    )


@admin.register(Tarefa)
class TarefaAdmin(admin.ModelAdmin):

    list_display = (
        'titulo',
        'responsavel',
        'status',
        'prioridade',
        'prazo',
        'processo',
    )

    search_fields = (
        'titulo',
        'descricao',
        'processo__numero_processo',
        'responsavel__nome',
    )

    list_filter = (
        'status',
        'prioridade',
    )

    ordering = (
        '-criado_em',
    )


@admin.register(Despesa)
class DespesaAdmin(admin.ModelAdmin):

    list_display = (
        'data',
        'processo',
        'tipo',
        'valor',
        'reembolsavel',
        'reembolsada',
    )

    search_fields = (
        'processo__numero_processo',
        'descricao',
    )

    list_filter = (
        'tipo',
        'reembolsavel',
        'reembolsada',
        'data',
    )

    ordering = (
        '-data',
    )


@admin.register(SessaoUso)
class SessaoUsoAdmin(admin.ModelAdmin):

    list_display = (
        'usuario',
        'inicio',
        'ultima_atividade',
        'duracao_minutos',
    )

    search_fields = (
        'usuario__nome',
        'usuario__email',
    )

    list_filter = (
        'inicio',
    )

    ordering = (
        '-inicio',
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ModeloDocumento)
class ModeloDocumentoAdmin(admin.ModelAdmin):

    list_display = (
        'nome',
        'tipo',
        'escritorio',
        'atualizado_em',
    )

    search_fields = (
        'nome',
        'escritorio__nome',
    )

    list_filter = (
        'tipo',
    )

    ordering = (
        'nome',
    )
