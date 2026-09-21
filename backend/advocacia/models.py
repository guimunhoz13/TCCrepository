from decimal import Decimal

from django.core.validators import FileExtensionValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from .validators import validar_tamanho_documento, validar_tamanho_imagem


ESTADOS_CIVIS = (
    ("solteiro", "Solteiro(a)"),
    ("casado", "Casado(a)"),
    ("divorciado", "Divorciado(a)"),
    ("viuvo", "Viúvo(a)"),
    ("uniao_estavel", "União estável"),
)


class Escritorio(models.Model):

    PLANOS = (
        ("gratuito", "Gratuito"),
        ("basico", "Básico"),
        ("profissional", "Profissional"),
    )

    nome = models.CharField(max_length=255)
    cnpj = models.CharField(max_length=18, unique=True)
    email = models.EmailField()
    telefone = models.CharField(max_length=20)
    endereco = models.CharField(max_length=255)
    cidade = models.CharField(max_length=100, blank=True, default="")
    estado = models.CharField(max_length=2, blank=True, default="")
    ativo = models.BooleanField(default=True)
    plano = models.CharField(max_length=20, choices=PLANOS, default="gratuito")
    plano_validade = models.DateField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Escritórios"

    def __str__(self):
        return self.nome


class SuperAdmin(models.Model):

    nome = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    senha = models.CharField(max_length=255)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Administrador do sistema"
        verbose_name_plural = "Administradores do sistema"

    def __str__(self):
        return self.nome


class Usuario(models.Model):

    TIPOS_USUARIO = (
        ("admin", "Administrador"),
        ("advogado", "Advogado"),
    )

    escritorio = models.ForeignKey(
        Escritorio,
        on_delete=models.CASCADE,
        related_name="usuarios",
    )

    nome = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    telefone = models.CharField(max_length=20, blank=True, default="")
    senha = models.CharField(max_length=255)
    tipo_usuario = models.CharField(max_length=20, choices=TIPOS_USUARIO)
    foto = models.ImageField(
        upload_to="usuarios/fotos/",
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(["jpg", "jpeg", "png", "webp"]),
            validar_tamanho_imagem,
        ],
    )
    documento_identidade = models.FileField(
        upload_to="usuarios/documentos/",
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(["pdf", "jpg", "jpeg", "png"]),
            validar_tamanho_documento,
        ],
    )
    cpf = models.CharField(max_length=14, blank=True, default="")
    rg = models.CharField(max_length=20, blank=True, default="")
    data_nascimento = models.DateField(null=True, blank=True)
    estado_civil = models.CharField(max_length=20, choices=ESTADOS_CIVIS, blank=True, default="")
    nacionalidade = models.CharField(max_length=100, blank=True, default="Brasileira")
    ativo = models.BooleanField(default=True)
    tentativas_login = models.PositiveSmallIntegerField(default=0)
    bloqueado_ate = models.DateTimeField(null=True, blank=True)
    # Padrão True: só o auto-cadastro público de escritório (EscritorioRegistroView)
    # exige confirmação, e só em produção (DEBUG=False) — advogados cadastrados
    # por um administrador já autenticado são vouched for por ele, e em
    # desenvolvimento/teste isso quebraria o uso de e-mails fictícios.
    email_verificado = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome


class Cliente(models.Model):

    escritorio = models.ForeignKey(
        Escritorio,
        on_delete=models.CASCADE,
        related_name="clientes",
    )

    nome = models.CharField(max_length=255)
    cpf = models.CharField(max_length=14)
    email = models.EmailField()
    telefone = models.CharField(max_length=20)
    endereco = models.CharField(max_length=255)
    data_nascimento = models.DateField(null=True, blank=True)
    rg = models.CharField(max_length=20, blank=True, default="")
    estado_civil = models.CharField(max_length=20, choices=ESTADOS_CIVIS, blank=True, default="")
    nacionalidade = models.CharField(max_length=100, blank=True, default="Brasileira")
    foto = models.ImageField(
        upload_to="clientes/fotos/",
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(["jpg", "jpeg", "png", "webp"]),
            validar_tamanho_imagem,
        ],
    )
    documento_identidade = models.FileField(
        upload_to="clientes/documentos/",
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(["pdf", "jpg", "jpeg", "png"]),
            validar_tamanho_documento,
        ],
    )
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["escritorio", "cpf"]]

    def __str__(self):
        return self.nome


