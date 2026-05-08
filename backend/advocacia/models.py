from django.db import models


class Cliente(models.Model):
    nome = models.CharField(max_length=100)
    documento = models.CharField(max_length=20)
    email = models.EmailField(max_length=100)
    telefone = models.CharField(max_length=20)
    endereco = models.CharField(max_length=200)
    dataCadastro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome