from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from .models import (
    Usuario,
    Cliente,
    Advogado,
    Processo,
    Movimentacao,
    Documento,
    Agenda,
)


class UsuarioSerializer(serializers.ModelSerializer):

    senha = serializers.CharField(
        write_only=True,
        required=True
    )

    class Meta:
        model = Usuario

        fields = [
            'id',
            'nome',
            'email',
            'senha',
            'tipo_usuario',
            'ativo',
            'criado_em',
        ]

        read_only_fields = [
            'id',
            'criado_em',
        ]

    def create(self, validated_data):
        senha = validated_data.pop('senha')

        usuario = Usuario.objects.create(
            senha=make_password(senha),
            **validated_data
        )

        return usuario

    def update(self, instance, validated_data):
        senha = validated_data.pop('senha', None)

        for campo, valor in validated_data.items():
            setattr(instance, campo, valor)

        if senha:
            instance.senha = make_password(senha)

        instance.save()

        return instance


class ClienteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Cliente

        fields = [
            'id',
            'nome',
            'cpf',
            'email',
            'telefone',
            'endereco',
            'data_nascimento',
            'ativo',
            'criado_em',
        ]

        read_only_fields = [
            'id',
            'criado_em',
        ]


class AdvogadoSerializer(serializers.ModelSerializer):

    nome = serializers.CharField(
        source='usuario.nome',
        read_only=True
    )

    email = serializers.EmailField(
        source='usuario.email',
        read_only=True
    )

    class Meta:
        model = Advogado

        fields = [
            'id',
            'usuario',
            'nome',
            'email',
            'oab',
            'especialidade',
        ]

        read_only_fields = [
            'id',
            'nome',
            'email',
        ]


class ProcessoSerializer(serializers.ModelSerializer):

    cliente_nome = serializers.CharField(
        source='cliente.nome',
        read_only=True
    )

    cliente_email = serializers.EmailField(
        source='cliente.email',
        read_only=True
    )

    advogado_nome = serializers.CharField(
        source='advogado.usuario.nome',
        read_only=True
    )

    class Meta:
        model = Processo

        fields = [
            'id',
            'numero_processo',
            'titulo',
            'descricao',
            'status',
            'cliente',
            'cliente_nome',
            'cliente_email',
            'advogado',
            'advogado_nome',
            'data_inicio',
            'data_fim',
            'criado_em',
        ]

        read_only_fields = [
            'id',
            'cliente_nome',
            'cliente_email',
            'advogado_nome',
            'criado_em',
        ]


class MovimentacaoSerializer(serializers.ModelSerializer):

    processo_titulo = serializers.CharField(
        source='processo.titulo',
        read_only=True
    )

    numero_processo = serializers.CharField(
        source='processo.numero_processo',
        read_only=True
    )

    class Meta:
        model = Movimentacao

        fields = [
            'id',
            'processo',
            'processo_titulo',
            'numero_processo',
            'descricao',
            'data_movimentacao',
        ]

        read_only_fields = [
            'id',
            'processo_titulo',
            'numero_processo',
            'data_movimentacao',
        ]


class DocumentoSerializer(serializers.ModelSerializer):

    processo_titulo = serializers.CharField(
        source='processo.titulo',
        read_only=True
    )

    numero_processo = serializers.CharField(
        source='processo.numero_processo',
        read_only=True
    )

    class Meta:
        model = Documento

        fields = [
            'id',
            'processo',
            'processo_titulo',
            'numero_processo',
            'nome_arquivo',
            'arquivo',
            'enviado_em',
        ]

        read_only_fields = [
            'id',
            'processo_titulo',
            'numero_processo',
            'enviado_em',
        ]


class AgendaSerializer(serializers.ModelSerializer):

    processo_titulo = serializers.CharField(
        source='processo.titulo',
        read_only=True
    )

    numero_processo = serializers.CharField(
        source='processo.numero_processo',
        read_only=True
    )

    cliente_nome = serializers.CharField(
        source='processo.cliente.nome',
        read_only=True
    )

    cliente_email = serializers.EmailField(
        source='processo.cliente.email',
        read_only=True
    )

    advogado_nome = serializers.CharField(
        source='processo.advogado.usuario.nome',
        read_only=True
    )

    class Meta:
        model = Agenda

        fields = [
            'id',
            'processo',
            'processo_titulo',
            'numero_processo',
            'cliente_nome',
            'cliente_email',
            'advogado_nome',
            'titulo',
            'descricao',
            'data_evento',
            'local_evento',
            'criado_em',
        ]

        read_only_fields = [
            'id',
            'processo_titulo',
            'numero_processo',
            'cliente_nome',
            'cliente_email',
            'advogado_nome',
            'criado_em',
        ]