from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
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
    Contrato,
    Parcela,
    ApontamentoHora,
    Despesa,
    Tarefa,
    ModeloDocumento,
    PreferenciasUsuario,
    ConfiguracaoEscritorio,
    RegistroAuditoria,
    ESTADOS_CIVIS,
)


class EscopoDoEscritorioMixin:
    """Recusa vínculo com registro de outro escritório.

    O EscritorioScopedMixin filtra a LEITURA por escritório, e isso dava a
    impressão de que o isolamento estava resolvido. Não estava: os campos
    de chave estrangeira aceitavam qualquer id existente, então era
    possível criar um processo apontando para o cliente de outro
    escritório, lançar movimentação em processo alheio e por aí adiante.

    Cada serializer declara em `campos_do_escritorio` quais vínculos
    precisam pertencer ao escritório de quem está autenticado. O
    escritório chega pelo contexto, posto lá pelo EscritorioScopedMixin.
    """

    campos_do_escritorio = ()

    def _escritorio_do_pedido(self):
        return self.context.get("escritorio")

    def validate(self, dados):
        dados = super().validate(dados)
        escritorio = self._escritorio_do_pedido()

        if escritorio is None:
            return dados

        erros = {}
        for campo in self.campos_do_escritorio:
            valor = dados.get(campo)
            if valor is None:
                continue
            # O processo é a via indireta mais comum: documento, agenda e
            # apontamento pertencem ao escritório através dele.
            dono = getattr(valor, "escritorio_id", None)
            if dono is None:
                dono = getattr(getattr(valor, "processo", None), "escritorio_id", None)
            if dono is not None and dono != escritorio.id:
                # Mensagem de "não encontrado", e não de "sem permissão":
                # confirmar a existência de um id alheio já é informação.
                erros[campo] = ["Registro não encontrado neste escritório."]

        if erros:
            raise serializers.ValidationError(erros)

        return dados


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


