"""Consulta à API Pública do DataJud (CNJ).

O DataJud é a Base Nacional de Dados do Poder Judiciário (Resolução CNJ
331/2020). A API pública expõe a capa e as movimentações dos processos de
praticamente todos os tribunais, autenticada por uma chave pública que o
próprio CNJ divulga.

Limites conhecidos, que o usuário precisa entender:
  - traz metadados e movimentações, não o texto das publicações do diário
    oficial — capturar intimação do DJE exige outra fonte;
  - a cobertura e a defasagem variam por tribunal.

A chave vai em DATAJUD_API_KEY. Sem ela, a consulta é recusada com uma
mensagem explicando o que configurar, em vez de falhar como erro genérico.
"""

import json
import logging
import re
import urllib.error
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)

# Configurável para não amarrar o código a um endereço que o CNJ pode mudar,
# e para permitir apontar a um servidor de teste durante a verificação.
URL_PADRAO = "https://api-publica.datajud.cnj.jus.br"
TEMPO_LIMITE = 20

# Segmento do Judiciário (dígito "J" da numeração unificada do CNJ).
SEGMENTO_ESTADUAL = "8"
SEGMENTO_TRABALHO = "5"
SEGMENTO_FEDERAL = "4"

# Para a Justiça Estadual, o campo "TR" identifica o estado.
UF_POR_CODIGO_TRIBUNAL = {
    "01": "ac", "02": "al", "03": "ap", "04": "am", "05": "ba",
    "06": "ce", "07": "df", "08": "es", "09": "go", "10": "ma",
    "11": "mt", "12": "ms", "13": "mg", "14": "pa", "15": "pb",
    "16": "pr", "17": "pe", "18": "pi", "19": "rj", "20": "rn",
    "21": "rs", "22": "ro", "23": "rr", "24": "sc", "25": "se",
    "26": "sp", "27": "to",
}


class ErroDataJud(Exception):
    """Falha ao consultar o DataJud, com mensagem pronta para o usuário."""


def apenas_digitos(numero):
    return re.sub(r"\D", "", numero or "")


def partes_do_numero(numero):
    """Quebra o número unificado (NNNNNNN-DD.AAAA.J.TR.OOOO) em suas partes.

    Levanta ErroDataJud se não tiver os 20 dígitos previstos na Resolução
    CNJ 65/2008.
    """

    digitos = apenas_digitos(numero)

    if len(digitos) != 20:
        raise ErroDataJud(
            "O número do processo precisa ter 20 dígitos no padrão do CNJ "
            "(NNNNNNN-DD.AAAA.J.TR.OOOO)."
        )

    return {
        "sequencial": digitos[0:7],
        "digito": digitos[7:9],
        "ano": digitos[9:13],
        "segmento": digitos[13:14],
        "tribunal": digitos[14:16],
        "origem": digitos[16:20],
        "digitos": digitos,
    }


def alias_do_tribunal(numero):
    """Descobre o alias do tribunal usado na URL da API a partir do número.

    Exemplos: ...8.26.... -> api_publica_tjsp; ...5.15.... -> api_publica_trt15.
    """

    partes = partes_do_numero(numero)
    segmento = partes["segmento"]
    tribunal = partes["tribunal"]

    if segmento == SEGMENTO_ESTADUAL:
        uf = UF_POR_CODIGO_TRIBUNAL.get(tribunal)
        if not uf:
            raise ErroDataJud(
                f"Não reconheci o tribunal estadual de código {tribunal} "
                "no número informado."
            )
        return f"api_publica_tj{uf}"

    if segmento == SEGMENTO_TRABALHO:
        return f"api_publica_trt{int(tribunal)}"

    if segmento == SEGMENTO_FEDERAL:
        return f"api_publica_trf{int(tribunal)}"

    raise ErroDataJud(
        "A consulta automática cobre por enquanto as Justiças Estadual, "
        "do Trabalho e Federal. O número informado é de outro segmento."
    )


def _chamar_api(url, corpo, chave):
    """Ponto único de saída para a rede — é o que os testes substituem."""

    requisicao = urllib.request.Request(
        url,
        data=json.dumps(corpo).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"APIKey {chave}",
        },
        method="POST",
    )

    with urllib.request.urlopen(requisicao, timeout=TEMPO_LIMITE) as resposta:
        return json.loads(resposta.read().decode("utf-8"))


def _primeiro(dado, *chaves, padrao=""):
    """Lê a primeira chave presente — o retorno do DataJud varia entre
    tribunais, e um campo ausente não deve derrubar a consulta."""

    for chave in chaves:
        valor = dado.get(chave)
        if valor not in (None, "", []):
            return valor
    return padrao


