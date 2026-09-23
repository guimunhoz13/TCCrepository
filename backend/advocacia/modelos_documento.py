"""Preenchimento de modelos de documento a partir dos dados cadastrados.

O conteúdo do modelo é escrito pelo próprio escritório, então ele é tratado
como dado, nunca como código: em vez do motor de templates do Django — que
permite navegar atributos e chamar métodos, e poderia expor dado sensível —
as variáveis vêm de um catálogo fechado e a substituição é literal.
Um `{{algo}}` fora do catálogo é devolvido intacto e sinalizado.
"""

import re
from decimal import Decimal

from django.utils import timezone

PADRAO_VARIAVEL = re.compile(r"\{\{\s*([a-z_]+\.[a-z_]+)\s*\}\}")

MESES = (
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
)

# Catálogo do que pode ser usado num modelo, com a descrição que a interface
# mostra. Nada fora daqui é resolvido.
VARIAVEIS_DISPONIVEIS = {
    "cliente.nome": "Nome completo do cliente",
    "cliente.cpf": "CPF do cliente (pessoa física)",
    "cliente.cnpj": "CNPJ do cliente (pessoa jurídica)",
    "cliente.rg": "RG do cliente",
    "cliente.endereco": "Endereço do cliente",
    "cliente.estado_civil": "Estado civil do cliente",
    "cliente.nacionalidade": "Nacionalidade do cliente",
    "cliente.email": "E-mail do cliente",
    "cliente.telefone": "Telefone do cliente",
    "processo.numero": "Número do processo",
    "processo.titulo": "Título do processo",
    "processo.area": "Área do direito",
    "processo.vara": "Vara",
    "processo.comarca": "Comarca",
    "processo.valor_causa": "Valor da causa",
    "processo.parte_contraria": "Nome da parte contrária",
    "advogado.nome": "Nome do advogado responsável",
    "advogado.oab": "Número da OAB do advogado",
    "escritorio.nome": "Nome do escritório",
    "escritorio.cnpj": "CNPJ do escritório",
    "escritorio.endereco": "Endereço do escritório",
    "escritorio.cidade": "Cidade do escritório",
    "escritorio.telefone": "Telefone do escritório",
    "escritorio.email": "E-mail do escritório",
    "data.hoje": "Data de hoje (21/09/2026)",
    "data.hoje_extenso": "Data de hoje por extenso",
    "data.cidade_e_data": "Cidade do escritório e data por extenso",
}


def _texto(valor):
    return "" if valor is None else str(valor)


def _moeda(valor):
    if valor is None:
        return ""
    return f"R$ {Decimal(valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _data_extenso(data):
    return f"{data.day} de {MESES[data.month - 1]} de {data.year}"


def montar_contexto(escritorio, cliente=None, processo=None, advogado=None):
    """Monta o dicionário de valores para um modelo, sem tocar em nada fora
    do catálogo. Campos ausentes viram string vazia."""

    hoje = timezone.localdate()

    contexto = {chave: "" for chave in VARIAVEIS_DISPONIVEIS}

    contexto["data.hoje"] = hoje.strftime("%d/%m/%Y")
    contexto["data.hoje_extenso"] = _data_extenso(hoje)

    if escritorio:
        contexto["escritorio.nome"] = _texto(escritorio.nome)
        contexto["escritorio.cnpj"] = _texto(escritorio.cnpj)
        contexto["escritorio.endereco"] = _texto(escritorio.endereco)
        contexto["escritorio.cidade"] = _texto(escritorio.cidade)
        contexto["escritorio.telefone"] = _texto(escritorio.telefone)
        contexto["escritorio.email"] = _texto(escritorio.email)
        cidade = _texto(escritorio.cidade)
        contexto["data.cidade_e_data"] = (
            f"{cidade}, {_data_extenso(hoje)}" if cidade else _data_extenso(hoje)
        )
    else:
        contexto["data.cidade_e_data"] = _data_extenso(hoje)

    if processo is not None and cliente is None:
        cliente = processo.cliente
    if processo is not None and advogado is None:
        advogado = processo.advogado

    if cliente:
        contexto["cliente.nome"] = _texto(cliente.nome)
        contexto["cliente.cpf"] = _texto(cliente.cpf)
        contexto["cliente.cnpj"] = _texto(cliente.cnpj)
        contexto["cliente.rg"] = _texto(cliente.rg)
        contexto["cliente.endereco"] = _texto(cliente.endereco)
        contexto["cliente.estado_civil"] = (
            cliente.get_estado_civil_display() if cliente.estado_civil else ""
        )
        contexto["cliente.nacionalidade"] = _texto(cliente.nacionalidade)
        contexto["cliente.email"] = _texto(cliente.email)
        contexto["cliente.telefone"] = _texto(cliente.telefone)

    if processo:
        contexto["processo.numero"] = _texto(processo.numero_processo)
        contexto["processo.titulo"] = _texto(processo.titulo)
        contexto["processo.area"] = (
            processo.get_area_direito_display() if processo.area_direito else ""
        )
        contexto["processo.vara"] = _texto(processo.vara)
        contexto["processo.comarca"] = _texto(processo.comarca)
        contexto["processo.valor_causa"] = _moeda(processo.valor_causa)
        contexto["processo.parte_contraria"] = _texto(processo.nome_parte_contraria)

    if advogado:
        contexto["advogado.nome"] = _texto(advogado.usuario.nome) if advogado.usuario_id else ""
        contexto["advogado.oab"] = _texto(advogado.oab)

    return contexto


def preencher(conteudo, contexto):
    """Substitui as variáveis conhecidas e devolve também o que não resolveu.

    Retorna (texto_preenchido, nao_encontradas, vazias):
      - nao_encontradas: variáveis fora do catálogo, mantidas no texto;
      - vazias: variáveis válidas cujo cadastro está em branco.
    """

    nao_encontradas = []
    vazias = []

    def substituir(correspondencia):
        chave = correspondencia.group(1)

        if chave not in VARIAVEIS_DISPONIVEIS:
            if chave not in nao_encontradas:
                nao_encontradas.append(chave)
            return correspondencia.group(0)

        valor = contexto.get(chave, "")
        if valor == "" and chave not in vazias:
            vazias.append(chave)
        return valor

    return PADRAO_VARIAVEL.sub(substituir, conteudo), nao_encontradas, vazias
