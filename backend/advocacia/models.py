from django.db import models


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
    foto = models.ImageField(upload_to="usuarios/fotos/", null=True, blank=True)
    documento_identidade = models.FileField(upload_to="usuarios/documentos/", null=True, blank=True)
    cpf = models.CharField(max_length=14, blank=True, default="")
    rg = models.CharField(max_length=20, blank=True, default="")
    data_nascimento = models.DateField(null=True, blank=True)
    estado_civil = models.CharField(max_length=20, choices=ESTADOS_CIVIS, blank=True, default="")
    nacionalidade = models.CharField(max_length=100, blank=True, default="Brasileira")
    ativo = models.BooleanField(default=True)
    tentativas_login = models.PositiveSmallIntegerField(default=0)
    bloqueado_ate = models.DateTimeField(null=True, blank=True)
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
    foto = models.ImageField(upload_to="clientes/fotos/", null=True, blank=True)
    documento_identidade = models.FileField(upload_to="clientes/documentos/", null=True, blank=True)
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
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["escritorio", "numero_processo"]]

    def __str__(self):
        return self.titulo


class Movimentacao(models.Model):

    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name="movimentacoes",
    )

    descricao = models.TextField()
    data_movimentacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Movimentação - {self.processo.titulo}"


class Documento(models.Model):

    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name="documentos",
    )

    nome_arquivo = models.CharField(max_length=255)
    arquivo = models.FileField(upload_to="documentos/")
    enviado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome_arquivo


class Agenda(models.Model):

    TIPOS_EVENTO = (
        ("compromisso", "Compromisso"),
        ("prazo", "Prazo"),
    )

    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name="eventos_agenda",
    )

    tipo = models.CharField(max_length=20, choices=TIPOS_EVENTO, default="compromisso")
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
    valor_total = models.DecimalField(max_digits=12, decimal_places=2)
    forma_pagamento = models.CharField(max_length=20, choices=FORMAS_PAGAMENTO, default="avista")
    numero_parcelas = models.PositiveSmallIntegerField(default=1)
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
    valor = models.DecimalField(max_digits=12, decimal_places=2)
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
    notificacao_novo_cliente = models.BooleanField(default=False)
    lembrete_audiencia = models.BooleanField(default=True)
    antecedencia_audiencia = models.PositiveSmallIntegerField(default=2)
    lembrete_prazo = models.BooleanField(default=True)
    resumo_semanal = models.BooleanField(default=False)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferências de {self.usuario.nome}"


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
