"""As operações JSON atuais recebem objetos, sem operações em lote."""
from rest_framework.exceptions import ParseError
from rest_framework.parsers import JSONParser


class ObjetoJSONParser(JSONParser):
    def parse(self, stream, media_type=None, parser_context=None):
        dados = super().parse(stream, media_type, parser_context)
        if not isinstance(dados, dict):
            raise ParseError("Envie um objeto JSON com os campos da operação.")
        return dados
