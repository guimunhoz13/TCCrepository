"""Notícias do mundo jurídico e criminal, via feeds RSS do Google News."""

import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

from django.core.cache import cache
from django.utils.html import strip_tags

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

CACHE_KEY = "noticias_juridicas"
CACHE_TTL_SEGUNDOS = 1800

CATEGORIAS = [
    {
        "id": "juridico",
        "nome": "Mundo Jurídico",
        "busca": "direito OR judiciário OR STF OR STJ OR tribunal OR advocacia",
    },
    {
        "id": "criminal",
        "nome": "Mundo Criminal",
        "busca": "crime OR polícia OR investigação criminal OR justiça criminal",
    },
]

ITENS_POR_CATEGORIA = 8
TIMEOUT_SEGUNDOS = 8


def _buscar_itens_categoria(busca):
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode(
        {"q": busca, "hl": "pt-BR", "gl": "BR", "ceid": "BR:pt-419"}
    )
    requisicao = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(requisicao, timeout=TIMEOUT_SEGUNDOS) as resposta:
        conteudo = resposta.read()

    raiz = ET.fromstring(conteudo)
    itens = []
    for item in raiz.findall("./channel/item")[:ITENS_POR_CATEGORIA]:
        titulo = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if not titulo or not link:
            continue
        fonte_el = item.find("source")
        fonte = fonte_el.text.strip() if fonte_el is not None and fonte_el.text else ""
        itens.append(
            {
                "titulo": titulo,
                "link": link,
                "fonte": fonte,
                "publicado_em": (item.findtext("pubDate") or "").strip(),
                "resumo": strip_tags(item.findtext("description") or "").strip(),
            }
        )
    return itens


def _buscar_noticias():
    noticias = []
    houve_falha = False
    for categoria in CATEGORIAS:
        try:
            itens = _buscar_itens_categoria(categoria["busca"])
        except (urllib.error.URLError, ET.ParseError, TimeoutError):
            houve_falha = True
            continue
        for item in itens:
            item["categoria"] = categoria["nome"]
            item["categoria_id"] = categoria["id"]
            noticias.append(item)
    return noticias, houve_falha


class NoticiasJuridicasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        noticias = cache.get(CACHE_KEY)
        if noticias is not None:
            return Response({"noticias": noticias})

        noticias, houve_falha = _buscar_noticias()
        if noticias:
            cache.set(CACHE_KEY, noticias, CACHE_TTL_SEGUNDOS)

        aviso = (
            "Algumas fontes de notícias não puderam ser carregadas no momento."
            if houve_falha
            else None
        )
        return Response({"noticias": noticias, "aviso": aviso})
