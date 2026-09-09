from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from .validators import (
    validar_email_real,
    validar_cpf,
    validar_cnpj,
    validar_telefone,
    validar_oab,
    validar_rg,
    validar_senha_forte,
)
from .models import (
    Escritorio,
    Usuario,
    Cliente,
    Advogado,
    Processo,
    Movimentacao,
    Documento,
    Agenda,
    PreferenciasUsuario,
    ConfiguracaoEscritorio,
    ESTADOS_CIVIS,
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
    email_escritorio = serializers.EmailField(validators=[validar_email_real])
    telefone_escritorio = serializers.CharField(max_length=20, validators=[validar_telefone])
    endereco_escritorio = serializers.CharField(max_length=255)
    cidade = serializers.CharField(max_length=100, required=False, allow_blank=True)
    estado = serializers.CharField(max_length=2, required=False, allow_blank=True)

    nome_admin = serializers.CharField(max_length=255)
    email_admin = serializers.EmailField(validators=[validar_email_real])
    senha_admin = serializers.CharField(write_only=True, validators=[validar_senha_forte])

    def validate_cnpj(self, value):
        validar_cnpj(value)
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
    email = serializers.EmailField(validators=[validar_email_real])
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
            "telefone",
            "senha",
            "tipo_usuario",
            "foto",
            "documento_identidade",
            "cpf",
            "rg",
            "data_nascimento",
            "estado_civil",
            "nacionalidade",
            "ativo",
            "criado_em",
        ]
        read_only_fields = ["id", "escritorio", "escritorio_nome", "criado_em"]
        extra_kwargs = {
            "cpf": {"validators": [validar_cpf]},
            "rg": {"validators": [validar_rg]},
            "telefone": {"validators": [validar_telefone]},
        }

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
    email = serializers.EmailField(validators=[validar_email_real])
    senha = serializers.CharField(write_only=True, validators=[validar_senha_forte])
    telefone = serializers.CharField(
        max_length=20, required=False, allow_blank=True, validators=[validar_telefone]
    )
    oab = serializers.CharField(max_length=30, validators=[validar_oab])
    especialidade = serializers.CharField(max_length=255)
    foto = serializers.ImageField(required=False, allow_null=True)
    documento_identidade = serializers.FileField(required=False, allow_null=True)
    cpf = serializers.CharField(
        max_length=14, required=False, allow_blank=True, validators=[validar_cpf]
    )
    rg = serializers.CharField(
        max_length=20, required=False, allow_blank=True, validators=[validar_rg]
    )
    data_nascimento = serializers.DateField(required=False, allow_null=True)
    estado_civil = serializers.ChoiceField(choices=ESTADOS_CIVIS, required=False, allow_blank=True)
    nacionalidade = serializers.CharField(max_length=100, required=False, allow_blank=True)

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
            telefone=validated_data.get("telefone", ""),
            foto=validated_data.get("foto"),
            documento_identidade=validated_data.get("documento_identidade"),
            cpf=validated_data.get("cpf", ""),
            rg=validated_data.get("rg", ""),
            data_nascimento=validated_data.get("data_nascimento"),
            estado_civil=validated_data.get("estado_civil", ""),
            nacionalidade=validated_data.get("nacionalidade") or "Brasileira",
        )

        advogado = Advogado.objects.create(
            escritorio=escritorio,
            usuario=usuario,
            oab=validated_data["oab"],
            especialidade=validated_data["especialidade"],
        )

        return advogado


class ClienteSerializer(serializers.ModelSerializer):

    email = serializers.EmailField(validators=[validar_email_real])

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
            "rg",
            "estado_civil",
            "nacionalidade",
            "foto",
            "documento_identidade",
            "ativo",
            "criado_em",
        ]
        read_only_fields = ["id", "criado_em"]
        extra_kwargs = {
            "cpf": {"validators": [validar_cpf]},
            "rg": {"validators": [validar_rg]},
            "telefone": {"validators": [validar_telefone]},
        }


class AdvogadoSerializer(serializers.ModelSerializer):

    nome = serializers.CharField(source="usuario.nome")
    email = serializers.EmailField(source="usuario.email", read_only=True)
    telefone = serializers.CharField(
        source="usuario.telefone", required=False, allow_blank=True, validators=[validar_telefone]
    )
    foto = serializers.ImageField(source="usuario.foto", required=False, allow_null=True)
    documento_identidade = serializers.FileField(
        source="usuario.documento_identidade", required=False, allow_null=True
    )
    cpf = serializers.CharField(
        source="usuario.cpf", required=False, allow_blank=True, validators=[validar_cpf]
    )
    rg = serializers.CharField(
        source="usuario.rg", required=False, allow_blank=True, validators=[validar_rg]
    )
    data_nascimento = serializers.DateField(
        source="usuario.data_nascimento", required=False, allow_null=True
    )
    estado_civil = serializers.ChoiceField(
        source="usuario.estado_civil", choices=ESTADOS_CIVIS, required=False, allow_blank=True
    )
    nacionalidade = serializers.CharField(
        source="usuario.nacionalidade", required=False, allow_blank=True
    )

    class Meta:
        model = Advogado
        fields = [
            "id",
            "usuario",
            "nome",
            "email",
            "telefone",
            "foto",
            "documento_identidade",
            "cpf",
            "rg",
            "data_nascimento",
            "estado_civil",
            "nacionalidade",
            "oab",
            "especialidade",
        ]
        read_only_fields = ["id", "usuario", "email"]
        extra_kwargs = {
            "oab": {"validators": [validar_oab]},
        }

    def update(self, instance, validated_data):
        dados_usuario = validated_data.pop("usuario", {})
        if dados_usuario:
            for campo, valor in dados_usuario.items():
                setattr(instance.usuario, campo, valor)
            instance.usuario.save()
        return super().update(instance, validated_data)


class ProcessoSerializer(serializers.ModelSerializer):

    cliente_nome = serializers.CharField(source="cliente.nome", read_only=True)
    cliente_email = serializers.EmailField(source="cliente.email", read_only=True)
    cliente_foto = serializers.ImageField(source="cliente.foto", read_only=True)
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
            "cliente_foto",
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
            "cliente_foto",
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


class PreferenciasUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreferenciasUsuario
        fields = [
            "tema",
            "densidade_tabela",
            "idioma",
            "pagina_inicial",
            "notificacao_novo_processo",
            "notificacao_novo_documento",
            "notificacao_status_processo",
            "notificacao_novo_cliente",
            "lembrete_audiencia",
            "antecedencia_audiencia",
            "lembrete_prazo",
            "resumo_semanal",
            "atualizado_em",
        ]
        read_only_fields = ["atualizado_em"]


class ConfiguracaoEscritorioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracaoEscritorio
        fields = [
            "timezone",
            "formato_data",
            "retencao_documentos",
            "atualizado_em",
        ]
        read_only_fields = ["atualizado_em"]
