"""Intimações do Diário de Justiça Eletrônico Nacional (DJEN).

O DJEN (Resolução CNJ 455/2022) reúne as comunicações processuais de
todos os tribunais e tem consulta pública por número de OAB, pela API do
Comunica PJe. Aqui o sistema:

  1. busca as comunicações publicadas em nome de cada advogado do
     escritório;
  2. liga cada uma ao processo cadastrado, pelo número unificado;
  3. lê o prazo no texto ("no prazo de 15 dias") e calcula o vencimento
     contando da publicação, em dias úteis forenses;
  4. lança o prazo na agenda, para entrar nos lembretes e no calendário.

O cálculo é uma ajuda, não substitui a conferência do advogado: o texto
pode ter prazos diferentes para partes diferentes, e só entram na conta os
feriados locais que o escritório cadastrou. Por isso a tela mostra o texto inteiro ao lado do prazo.
"""

import json
import logging
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, time, timedelta

from django.conf import settings
from django.utils import timezone

from .datajud import apenas_digitos
from .feriados import FeriadosLocais, prazo_de_publicacao

logger = logging.getLogger(__name__)

URL_PADRAO = "https://comunicaapi.pje.jus.br/api/v1/comunicacao"
TEMPO_LIMITE = 20
ITENS_POR_PAGINA = 100
MAXIMO_PAGINAS = 5
DIAS_PARA_TRAS = 7

# Sem prazo no texto, vale o do CPC, art. 218, § 3º.
PRAZO_PADRAO_DIAS = 5

UFS = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
    "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
}

NUMEROS_POR_EXTENSO = {
    "um": 1, "dois": 2, "tres": 3, "três": 3, "cinco": 5, "dez": 10, "quinze": 15,
    "vinte": 20, "trinta": 30, "quarenta e cinco": 45, "sessenta": 60, "noventa": 90,
}

_PRAZO_NUMERICO = re.compile(
    r"prazo\s+(?:legal\s+|comum\s+|sucessivo\s+)?(?:de\s+)?(\d{1,3})\s*(?:\([^)]*\)\s*)?"
    r"dias?(\s+(?:úteis|uteis|corridos))?",
    re.IGNORECASE,
)
_PRAZO_EXTENSO = re.compile(
    r"prazo\s+(?:legal\s+|comum\s+|sucessivo\s+)?(?:de\s+)?("
    + "|".join(sorted(NUMEROS_POR_EXTENSO, key=len, reverse=True))
    + r")\s+dias?(\s+(?:úteis|uteis|corridos))?",
    re.IGNORECASE,
)


class ErroDJEN(Exception):
    """Falha ao consultar o DJEN, com mensagem pronta para o usuário."""


def separar_oab(oab):
    """'123456/SP', 'SP 123.456' ou 'OAB/SP 123456' → ('123456', 'SP').

    Devolve None quando não dá para saber o número e a seccional — a
    consulta ao DJEN exige os dois.
    """
    texto = (oab or "").upper()
    numero = apenas_digitos(texto)
    uf = next((sigla for sigla in re.findall(r"[A-Z]{2}", texto) if sigla in UFS), None)
    if not numero or not uf:
        return None
    return numero.lstrip("0") or numero, uf


def detectar_prazo(texto):
    """(dias, em_dias_uteis) lido do texto, ou None se não houver prazo."""
    for padrao, extenso in ((_PRAZO_NUMERICO, False), (_PRAZO_EXTENSO, True)):
        achado = padrao.search(texto or "")
        if achado:
            valor = achado.group(1).lower()
            dias = NUMEROS_POR_EXTENSO[valor] if extenso else int(valor)
            if not 0 < dias <= 365:
                continue
            corridos = "corrido" in (achado.group(2) or "").lower()
            return dias, not corridos
    return None


def _chamar_api(parametros):
    """Ponto único de saída para a rede — é o que os testes substituem."""
    url = f"{getattr(settings, 'DJEN_API_URL', '') or URL_PADRAO}?{urllib.parse.urlencode(parametros)}"
    requisicao = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(requisicao, timeout=TEMPO_LIMITE) as resposta:
        return json.loads(resposta.read().decode("utf-8"))


def _primeiro(dado, *chaves):
    for chave in chaves:
        valor = dado.get(chave)
        if valor not in (None, "", []):
            return valor
    return ""


def _data(valor):
    if not valor:
        return None
    try:
        return date.fromisoformat(str(valor)[:10])
    except ValueError:
        try:
            return datetime.strptime(str(valor)[:10], "%d/%m/%Y").date()
        except ValueError:
            return None


def interpretar_item(item):
    """Normaliza uma comunicação do DJEN; None se faltar o essencial."""
    identificador = str(_primeiro(item, "id", "hash", "idComunicacao"))
    disponibilizacao = _data(_primeiro(item, "data_disponibilizacao", "dataDisponibilizacao", "datadisponibilizacao"))
    if not identificador or not disponibilizacao:
        return None
    numero = str(_primeiro(item, "numeroprocessocommascara", "numeroProcessoComMascara", "numero_processo", "numeroProcesso"))
    texto = re.sub(r"<[^>]+>", " ", str(_primeiro(item, "texto", "conteudo")))
    return {
        "identificador_externo": identificador[:120],
        "numero_processo": numero[:30],
        "tribunal": str(_primeiro(item, "siglaTribunal", "sigla_tribunal", "tribunal"))[:20],
        "orgao": str(_primeiro(item, "nomeOrgao", "nome_orgao", "orgao"))[:255],
        "tipo_comunicacao": str(_primeiro(item, "tipoComunicacao", "tipo_comunicacao") or "Comunicação")[:100],
        "texto": re.sub(r"\s+", " ", texto).strip(),
        "link": str(_primeiro(item, "link", "url"))[:500],
        "data_disponibilizacao": disponibilizacao,
    }


