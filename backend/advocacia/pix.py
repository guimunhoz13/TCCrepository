"""PIX "copia e cola" e QR code (BR Code estático) para cobrar parcelas.

Segue o Manual de Padrões para Iniciação do Pix do Banco Central: o
payload é uma sequência de campos EMV no formato ID (2 dígitos) +
tamanho (2 dígitos) + valor, terminada por um CRC16. Qualquer aplicativo
de banco lê o QR code ou o texto e já abre o pagamento com valor e
destinatário preenchidos.

É o PIX estático: não há confirmação automática do pagamento (isso exige
uma conta PJ com API de cobrança do banco). Quem recebe marca a parcela
como paga, como já fazia.
"""

import re
import unicodedata
from decimal import Decimal

from .dois_fatores import qr_code_svg

TIPOS_CHAVE = (
    ("cpf_cnpj", "CPF ou CNPJ"),
    ("email", "E-mail"),
    ("telefone", "Celular"),
    ("aleatoria", "Chave aleatória"),
)


class ErroPix(Exception):
    """Dado insuficiente para montar o PIX, com mensagem para o usuário."""


def _campo(identificador, valor):
    return f"{identificador}{len(valor):02d}{valor}"


def _ascii(texto, limite):
    """Nome e cidade só aceitam caracteres básicos no BR Code."""
    sem_acento = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode()
    limpo = re.sub(r"[^A-Za-z0-9 .\-/]", "", sem_acento)
    return re.sub(r"\s+", " ", limpo).strip()[:limite]


def crc16(payload):
    """CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), como o BC exige."""
    crc = 0xFFFF
    for byte in payload.encode("utf-8"):
        crc ^= byte << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) if crc & 0x8000 else (crc << 1)
            crc &= 0xFFFF
    return f"{crc:04X}"


def normalizar_chave(tipo, chave):
    """Deixa a chave no formato que o DICT espera.

    Só ajusta o formato — não confere dígito verificador de CPF/CNPJ nem
    se a chave existe: isso é papel do banco no momento do pagamento.
    """
    chave = (chave or "").strip()
    if not chave:
        return ""
    if tipo == "cpf_cnpj":
        return re.sub(r"\D", "", chave)
    if tipo == "telefone":
        digitos = re.sub(r"\D", "", chave)
        if not digitos.startswith("55") or len(digitos) <= 11:
            digitos = "55" + digitos
        return "+" + digitos
    if tipo == "email":
        return chave.lower()
    return chave.lower()


def montar_payload(chave, nome, cidade, valor, txid="***", descricao=""):
    if not chave:
        raise ErroPix("Cadastre a chave PIX do escritório em Configurações › Escritório.")
    nome = _ascii(nome, 25)
    cidade = _ascii(cidade, 15)
    if not nome or not cidade:
        raise ErroPix("Informe o nome do recebedor e a cidade do PIX em Configurações › Escritório.")

    valor = Decimal(valor).quantize(Decimal("0.01"))
    if valor <= 0:
        raise ErroPix("O valor do PIX precisa ser maior que zero.")

    # O campo 26 inteiro cabe em 99 caracteres; a descrição usa o que sobra.
    conta = _campo("00", "br.gov.bcb.pix") + _campo("01", chave)
    descricao = _ascii(descricao, 72)
    espaco = 99 - len(conta) - 4
    if descricao and espaco > 0:
        conta += _campo("02", descricao[:espaco])
    if len(conta) > 99:
        raise ErroPix("A chave PIX é longa demais.")

    txid = re.sub(r"[^A-Za-z0-9]", "", txid or "")[:25] or "***"

    payload = (
        _campo("00", "01")
        + _campo("26", conta)
        + _campo("52", "0000")
        + _campo("53", "986")
        + _campo("54", f"{valor:.2f}")
        + _campo("58", "BR")
        + _campo("59", nome)
        + _campo("60", cidade)
        + _campo("62", _campo("05", txid))
        + "6304"
    )
    return payload + crc16(payload)


def pix_da_parcela(parcela, configuracao):
    """Payload e QR code do PIX de uma parcela."""
    contrato = parcela.contrato
    processo = contrato.processo
    total = contrato.parcelas.count()
    payload = montar_payload(
        chave=configuracao.chave_pix,
        nome=configuracao.nome_recebedor_pix or contrato.escritorio.nome,
        cidade=configuracao.cidade_pix or contrato.escritorio.cidade,
        valor=parcela.valor,
        txid=f"LEX{parcela.pk}P{parcela.numero}",
        descricao=f"Parcela {parcela.numero}/{total} proc {processo.numero_processo}",
    )
    return {
        "payload": payload,
        "qr_code": qr_code_svg(payload),
        "valor": f"{parcela.valor:.2f}",
        "data_vencimento": parcela.data_vencimento.isoformat(),
        "numero": parcela.numero,
        "total_parcelas": total,
        "recebedor": configuracao.nome_recebedor_pix or contrato.escritorio.nome,
        "numero_processo": processo.numero_processo,
        "cliente_nome": processo.cliente.nome,
        "cliente_telefone": processo.cliente.telefone,
    }