DESTINO_POR_CAMPO = {
    "senha": "A senha não é alterada por aqui: use a troca de senha nas configurações "
             "(exige a senha atual) ou a recuperação por e-mail.",
    "tipo_usuario": "O perfil de acesso é alterado pelo administrador, em "
                    "/api/usuarios/<id>/definir-perfil/.",
    "ativo": "A ativação é feita pelo administrador, em "
             "/api/usuarios/<id>/alternar-ativo/.",
}


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer da rota genérica de usuários.

    Três campos ficaram deliberadamente de fora da escrita aqui:

    - senha, porque esta rota não confere a senha atual nem aplica a
      política de senha forte. A troca própria passa por
      ConfiguracoesSenhaView (que exige a senha atual) e a recuperação,
      por RedefinirSenhaView. Aceitar senha aqui permitia gravar uma senha
      de um caractere.
    - tipo_usuario e ativo, porque mudar o próprio perfil para admin, ou
      reativar a própria conta, é escalada de privilégio. Quem promove,
      rebaixa, ativa ou desativa é o administrador, pelas ações dedicadas
      do UsuarioViewSet.
    """

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
        read_only_fields = [
            "id",
            "escritorio",
            "escritorio_nome",
            "criado_em",
            "tipo_usuario",
            "ativo",
        ]
        extra_kwargs = {
            "cpf": {"validators": [validar_cpf]},
            "rg": {"validators": [validar_rg]},
            "telefone": {"validators": [validar_telefone]},
        }

    def validate(self, dados):
        # Campo ignorado em silêncio é armadilha: quem enviasse uma senha
        # aqui receberia 200 e sairia achando que a trocou.
        enviados = getattr(self, "initial_data", {}) or {}
        recusados = [campo for campo in ("senha", "tipo_usuario", "ativo") if campo in enviados]
        if recusados:
            raise serializers.ValidationError({
                campo: [DESTINO_POR_CAMPO[campo]] for campo in recusados
            })
        return dados

    def update(self, instance, validated_data):
        for campo, valor in validated_data.items():
            setattr(instance, campo, valor)

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
            "valor_hora_padrao",
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


class ProcessoSerializer(EscopoDoEscritorioMixin, serializers.ModelSerializer):

    campos_do_escritorio = ("cliente", "advogado")


    cliente_nome = serializers.CharField(source="cliente.nome", read_only=True)
    cliente_email = serializers.EmailField(source="cliente.email", read_only=True)
    cliente_foto = serializers.ImageField(source="cliente.foto", read_only=True)
    advogado_nome = serializers.CharField(
        source="advogado.usuario.nome",
        read_only=True,
    )
    valor_estimado_honorarios_sucumbencia = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    proximo_prazo = serializers.SerializerMethodField()

    def get_proximo_prazo(self, obj):
        """O prazo pendente mais próximo do processo, para a listagem
        sinalizar urgência sem abrir a ficha.

        Lê de `prazos_pendentes_ordenados`, preenchido pelo prefetch do
        ProcessoViewSet para a página inteira numa única consulta. Fora
        dele — ao serializar um único processo recém-criado, por exemplo
        — cai para uma consulta direta, que aí é só uma e não N.
        """
        prazos = getattr(obj, "prazos_pendentes_ordenados", None)
        if prazos is None:
            prazos = list(
                obj.eventos_agenda
                .filter(tipo="prazo", cumprido=False)
                .order_by("data_evento", "pk")[:1]
            )
        if not prazos:
            return None
        prazo = prazos[0]
        return {
            "data_evento": prazo.data_evento,
            "prioridade": prazo.prioridade,
            "atrasado": prazo.data_evento <= timezone.now(),
        }

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
            "area_direito",
            "vara",
            "comarca",
            "valor_causa",
            "nome_parte_contraria",
            "nome_advogado_adverso",
            "oab_advogado_adverso",
            "percentual_honorarios_sucumbencia",
            "valor_estimado_honorarios_sucumbencia",
            "datajud_sincronizado_em",
            "proximo_prazo",
            "criado_em",
        ]
        read_only_fields = [
            "id",
            "datajud_sincronizado_em",
            "proximo_prazo",
            "cliente_nome",
            "cliente_email",
            "cliente_foto",
            "advogado_nome",
            "valor_estimado_honorarios_sucumbencia",
            "criado_em",
        ]


class MovimentacaoSerializer(EscopoDoEscritorioMixin, serializers.ModelSerializer):

    campos_do_escritorio = ("processo",)


    processo_titulo = serializers.CharField(source="processo.titulo", read_only=True)
    numero_processo = serializers.CharField(
        source="processo.numero_processo",
        read_only=True,
    )
    criado_por_nome = serializers.CharField(source="criado_por.nome", read_only=True, default=None)
    # Distinguir o andamento lançado à mão do importado do tribunal é o
    # que permite à linha do tempo mostrar de onde veio cada item.
    origem_display = serializers.CharField(source="get_origem_display", read_only=True)

    class Meta:
        model = Movimentacao
        fields = [
            "id",
            "processo",
            "processo_titulo",
            "numero_processo",
            "descricao",
            "data_movimentacao",
            "criado_por_nome",
            "origem",
            "origem_display",
        ]
        read_only_fields = [
            "id",
            "processo_titulo",
            "numero_processo",
            "data_movimentacao",
            "criado_por_nome",
            "origem",
            "origem_display",
        ]


class DocumentoSerializer(EscopoDoEscritorioMixin, serializers.ModelSerializer):

    campos_do_escritorio = ("processo",)


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


class AgendaSerializer(EscopoDoEscritorioMixin, serializers.ModelSerializer):

    campos_do_escritorio = ("processo",)


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
    atrasado = serializers.SerializerMethodField()

    class Meta:
        model = Agenda
        fields = [
            "id",
            "processo",
            "processo_titulo",
            "numero_processo",
            "cliente_nome",
            "advogado_nome",
            "tipo",
            "prioridade",
            "titulo",
            "descricao",
            "data_evento",
            "local_evento",
            "cumprido",
            "atrasado",
            "criado_em",
        ]
        read_only_fields = [
            "id",
            "processo_titulo",
            "numero_processo",
            "cliente_nome",
            "advogado_nome",
            "atrasado",
            "criado_em",
        ]

    def get_atrasado(self, obj):
        from django.utils import timezone

        return not obj.cumprido and obj.data_evento < timezone.now()


class EscritorioAdminSerializer(serializers.ModelSerializer):

    total_advogados = serializers.SerializerMethodField()
    total_clientes = serializers.SerializerMethodField()
    total_processos = serializers.SerializerMethodField()

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
            "plano",
            "plano_validade",
            "total_advogados",
            "total_clientes",
            "total_processos",
            "criado_em",
        ]
        read_only_fields = ["id", "criado_em", "total_advogados", "total_clientes", "total_processos"]

    def get_total_advogados(self, obj):
        return obj.advogados.count()

    def get_total_clientes(self, obj):
        return obj.clientes.count()

    def get_total_processos(self, obj):
        return obj.processos.count()


class ParcelaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Parcela
        fields = [
            "id",
            "contrato",
            "numero",
            "valor",
            "data_vencimento",
            "status",
            "pago_em",
        ]
        read_only_fields = ["id", "contrato", "numero", "valor", "data_vencimento", "pago_em"]


class ContratoSerializer(EscopoDoEscritorioMixin, serializers.ModelSerializer):

    campos_do_escritorio = ("processo",)


    numero_processo = serializers.CharField(source="processo.numero_processo", read_only=True)
    processo_titulo = serializers.CharField(source="processo.titulo", read_only=True)
    cliente_nome = serializers.CharField(source="processo.cliente.nome", read_only=True)
    parcelas = ParcelaSerializer(many=True, read_only=True)
    valor_pago = serializers.SerializerMethodField()
    valor_pendente = serializers.SerializerMethodField()

    class Meta:
        model = Contrato
        fields = [
            "id",
            "processo",
            "numero_processo",
            "processo_titulo",
            "cliente_nome",
            "tipo_honorario",
            "valor_total",
            "forma_pagamento",
            "numero_parcelas",
            "status",
            "observacoes",
            "parcelas",
            "valor_pago",
            "valor_pendente",
            "criado_em",
        ]
        read_only_fields = [
            "id",
            "numero_processo",
            "processo_titulo",
            "cliente_nome",
            "parcelas",
            "valor_pago",
            "valor_pendente",
            "criado_em",
        ]

    def get_valor_pago(self, obj):
        return sum((p.valor for p in obj.parcelas.all() if p.status == "pago"), 0)

    def get_valor_pendente(self, obj):
        return sum((p.valor for p in obj.parcelas.all() if p.status != "pago"), 0)


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
            "notificacao_movimentacao",
            "notificacao_novo_cliente",
            "notificacao_tarefa_atribuida",
            "lembrete_audiencia",
            "antecedencia_audiencia",
            "lembrete_prazo",
            "resumo_semanal",
            "atualizado_em",
        ]
        read_only_fields = ["atualizado_em"]


class RegistroAuditoriaSerializer(serializers.ModelSerializer):

    usuario_nome = serializers.CharField(source="usuario.nome", read_only=True, default=None)
    superadmin_nome = serializers.CharField(source="superadmin.nome", read_only=True, default=None)
    escritorio_nome = serializers.CharField(source="escritorio.nome", read_only=True, default=None)
    acao_label = serializers.CharField(source="get_acao_display", read_only=True)

    class Meta:
        model = RegistroAuditoria
        fields = [
            "id",
            "escritorio",
            "escritorio_nome",
            "usuario_nome",
            "superadmin_nome",
            "acao",
            "acao_label",
            "modelo",
            "objeto_id",
            "descricao",
            "endereco_ip",
            "criado_em",
        ]
        read_only_fields = fields


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


class TarefaSerializer(serializers.ModelSerializer):

    numero_processo = serializers.CharField(source="processo.numero_processo", read_only=True)
    cliente_nome = serializers.CharField(source="processo.cliente.nome", read_only=True)
    responsavel_nome = serializers.CharField(source="responsavel.nome", read_only=True)
    criado_por_nome = serializers.CharField(source="criado_por.nome", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    prioridade_display = serializers.CharField(source="get_prioridade_display", read_only=True)
    atrasada = serializers.BooleanField(read_only=True)

    class Meta:
        model = Tarefa
        fields = [
            "id",
            "titulo",
            "descricao",
            "processo",
            "numero_processo",
            "cliente_nome",
            "responsavel",
            "responsavel_nome",
            "status",
            "status_display",
            "prioridade",
            "prioridade_display",
            "prazo",
            "atrasada",
            "concluida_em",
            "criado_por",
            "criado_por_nome",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = [
            "id",
            "numero_processo",
            "cliente_nome",
            "responsavel_nome",
            "status_display",
            "prioridade_display",
            "atrasada",
            # A data de conclusão é gravada pela view quando o status muda,
            # não informada por quem edita.
            "concluida_em",
            "criado_por",
            "criado_por_nome",
            "criado_em",
            "atualizado_em",
        ]

    def validate_titulo(self, valor):
        valor = (valor or "").strip()
        if not valor:
            raise serializers.ValidationError("Informe um título para a tarefa.")
        return valor

    def validate_responsavel(self, usuario):
        escritorio = self.context.get("escritorio")
        if escritorio and usuario.escritorio_id != escritorio.id:
            raise serializers.ValidationError(
                "O responsável precisa ser um usuário do próprio escritório."
            )
        if not usuario.ativo:
            raise serializers.ValidationError(
                "Não é possível atribuir uma tarefa a um usuário inativo."
            )
        return usuario

    def validate_processo(self, processo):
        escritorio = self.context.get("escritorio")
        if processo and escritorio and processo.escritorio_id != escritorio.id:
            raise serializers.ValidationError("Processo não encontrado neste escritório.")
        return processo


class ApontamentoHoraSerializer(EscopoDoEscritorioMixin, serializers.ModelSerializer):

    campos_do_escritorio = ("processo",)


    numero_processo = serializers.CharField(source="processo.numero_processo", read_only=True)
    usuario_nome = serializers.CharField(source="usuario.nome", read_only=True)
    horas = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    valor = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = ApontamentoHora
        fields = [
            "id",
            "processo",
            "numero_processo",
            "usuario",
            "usuario_nome",
            "data",
            "minutos",
            "horas",
            "descricao",
            "faturavel",
            "valor_hora",
            "valor",
            "criado_em",
        ]
        # O usuário vem sempre do token: horas apontadas precisam ser
        # rastreáveis a quem as lançou, não a quem o cliente informar.
        read_only_fields = [
            "id", "usuario", "numero_processo", "usuario_nome", "horas", "valor", "criado_em",
        ]

    def validate_minutos(self, valor):
        if valor > 24 * 60:
            raise serializers.ValidationError("Um apontamento não pode passar de 24 horas.")
        return valor

    def validate_data(self, valor):
        if valor > timezone.localdate():
            raise serializers.ValidationError("Não é possível apontar horas em uma data futura.")
        return valor


class DespesaSerializer(EscopoDoEscritorioMixin, serializers.ModelSerializer):

    campos_do_escritorio = ("processo",)


    numero_processo = serializers.CharField(source="processo.numero_processo", read_only=True)
    cliente_nome = serializers.CharField(source="processo.cliente.nome", read_only=True)
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)

    class Meta:
        model = Despesa
        fields = [
            "id",
            "processo",
            "numero_processo",
            "cliente_nome",
            "tipo",
            "tipo_display",
            "descricao",
            "valor",
            "data",
            "reembolsavel",
            "reembolsada",
            "comprovante",
            "criado_em",
        ]
        read_only_fields = ["id", "numero_processo", "cliente_nome", "tipo_display", "criado_em"]

    def validate(self, dados):
        # O super() é o que mantém a checagem de escritório do mixin: sem
        # ele, este validate a sobrescreveria em silêncio e a despesa
        # voltaria a aceitar processo de outro escritório.
        dados = super().validate(dados)

        reembolsavel = dados.get(
            "reembolsavel", getattr(self.instance, "reembolsavel", True)
        )
        reembolsada = dados.get(
            "reembolsada", getattr(self.instance, "reembolsada", False)
        )
        if reembolsada and not reembolsavel:
            raise serializers.ValidationError(
                {"reembolsada": "Uma despesa não reembolsável não pode ser marcada como reembolsada."}
            )
        return dados


class ModeloDocumentoSerializer(serializers.ModelSerializer):

    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)

    class Meta:
        model = ModeloDocumento
        fields = [
            "id",
            "nome",
            "tipo",
            "tipo_display",
            "conteudo",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "tipo_display", "criado_em", "atualizado_em"]