def buscar_comunicacoes(numero_oab, uf_oab, inicio, fim):
    """Comunicações publicadas para a OAB entre `inicio` e `fim`."""
    itens = []
    for pagina in range(1, MAXIMO_PAGINAS + 1):
        try:
            dados = _chamar_api({
                "numeroOab": numero_oab,
                "ufOab": uf_oab,
                "dataDisponibilizacaoInicio": inicio.isoformat(),
                "dataDisponibilizacaoFim": fim.isoformat(),
                "itensPorPagina": ITENS_POR_PAGINA,
                "pagina": pagina,
            })
        except urllib.error.HTTPError as erro:
            logger.warning("DJEN respondeu %s para OAB %s/%s", erro.code, numero_oab, uf_oab)
            raise ErroDJEN(f"O DJEN recusou a consulta (HTTP {erro.code}). Tente mais tarde.") from erro
        except (urllib.error.URLError, TimeoutError, OSError, ValueError) as erro:
            logger.warning("DJEN indisponível: %s", erro)
            raise ErroDJEN("Não foi possível falar com o DJEN agora. Tente mais tarde.") from erro

        lote = (dados.get("items") or dados.get("itens") or []) if isinstance(dados, dict) else []
        itens.extend(lote)
        if len(lote) < ITENS_POR_PAGINA:
            break
    return [normalizado for normalizado in map(interpretar_item, itens) if normalizado]


def _lancar_prazo_na_agenda(intimacao):
    from .models import Agenda

    rotulo = "Prazo estimado" if intimacao.prazo_estimado else "Prazo"
    vencimento = timezone.make_aware(datetime.combine(intimacao.prazo_final, time(18, 0)))
    return Agenda.objects.create(
        escritorio=intimacao.escritorio,
        processo=intimacao.processo,
        tipo="prazo",
        titulo=f"{rotulo}: {intimacao.tipo_comunicacao} — {intimacao.numero_processo}"[:255],
        descricao=(
            f"Intimação publicada no DJEN em {intimacao.data_publicacao:%d/%m/%Y} "
            f"({intimacao.tribunal} — {intimacao.orgao}). "
            f"{intimacao.prazo_dias} dias {'úteis' if intimacao.prazo_dias_uteis else 'corridos'}"
            f"{' (prazo não encontrado no texto: confira)' if intimacao.prazo_estimado else ''}.\n\n"
            f"{intimacao.texto[:1500]}"
        ),
        data_evento=vencimento,
    )


def registrar_intimacao(escritorio, advogado, dados):
    """Grava a comunicação (se nova), liga ao processo e lança o prazo.

    Devolve a Intimacao criada, ou None se ela já existia.
    """
    from .models import Intimacao, Processo

    if Intimacao.objects.filter(
        escritorio=escritorio, identificador_externo=dados["identificador_externo"]
    ).exists():
        return None

    digitos = apenas_digitos(dados["numero_processo"])
    processo = None
    if len(digitos) == 20:
        processo = next(
            (
                p for p in Processo.objects.filter(escritorio=escritorio, numero_processo__contains=digitos[-4:])
                if apenas_digitos(p.numero_processo) == digitos
            ),
            None,
        )

    prazo = detectar_prazo(dados["texto"])
    estimado = prazo is None
    dias, uteis = prazo or (PRAZO_PADRAO_DIAS, True)
    publicacao, final = prazo_de_publicacao(
        dados["data_disponibilizacao"], dias, uteis,
        locais=FeriadosLocais.do_escritorio(
            escritorio, comarca=processo.comarca if processo else "", tribunal=dados["tribunal"]
        ),
    )

    intimacao = Intimacao.objects.create(
        escritorio=escritorio,
        advogado=advogado,
        processo=processo,
        data_publicacao=publicacao,
        prazo_dias=dias,
        prazo_dias_uteis=uteis,
        prazo_estimado=estimado,
        prazo_final=final,
        **dados,
    )
    intimacao.evento_agenda = _lancar_prazo_na_agenda(intimacao)
    intimacao.save(update_fields=["evento_agenda"])

    from .push import notificar_usuario

    if advogado is not None:
        notificar_usuario(
            advogado.usuario,
            f"Nova {intimacao.tipo_comunicacao.lower()} — {intimacao.numero_processo}",
            f"{intimacao.tribunal}: prazo até {intimacao.prazo_final:%d/%m}"
            + (" (estimado)" if intimacao.prazo_estimado else ""),
            tag=f"intimacao-{intimacao.pk}",
        )
    return intimacao


def importar_intimacoes(escritorio, dias=DIAS_PARA_TRAS, hoje=None):
    """Busca e grava as intimações de todos os advogados do escritório.

    Devolve {"novas", "advogados_consultados", "sem_oab", "erros"}.
    """
    from .models import Advogado

    hoje = hoje or timezone.localdate()
    inicio = hoje - timedelta(days=dias)
    resultado = {"novas": [], "advogados_consultados": 0, "sem_oab": [], "erros": []}

    advogados = Advogado.objects.filter(escritorio=escritorio, usuario__ativo=True).select_related("usuario")
    for advogado in advogados:
        oab = separar_oab(advogado.oab)
        if not oab:
            resultado["sem_oab"].append(advogado.usuario.nome)
            continue
        try:
            comunicacoes = buscar_comunicacoes(*oab, inicio, hoje)
        except ErroDJEN as erro:
            resultado["erros"].append(str(erro))
            continue
        resultado["advogados_consultados"] += 1
        for dados in comunicacoes:
            nova = registrar_intimacao(escritorio, advogado, dados)
            if nova:
                resultado["novas"].append(nova)
    return resultado
