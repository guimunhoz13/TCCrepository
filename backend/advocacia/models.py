from django.db import models


# USUÁRIOS INTERNOS
# Somente administradores e advogados acessam o sistema.

class Usuario(models.Model):

    TIPOS_USUARIO = (
        ('admin', 'Administrador'),
        ('advogado', 'Advogado'),
    )

    nome = models.CharField(
        max_length=255
    )

    email = models.EmailField(
        unique=True
    )

    senha = models.CharField(
        max_length=255
    )

    tipo_usuario = models.CharField(
        max_length=20,
        choices=TIPOS_USUARIO
    )

    ativo = models.BooleanField(
        default=True
    )

    criado_em = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.nome


# CLIENTES
# Clientes são apenas cadastrados internamente.
# Eles não possuem login nem acesso ao sistema.

class Cliente(models.Model):

    nome = models.CharField(
        max_length=255
    )

    cpf = models.CharField(
        max_length=14,
        unique=True
    )

    email = models.EmailField()

    telefone = models.CharField(
        max_length=20
    )

    endereco = models.CharField(
        max_length=255
    )

    data_nascimento = models.DateField(
        null=True,
        blank=True
    )

    ativo = models.BooleanField(
        default=True
    )

    criado_em = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.nome


# ADVOGADOS
# O advogado possui um usuário porque acessará o sistema.

class Advogado(models.Model):

    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='advogado'
    )

    oab = models.CharField(
        max_length=30,
        unique=True
    )

    especialidade = models.CharField(
        max_length=255
    )

    def __str__(self):
        return self.usuario.nome


# PROCESSOS

class Processo(models.Model):

    STATUS_PROCESSO = (
        ('Em andamento', 'Em andamento'),
        ('Concluido', 'Concluído'),
        ('Suspenso', 'Suspenso'),
        ('Arquivado', 'Arquivado'),
    )

    numero_processo = models.CharField(
        max_length=100,
        unique=True
    )

    titulo = models.CharField(
        max_length=255
    )

    descricao = models.TextField()

    status = models.CharField(
        max_length=50,
        choices=STATUS_PROCESSO,
        default='Em andamento'
    )

    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='processos'
    )

    advogado = models.ForeignKey(
        Advogado,
        on_delete=models.CASCADE,
        related_name='processos'
    )

    data_inicio = models.DateField(
        null=True,
        blank=True
    )

    data_fim = models.DateField(
        null=True,
        blank=True
    )

    criado_em = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.titulo


# MOVIMENTAÇÕES

class Movimentacao(models.Model):

    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name='movimentacoes'
    )

    descricao = models.TextField()

    data_movimentacao = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f'Movimentação - {self.processo.titulo}'


# DOCUMENTOS

class Documento(models.Model):

    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name='documentos'
    )

    nome_arquivo = models.CharField(
        max_length=255
    )

    arquivo = models.FileField(
        upload_to='documentos/'
    )

    enviado_em = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.nome_arquivo


# AGENDA

class Agenda(models.Model):

    processo = models.ForeignKey(
        Processo,
        on_delete=models.CASCADE,
        related_name='eventos_agenda'
    )

    titulo = models.CharField(
        max_length=255
    )

    descricao = models.TextField()

    data_evento = models.DateTimeField()

    local_evento = models.CharField(
        max_length=255
    )

    criado_em = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.titulo