"""Ajustes da documentação OpenAPI (drf-spectacular) ao jeito do projeto.

1. A autenticação do sistema (AutenticacaoContaAtiva) é um JWT Bearer com
   uma checagem extra de conta ativa; o drf-spectacular não a reconhece
   sozinho e deixaria as rotas sem o cadeado de "Authorize".
2. Várias rotas são APIViews simples, sem serializer (dashboard,
   relatórios, configurações). Sem ajuda, o gerador as tira da
   documentação; aqui elas entram com corpo e resposta em JSON genérico,
   e as mais importantes ganham descrição detalhada nas próprias views.
"""

from drf_spectacular.extensions import OpenApiAuthenticationExtension
from drf_spectacular.openapi import AutoSchema
from drf_spectacular.types import OpenApiTypes
from rest_framework.generics import GenericAPIView


class EsquemaJWTContaAtiva(OpenApiAuthenticationExtension):
    target_class = "advocacia.autenticacao.AutenticacaoContaAtiva"
    name = "jwtAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Token `access` devolvido por POST /api/login/.",
        }


class EsquemaLexOffice(AutoSchema):

    def _sem_serializer(self):
        return not isinstance(self.view, GenericAPIView) and not hasattr(self.view, "serializer_class")

    def get_request_serializer(self):
        if self._sem_serializer():
            return OpenApiTypes.OBJECT if self.method in ("POST", "PUT", "PATCH") else None
        return super().get_request_serializer()

    def get_response_serializers(self):
        if self._sem_serializer():
            return OpenApiTypes.OBJECT
        return super().get_response_serializers()