def interpretar_resposta(dados):
    """Extrai capa e movimentações do JSON devolvido pela API.

    Escrito de forma tolerante de propósito: o formato varia entre
    tribunais e o objetivo é nunca quebrar por um campo que faltou.
    """

    acertos = (dados or {}).get("hits", {}).get("hits", [])

    if not acertos:
        return None

    fonte = acertos[0].get("_source", {}) or {}

    orgao = fonte.get("orgaoJulgador") or {}
    classe = fonte.get("classe") or {}

    movimentos = []
    for movimento in fonte.get("movimentos") or []:
        if not isinstance(movimento, dict):
            continue
        movimentos.append({
            "codigo": movimento.get("codigo"),
            "descricao": _primeiro(movimento, "nome", "descricao", padrao="Movimentação"),
            "data_hora": _primeiro(movimento, "dataHora", "data_hora", padrao=""),
        })

    return {
        "numero_processo": _primeiro(fonte, "numeroProcesso"),
        "classe": classe.get("nome", "") if isinstance(classe, dict) else "",
        "orgao_julgador": orgao.get("nome", "") if isinstance(orgao, dict) else "",
        "tribunal": _primeiro(fonte, "tribunal"),
        "grau": _primeiro(fonte, "grau"),
        "data_ajuizamento": _primeiro(fonte, "dataAjuizamento"),
        "ultima_atualizacao": _primeiro(fonte, "dataHoraUltimaAtualizacao"),
        "movimentos": movimentos,
    }


def consultar_processo(numero):
    """Consulta um processo pelo número unificado e devolve capa e movimentos.

    Retorna None quando o tribunal não tem o processo na base.
    """

    chave = getattr(settings, "DATAJUD_API_KEY", "")

    if not chave:
        raise ErroDataJud(
            "A consulta ao DataJud não está configurada. Defina DATAJUD_API_KEY "
            "com a chave pública divulgada pelo CNJ."
        )

    alias = alias_do_tribunal(numero)
    digitos = apenas_digitos(numero)
    base = getattr(settings, "DATAJUD_URL_BASE", "") or URL_PADRAO
    url = f"{base}/{alias}/_search"

    try:
        dados = _chamar_api(url, {"query": {"match": {"numeroProcesso": digitos}}}, chave)
    except urllib.error.HTTPError as erro:
        logger.warning("DataJud respondeu %s para %s", erro.code, digitos)
        if erro.code in (401, 403):
            raise ErroDataJud(
                "O DataJud recusou a chave de acesso. Confira se DATAJUD_API_KEY "
                "está com a chave pública vigente do CNJ."
            ) from erro
        raise ErroDataJud(
            f"O DataJud respondeu com erro {erro.code}. Tente novamente mais tarde."
        ) from erro
    except urllib.error.URLError as erro:
        logger.warning("Falha de rede ao consultar o DataJud: %s", erro)
        raise ErroDataJud(
            "Não foi possível alcançar o DataJud. Verifique a conexão da rede."
        ) from erro
    except json.JSONDecodeError as erro:
        raise ErroDataJud("O DataJud devolveu uma resposta ilegível.") from erro

    return interpretar_resposta(dados)


def _para_datetime(texto):
    """Converte a data/hora do DataJud, tolerando as variações de formato."""

    from django.utils.dateparse import parse_datetime

    if not texto:
        return None

    valor = parse_datetime(texto)

    if valor is None:
        return None

    from django.utils import timezone as tz

    return tz.make_aware(valor) if tz.is_naive(valor) else valor


def importar_movimentacoes(processo, movimentos):
    """Grava no processo os andamentos que ainda não existem.

    A chave de identidade é o código do movimento junto com a data/hora,
    porque o mesmo código se repete ao longo do processo (uma conclusão,
    por exemplo, acontece várias vezes).

    Devolve (importadas, ignoradas).
    """

    from .models import Movimentacao

    importadas = 0
    ignoradas = 0

    existentes = set(
        Movimentacao.objects.filter(processo=processo, origem="datajud")
        .exclude(identificador_externo="")
        .values_list("identificador_externo", flat=True)
    )

    for movimento in movimentos:
        data = _para_datetime(movimento.get("data_hora"))
        identificador = f"{movimento.get('codigo') or 's/c'}:{movimento.get('data_hora') or ''}"

        if not data or identificador in existentes:
            ignoradas += 1
            continue

        Movimentacao.objects.create(
            processo=processo,
            descricao=movimento.get("descricao") or "Movimentação",
            data_movimentacao=data,
            origem="datajud",
            identificador_externo=identificador,
        )
        existentes.add(identificador)
        importadas += 1

    return importadas, ignoradas