class Advogado(models.Model):

    escritorio = models.ForeignKey(
        Escritorio,
        on_delete=models.CASCADE,
        related_name="advogados",
    )

    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name="advogado",
    )

    oab = models.CharField(max_length=30)
    especialidade = models.CharField(max_length=255)

    # Pré-preenche o valor/hora ao apontar horas; cada apontamento ainda
    # pode usar um valor próprio.
    valor_hora_padrao = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.01"))],
    )

    class Meta:
        unique_together = [["escritorio", "oab"]]

    def __str__(self):
        return self.usuario.nome


class Processo(models.Model):

    STATUS_PROCESSO = (
        ("Em andamento", "Em andamento"),
        ("Concluido", "Concluído"),
        ("Suspenso", "Suspenso"),
        ("Arquivado", "Arquivado"),
    )

    AREAS_DIREITO = (
        ("civel", "Cível"),
        ("trabalhista", "Trabalhista"),
        ("tributario", "Tributário"),
        ("criminal", "Criminal"),
        ("familia", "Família e Sucessões"),
        ("previdenciario", "Previdenciário"),
        ("empresarial", "Empresarial"),
        ("administrativo", "Administrativo"),
        ("consumidor", "Consumidor"),
        ("ambiental", "Ambiental"),
    )

    escritorio = models.ForeignKey(
        Escritorio,
        on_delete=models.CASCADE,
        related_name="processos",
    )

    numero_processo = models.CharField(max_length=100)
    titulo = models.CharField(max_length=255)
    descricao = models.TextField()
    status = models.CharField(
        max_length=50,
        choices=STATUS_PROCESSO,
        default="Em andamento",
    )

    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name="processos",
    )

    advogado = models.ForeignKey(
        Advogado,
        on_delete=models.CASCADE,
        related_name="processos",
    )

    data_inicio = models.DateField(null=True, blank=True)
    data_fim = models.DateField(null=True, blank=True)

    area_direito = models.CharField(max_length=20, choices=AREAS_DIREITO, blank=True, default="")
    vara = models.CharField(max_length=255, blank=True, default="")
    comarca = models.CharField(max_length=255, blank=True, default="")
    valor_causa = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.01"))],
    )

    # A parte contrária e seu advogado não são um Cliente/Advogado do
    # próprio escritório — são texto livre, já que pertencem à outra parte
    # do processo e não têm login nem qualquer outro vínculo com o sistema.
    nome_parte_contraria = models.CharField(max_length=255, blank=True, default="")
    nome_advogado_adverso = models.CharField(max_length=255, blank=True, default="")
    oab_advogado_adverso = models.CharField(max_length=30, blank=True, default="")

    # Percentual de honorários de sucumbência fixado pelo juízo (CPC art.
    # 85) — não é calculado automaticamente pelo sistema, pois depende de
    # decisão judicial; apenas guarda o percentual já definido para
    # estimar o valor (percentual × valor_causa).
    percentual_honorarios_sucumbencia = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.01"))],
    )

    criado_em = models.DateTimeField(auto_now_add=True)

    # Última consulta bem-sucedida ao DataJud, para a interface mostrar se a
    # informação está fresca.
    datajud_sincronizado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [["escritorio", "numero_processo"]]

    def __str__(self):
        return self.titulo

    @property
    def valor_estimado_honorarios_sucumbencia(self):
        if self.valor_causa is None or self.percentual_honorarios_sucumbencia is None:
            return None
        return (self.valor_causa * self.percentual_honorarios_sucumbencia / Decimal("100")).quantize(Decimal("0.01"))


class Movimentacao(models.Model):

    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name="movimentacoes",
    )

    criado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="movimentacoes_criadas",
    )

    ORIGENS = (
        ("manual", "Lançada no sistema"),
        ("datajud", "Importada do DataJud"),
    )

    descricao = models.TextField()

    # Era auto_now_add, o que impedia gravar a data real de um andamento
    # vindo do tribunal. Com default, o lançamento manual continua caindo
    # em "agora" e a importação preserva a data de origem.
    data_movimentacao = models.DateTimeField(default=timezone.now)

    origem = models.CharField(max_length=10, choices=ORIGENS, default="manual")

    # Chave do movimento no tribunal, para não importar o mesmo andamento
    # duas vezes. Fica vazio nos lançamentos manuais.
    identificador_externo = models.CharField(max_length=120, blank=True, default="")

    class Meta:
        ordering = ["-data_movimentacao"]
        indexes = [models.Index(fields=["processo", "identificador_externo"])]

    def __str__(self):
        return f"Movimentação - {self.processo.titulo}"


