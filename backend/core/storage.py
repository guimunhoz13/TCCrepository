"""Armazenamento privado; fotos continuam passando pela API autenticada."""

from io import BytesIO
from pathlib import PurePosixPath
from uuid import uuid4

from django.apps import apps
from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.core.exceptions import ValidationError
from django.urls import reverse
from django.utils.functional import cached_property
from django.utils.module_loading import import_string
from PIL import Image, ImageOps, UnidentifiedImageError
from storages.backends.s3 import S3Storage


class PrivateMediaStorage(S3Storage):
    def url(self, name, parameters=None, expire=None, http_method=None):
        # FieldFile.url é usado nas fotos. Uma URL assinada do bucket permitiria
        # acesso sem passar pela verificação de usuário/escritório da API.
        return reverse('foto-protegida', kwargs={'arquivo': name})


class PersistentPhotoStorage(Storage):
    """Fotos no PostgreSQL; documentos conservam o armazenamento já configurado.

    O endpoint autenticado continua checando o escritório. URLs antigas ainda
    leem do armazenamento anterior, sem mover ou apagar arquivos existentes.
    """
    def __init__(self, file_storage_backend, file_storage_options=None):
        self.file_storage_backend = file_storage_backend
        self.file_storage_options = file_storage_options or {}

    @cached_property
    def arquivos(self):
        return import_string(self.file_storage_backend)(**self.file_storage_options)

    @staticmethod
    def _foto(name):
        return name.startswith(("usuarios/fotos/", "clientes/fotos/"))

    @staticmethod
    def _modelo():
        return apps.get_model("advocacia", "FotoPersistente")

    def get_available_name(self, name, max_length=None):
        if self._foto(name):
            return str(PurePosixPath(name).parent / f"{uuid4().hex}.webp")
        return self.arquivos.get_available_name(name, max_length=max_length)

    def _save(self, name, content):
        if not self._foto(name):
            return self.arquivos.save(name, content)
        try:
            content.seek(0)
            with Image.open(content) as imagem:
                if imagem.width * imagem.height > 20_000_000:
                    raise ValidationError("Escolha uma imagem com até 20 megapixels.")
                imagem = ImageOps.exif_transpose(imagem)
                imagem.thumbnail((512, 512))
                imagem = imagem.convert("RGBA" if "A" in imagem.getbands() else "RGB")
                saida = BytesIO()
                imagem.save(saida, format="WEBP", quality=85)
            self._modelo().objects.create(nome=name, conteudo=saida.getvalue())
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
            raise ValidationError("Escolha uma imagem JPG, PNG ou WebP válida.") from exc
        return name

    def _open(self, name, mode="rb"):
        if self._foto(name):
            foto = self._modelo().objects.filter(pk=name).first()
            if foto is not None:
                return ContentFile(bytes(foto.conteudo), name=name)
        return self.arquivos.open(name, mode)

    def exists(self, name):
        return (self._foto(name) and self._modelo().objects.filter(pk=name).exists()) or self.arquivos.exists(name)

    def size(self, name):
        if self._foto(name):
            foto = self._modelo().objects.filter(pk=name).first()
            if foto is not None:
                return len(foto.conteudo)
        return self.arquivos.size(name)

    def delete(self, name):
        if self._foto(name) and self._modelo().objects.filter(pk=name).delete()[0]:
            return
        self.arquivos.delete(name)

    def url(self, name):
        if self._foto(name):
            return reverse('foto-protegida', kwargs={'arquivo': name})
        return self.arquivos.url(name)

    def path(self, name):
        if self._foto(name):
            raise NotImplementedError("Fotos persistentes não possuem caminho no disco local.")
        return self.arquivos.path(name)
