from django.contrib import admin

from .models import (
    Usuario,
    Cliente,
    Advogado,
    Processo,
    Movimentacao,
    Documento,
    Agenda,
)


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'nome',
        'email',
        'tipo_usuario',
        'ativo',
        'criado_em',
    )

    search_fields = (
        'nome',
        'email',
    )

    list_filter = (
        'tipo_usuario',
        'ativo',
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