class Documento(models.Model):

    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name="documentos",
    )

    nome_arquivo = models.CharField(max_length=255)
    arquivo = models.FileField(
        upload_to="documentos/",
        validators=[
            FileExtensionValidator(["pdf", "jpg", "jpeg", "png", "doc", "docx"]),
            validar_tamanho_documento,
        ],
    )
    enviado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome_arquivo


class Agenda(models.Model):

    TIPOS_EVENTO = (
        ("compromisso", "Compromisso"),
        ("prazo", "Prazo"),
    )

    PRIORIDADES = (
        ("normal", "Normal"),
        ("fatal", "Prazo fatal"),
    )

    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name="eventos_agenda",
    )

    tipo = models.CharField(max_length=20, choices=TIPOS_EVENTO, default="compromisso")
    # Só tem sentido para tipo="prazo": um prazo fatal (peremptório) não
    # admite prorrogação, e perdê-lo pode significar perda de direito —
    # merece destaque visual diferente de um prazo comum.
    prioridade = models.CharField(max_length=10, choices=PRIORIDADES, default="normal")
    titulo = models.CharField(max_length=255)
    descricao = models.TextField()
    data_evento = models.DateTimeField()
    local_evento = models.CharField(max_length=255, blank=True, default="")
    cumprido = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo


class Contrato(models.Model):

    TIPOS_HONORARIO = (
        ("fixo", "Valor fixo"),
        ("exito", "Percentual de êxito"),
        ("hora", "Por hora trabalhada"),
    )

    FORMAS_PAGAMENTO = (
        ("avista", "À vista"),
        ("parcelado", "Parcelado"),
    )

    STATUS_CONTRATO = (
        ("ativo", "Ativo"),
        ("quitado", "Quitado"),
        ("cancelado", "Cancelado"),
    )

    escritorio = models.ForeignKey(
        Escritorio,
        on_delete=models.CASCADE,
        related_name="contratos",
    )

    processo = models.OneToOneField(
        Processo,
        on_delete=models.CASCADE,
        related_name="contrato",
    )

    tipo_honorario = models.CharField(max_length=20, choices=TIPOS_HONORARIO, default="fixo")
    valor_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    forma_pagamento = models.CharField(max_length=20, choices=FORMAS_PAGAMENTO, default="avista")
    numero_parcelas = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )
    status = models.CharField(max_length=20, choices=STATUS_CONTRATO, default="ativo")
    observacoes = models.TextField(blank=True, default="")
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Contrato — {self.processo.numero_processo}"


class Parcela(models.Model):

    STATUS_PARCELA = (
        ("pendente", "Pendente"),
        ("pago", "Pago"),
        ("atrasado", "Atrasado"),
    )

    contrato = models.ForeignKey(
        Contrato,
        on_delete=models.CASCADE,
        related_name="parcelas",
    )

    numero = models.PositiveSmallIntegerField()
    valor = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    data_vencimento = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_PARCELA, default="pendente")
    pago_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["numero"]

    def __str__(self):
        return f"Parcela {self.numero} — {self.contrato}"


class PreferenciasUsuario(models.Model):
    TEMAS = (("light", "Claro"), ("dark", "Escuro"))
    DENSIDADES = (("comfortable", "Confortável"), ("compact", "Compacta"))
    IDIOMAS = (("pt-BR", "Português (Brasil)"), ("en-US", "English (US)"), ("es-ES", "Español"))
    PAGINAS = (("dashboard", "Dashboard"), ("agenda", "Agenda"), ("clientes", "Clientes"), ("processos", "Processos"))

    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name="preferencias")
    tema = models.CharField(max_length=10, choices=TEMAS, default="dark")
    densidade_tabela = models.CharField(max_length=20, choices=DENSIDADES, default="comfortable")
    idioma = models.CharField(max_length=10, choices=IDIOMAS, default="pt-BR")
    pagina_inicial = models.CharField(max_length=30, choices=PAGINAS, default="dashboard")
    notificacao_novo_processo = models.BooleanField(default=True)
    notificacao_novo_documento = models.BooleanField(default=True)
    notificacao_status_processo = models.BooleanField(default=False)
    # Aviso de andamento novo trazido da sincronização com o DataJud.
    notificacao_movimentacao = models.BooleanField(default=True)
    notificacao_novo_cliente = models.BooleanField(default=False)
    lembrete_audiencia = models.BooleanField(default=True)
    antecedencia_audiencia = models.PositiveSmallIntegerField(default=2)
    lembrete_prazo = models.BooleanField(default=True)
    resumo_semanal = models.BooleanField(default=False)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferências de {self.usuario.nome}"


