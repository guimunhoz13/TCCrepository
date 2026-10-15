"""Armazenamento privado; fotos continuam passando pela API autenticada."""

from django.urls import reverse
from storages.backends.s3 import S3Storage


class PrivateMediaStorage(S3Storage):
    def url(self, name, parameters=None, expire=None, http_method=None):
        # FieldFile.url é usado nas fotos. Uma URL assinada do bucket permitiria
        # acesso sem passar pela verificação de usuário/escritório da API.
        return reverse('foto-protegida', kwargs={'arquivo': name})
