"""Utilitários compartilhados pelas views (filtros da query string, download)."""

from datetime import date

from django.http import FileResponse, Http404
from rest_framework.exceptions import ValidationError

# =========================================================
# RENOVAÇÃO DE TOKEN
# =========================================================

def _data_do_filtro(params, nome):
    """Lê um parâmetro de data da query string, recusando lixo com 400.

    Sem isso, a data malformada chegava ao ORM e virava uma exceção não
    tratada — ou seja, erro 500 para um erro do cliente.
    """

    valor = params.get(nome)
    if not valor:
        return None
    try:
        return date.fromisoformat(valor)
    except ValueError:
        raise ValidationError({nome: ["Informe uma data no formato AAAA-MM-DD."]})


def _id_do_filtro(params, nome):
    """Lê um parâmetro de identificador, recusando o que não for número."""

    valor = params.get(nome)
    if not valor:
        return None
    try:
        return int(valor)
    except (TypeError, ValueError):
        raise ValidationError({nome: ["Informe um identificador numérico."]})


# =========================================================
# DOCUMENTOS
# =========================================================

def _resposta_download_arquivo(arquivo, nome_sugerido=None):
    """Serve um FileField como download, para as rotas autenticadas de
    documento/identidade — nunca a partir da URL direta do arquivo, que
    não confere quem está pedindo nem a que escritório pertence."""
    if not arquivo:
        raise Http404("Arquivo não encontrado.")
    nome = nome_sugerido or arquivo.name.rsplit("/", 1)[-1]
    return FileResponse(arquivo.open("rb"), as_attachment=True, filename=nome)
