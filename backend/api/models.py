from django.db import models


class Cliente(models.Model):

    nome = models.CharField(max_length=100)

    cpf = models.CharField(
        max_length=14,
        unique=True
    )

    email = models.EmailField(
        unique=True
    )

    telefone = models.CharField(
        max_length=20
    )

    endereco = models.CharField(
        max_length=200
    )

    data_cadastro = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.nome