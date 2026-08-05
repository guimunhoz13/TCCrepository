from django.contrib.auth.hashers import make_password
from django.db import transaction
from rest_framework import serializers

from .models import (
    Escritorio,
    Usuario,
    Cliente,
    Advogado,
    Processo,
    Movimentacao,
    Documento,
    Agenda,
)


class EscritorioSerializer(serializers.ModelSerializer):

    class Meta:
        model = Escritorio
        fields = [
            "id",
            "nome",
            "cnpj",
            "email",
            "telefone",
            "endereco",
            "cidade",
            "estado",
            "ativo",
            "criado_em",
        ]
        read_only_fields = ["id", "criado_em"]


class EscritorioRegistroSerializer(serializers.Serializer):

    nome_escritorio = serializers.CharField(max_length=255)
    cnpj = serializers.CharField(max_length=18)
    email_escritorio = serializers.EmailField()
    telefone_escritorio = serializers.CharField(max_length=20)
    endereco_escritorio = serializers.CharField(max_length=255)
    cidade = serializers.CharField(max_length=100, required=False, allow_blank=True)
    estado = serializers.CharField(max_length=2, required=False, allow_blank=True)

    nome_admin = serializers.CharField(max_length=255)
    email_admin = serializers.EmailField()
    senha_admin = serializers.CharField(write_only=True, min_length=6)

    def validate_cnpj(self, value):
        if Escritorio.objects.filter(cnpj=value).exists():
            raise serializers.ValidationError("CNPJ já cadastrado.")
        return value

    def validate_email_admin(self, value):
        if Usuario.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("E-mail já cadastrado.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        escritorio = Escritorio.objects.create(
            nome=validated_data["nome_escritorio"],
            cnpj=validated_data["cnpj"],
            email=validated_data["email_escritorio"],
            telefone=validated_data["telefone_escritorio"],
            endereco=validated_data["endereco_escritorio"],
            cidade=validated_data.get("cidade", ""),
            estado=validated_data.get("estado", ""),
        )

        usuario = Usuario.objects.create(
            escritorio=escritorio,
            nome=validated_data["nome_admin"],
            email=validated_data["email_admin"],
            senha=make_password(validated_data["senha_admin"]),
            tipo_usuario="admin",
        )

        return {"escritorio": escritorio, "usuario": usuario}


class UsuarioSerializer(serializers.ModelSerializer):

    senha = serializers.CharField(write_only=True, required=True)
    escritorio_nome = serializers.CharField(
        source="escritorio.nome",
        read_only=True,
    )

    class Meta:
        model = Usuario
        fields = [
            "id",
            "escritorio",
            "escritorio_nome",
            "nome",
            "email",
            "senha",
            "tipo_usuario",
            "ativo",
            "criado_em",
        ]
        read_only_fields = ["id", "escritorio", "escritorio_nome", "criado_em"]

    def create(self, validated_data):
        senha = validated_data.pop("senha")
        return Usuario.objects.create(
            senha=make_password(senha),
            **validated_data,
        )

    def update(self, instance, validated_data):
        senha = validated_data.pop("senha", None)

        for campo, valor in validated_data.items():
            setattr(instance, campo, valor)

        if senha:
            instance.senha = make_password(senha)

        instance.save()
        return instance


class AdvogadoRegistroSerializer(serializers.Serializer):

    nome = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True, min_length=6)
    oab = serializers.CharField(max_length=30)
    especialidade = serializers.CharField(max_length=255)

    def validate_email(self, value):
        if Usuario.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("E-mail já cadastrado.")
        return value

    @transaction.atomic
    def create(self, validated_data, escritorio):
        usuario = Usuario.objects.create(
            escritorio=escritorio,
            nome=validated_data["nome"],
            email=validated_data["email"],
            senha=make_password(validated_data["senha"]),
            tipo_usuario="advogado",
        )

        advogado = Advogado.objects.create(
            escritorio=escritorio,
            usuario=usuario,
            oab=validated_data["oab"],
            especialidade=validated_data["especialidade"],
        )

        return advogado


class ClienteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Cliente
        fields = [
            "id",
            "nome",
            "cpf",
            "email",
            "telefone",
            "endereco",
            "data_nascimento",
            "ativo",
            "criado_em",
        ]
        read_only_fields = ["id", "criado_em"]


class AdvogadoSerializer(serializers.ModelSerializer):

    nome = serializers.CharField(source="usuario.nome", read_only=True)
    email = serializers.EmailField(source="usuario.email", read_only=True)

    class Meta:
        model = Advogado
        fields = [
            "id",
            "usuario",
            "nome",
            "email",
            "oab",
            "especialidade",
        ]
        read_only_fields = ["id", "nome", "email"]


class ProcessoSerializer(serializers.ModelSerializer):

    cliente_nome = serializers.CharField(source="cliente.nome", read_only=True)
    cliente_email = serializers.EmailField(source="cliente.email", read_only=True)
    advogado_nome = serializers.CharField(
        source="advogado.usuario.nome",
        read_only=True,
    )

    class Meta:
        model = Processo
        fields = [
            "id",
            "numero_processo",
            "titulo",
            "descricao",
            "status",
            "cliente",
            "cliente_nome",
            "cliente_email",
            "advogado",
            "advogado_nome",
            "data_inicio",
            "data_fim",
            "criado_em",
        ]
        read_only_fields = [
            "id",
            "cliente_nome",
            "cliente_email",
            "advogado_nome",
            "criado_em",
        ]


class MovimentacaoSerializer(serializers.ModelSerializer):

    processo_titulo = serializers.CharField(source="processo.titulo", read_only=True)
    numero_processo = serializers.CharField(
        source="processo.numero_processo",
        read_only=True,
    )

    class Meta:
        model = Movimentacao
        fields = [
            "id",
            "processo",
            "processo_titulo",
            "numero_processo",
            "descricao",
            "data_movimentacao",
        ]
        read_only_fields = [
            "id",
            "processo_titulo",
            "numero_processo",
            "data_movimentacao",
        ]


class DocumentoSerializer(serializers.ModelSerializer):

    processo_titulo = serializers.CharField(source="processo.titulo", read_only=True)
    numero_processo = serializers.CharField(
        source="processo.numero_processo",
        read_only=True,
    )

    class Meta:
        model = Documento
        fields = [
            "id",
            "processo",
            "processo_titulo",
            "numero_processo",
            "nome_arquivo",
            "arquivo",
            "enviado_em",
        ]
        read_only_fields = [
            "id",
            "processo_titulo",
            "numero_processo",
            "enviado_em",
        ]


class AgendaSerializer(serializers.ModelSerializer):

    processo_titulo = serializers.CharField(source="processo.titulo", read_only=True)
    numero_processo = serializers.CharField(
        source="processo.numero_processo",
        read_only=True,
    )
    cliente_nome = serializers.CharField(
        source="processo.cliente.nome",
        read_only=True,
    )
    advogado_nome = serializers.CharField(
        source="processo.advogado.usuario.nome",
        read_only=True,
    )

    class Meta:
        model = Agenda
        fields = [
            "id",
            "processo",
            "processo_titulo",
            "numero_processo",
            "cliente_nome",
            "advogado_nome",
            "titulo",
            "descricao",
            "data_evento",
            "local_evento",
            "criado_em",
        ]
        read_only_fields = [
            "id",
            "processo_titulo",
            "numero_processo",
            "cliente_nome",
            "advogado_nome",
            "criado_em",
        ]