class RegistroAuditoria(models.Model):

    ACOES = (
        ("login_sucesso", "Login realizado"),
        ("login_falha", "Tentativa de login falhou"),
        ("login_bloqueado", "Login bloqueado por tentativas excessivas"),
        ("logout", "Logout realizado"),
        ("criacao", "Registro criado"),
        ("edicao", "Registro editado"),
        ("exclusao", "Registro excluído"),
    )

    escritorio = models.ForeignKey(
        Escritorio,
        on_delete=models.CASCADE,
        related_name="registros_auditoria",
        null=True,
        blank=True,
    )

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        related_name="registros_auditoria",
        null=True,
        blank=True,
    )

    superadmin = models.ForeignKey(
        SuperAdmin,
        on_delete=models.SET_NULL,
        related_name="registros_auditoria",
        null=True,
        blank=True,
    )

    acao = models.CharField(max_length=20, choices=ACOES)
    modelo = models.CharField(max_length=100, blank=True, default="")
    objeto_id = models.PositiveIntegerField(null=True, blank=True)
    descricao = models.CharField(max_length=255, blank=True, default="")
    endereco_ip = models.GenericIPAddressField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Registro de auditoria"
        verbose_name_plural = "Registros de auditoria"
        ordering = ["-criado_em"]

    def __str__(self):
        return f"{self.get_acao_display()} — {self.criado_em:%d/%m/%Y %H:%M}"


class TokenRedefinicaoSenha(models.Model):

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name="tokens_redefinicao_senha",
    )

    token = models.CharField(max_length=64, unique=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    expira_em = models.DateTimeField()
    usado = models.BooleanField(default=False)

    def __str__(self):
        return f"Token de {self.usuario.nome}"


class TokenVerificacaoEmail(models.Model):

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name="tokens_verificacao_email",
    )

    token = models.CharField(max_length=64, unique=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    expira_em = models.DateTimeField()
    usado = models.BooleanField(default=False)

    def __str__(self):
        return f"Token de verificação de {self.usuario.nome}"


class ConfiguracaoEscritorio(models.Model):
    FORMATOS_DATA = (("dmy", "DD/MM/AAAA"), ("mdy", "MM/DD/AAAA"), ("iso", "AAAA-MM-DD"))
    RETENCOES = (("1y", "1 ano"), ("5y", "5 anos"), ("indeterminado", "Por tempo indeterminado"))

    escritorio = models.OneToOneField(Escritorio, on_delete=models.CASCADE, related_name="configuracao")
    timezone = models.CharField(max_length=100, default="America/Sao_Paulo")
    formato_data = models.CharField(max_length=10, choices=FORMATOS_DATA, default="dmy")
    retencao_documentos = models.CharField(max_length=30, choices=RETENCOES, default="indeterminado")
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Configurações de {self.escritorio.nome}"


class NotificacaoEnviada(models.Model):
    """Registro de que um aviso já foi enviado a um usuário.

    Existe para tornar o comando de envio idempotente: se a tarefa agendada
    rodar mais de uma vez no mesmo dia, o mesmo lembrete não é reenviado.
    """

    TIPOS = (
        ("lembrete_evento", "Lembrete de compromisso ou prazo"),
        ("resumo_semanal", "Resumo semanal"),
    )

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name="notificacoes_enviadas",
    )

    tipo = models.CharField(max_length=20, choices=TIPOS)

    # Identifica o que foi avisado — "lembrete_evento:42", "resumo_semanal:2026-W38".
    # É o que garante a idempotência junto com o usuário.
    chave = models.CharField(max_length=120)

    agenda = models.ForeignKey(
        Agenda,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notificacoes_enviadas",
    )

    enviado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Notificação enviada"
        verbose_name_plural = "Notificações enviadas"
        ordering = ["-enviado_em"]
        constraints = [
            models.UniqueConstraint(
                fields=["usuario", "chave"],
                name="notificacao_unica_por_usuario",
            )
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} para {self.usuario.nome}"


