from django.contrib import admin
from .models import Cliente


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'documento', 'email', 'telefone', 'dataCadastro')
    search_fields = ('nome', 'documento', 'email')
    list_filter = ('dataCadastro',)