class ApontamentoHora(models.Model):
    """Horas trabalhadas em um processo.

    O tempo é guardado em minutos inteiros: honorário por hora costuma ser
    cobrado em frações (0h30, 1h15), e minutos evitam o arredondamento de
    ponto flutuante que apareceria ao guardar horas decimais.
    """

    escritorio = models.ForeignKey(
        Escritorio,
        on_delete=models.CASCADE,
        related_name="apontamentos_hora",
    )

    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name="apontamentos_hora",
    )

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name="apontamentos_hora",
    )

    data = models.DateField()
    minutos = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    descricao = models.CharField(max_length=255)

    # Horas não faturáveis (retrabalho, cortesia) entram no total trabalhado
    # mas ficam de fora do valor a cobrar.
    faturavel = models.BooleanField(default=True)

    valor_hora = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.01"))],
    )

    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Apontamento de hora"
        verbose_name_plural = "Apontamentos de hora"
        ordering = ["-data", "-criado_em"]

    @property
    def horas(self):
        return (Decimal(self.minutos) / Decimal("60")).quantize(Decimal("0.01"))

    @property
    def valor(self):
        """Valor a cobrar por este apontamento, ou None se não houver como calcular."""
        if not self.faturavel or self.valor_hora is None:
            return None
        return (Decimal(self.minutos) * self.valor_hora / Decimal("60")).quantize(Decimal("0.01"))

    def __str__(self):
        return f"{self.horas}h em {self.processo.numero_processo}"


class Despesa(models.Model):
    """Custas e despesas de um processo, reembolsáveis ou não pelo cliente."""

    TIPOS = (
        ("custas", "Custas processuais"),
        ("diligencia", "Diligência"),
        ("copias", "Cópias e autenticações"),
        ("viagem", "Viagem e deslocamento"),
        ("pericia", "Honorários periciais"),
        ("outros", "Outros"),
    )

    escritorio = models.ForeignKey(
        Escritorio,
        on_delete=models.CASCADE,
        related_name="despesas",
    )

    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name="despesas",
    )

    tipo = models.CharField(max_length=20, choices=TIPOS, default="custas")
    descricao = models.CharField(max_length=255)
    valor = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    data = models.DateField()

    # Despesa adiantada pelo escritório e cobrada do cliente depois.
    reembolsavel = models.BooleanField(default=True)
    reembolsada = models.BooleanField(default=False)

    comprovante = models.FileField(
        upload_to="despesas/comprovantes/",
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(["pdf", "jpg", "jpeg", "png"]),
            validar_tamanho_documento,
        ],
    )

    criado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="despesas_lancadas",
    )

    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Despesa"
        verbose_name_plural = "Despesas"
        ordering = ["-data", "-criado_em"]

    def __str__(self):
        return f"{self.get_tipo_display()} — {self.processo.numero_processo}"


# Intervalo máximo entre dois sinais de atividade para que ainda sejam
# considerados a mesma sessão. Maior que isso, presume-se que o usuário
# fechou o sistema e voltou depois.
JANELA_SESSAO_MINUTOS = 10


class SessaoUso(models.Model):
    """Janela de tempo em que o usuário esteve com o sistema aberto.

    Medida por sinais periódicos enviados pelo front enquanto a aba está
    visível. Mede tempo de uso do sistema — não é o mesmo que tempo
    trabalhado em um processo, que é o que ApontamentoHora registra.
    """

    escritorio = models.ForeignKey(
        Escritorio,
        on_delete=models.CASCADE,
        related_name="sessoes_uso",
    )

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name="sessoes_uso",
    )

    inicio = models.DateTimeField()
    ultima_atividade = models.DateTimeField()

    class Meta:
        verbose_name = "Sessão de uso"
        verbose_name_plural = "Sessões de uso"
        ordering = ["-inicio"]
        indexes = [models.Index(fields=["usuario", "inicio"])]

    @property
    def duracao_minutos(self):
        return int((self.ultima_atividade - self.inicio).total_seconds() // 60)

    def __str__(self):
        return f"{self.usuario.nome} — {self.duracao_minutos} min"


class ModeloDocumento(models.Model):
    """Modelo de documento do escritório, com variáveis a preencher.

    O conteúdo é escrito pelo próprio escritório e tratado como dado: as
    variáveis são resolvidas por um catálogo fechado em modelos_documento.py,
    nunca por um motor de templates.
    """

    TIPOS = (
        ("procuracao", "Procuração"),
        ("contrato", "Contrato de honorários"),
        ("declaracao", "Declaração"),
        ("peticao", "Petição"),
        ("outros", "Outros"),
    )

    escritorio = models.ForeignKey(
        Escritorio,
        on_delete=models.CASCADE,
        related_name="modelos_documento",
    )

    nome = models.CharField(max_length=120)
    tipo = models.CharField(max_length=20, choices=TIPOS, default="outros")
    conteudo = models.TextField()
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Modelo de documento"
        verbose_name_plural = "Modelos de documento"
        ordering = ["nome"]
        unique_together = [["escritorio", "nome"]]

    def __str__(self):
        return self.nome
