"""Verificação em duas etapas (TOTP — o código de 6 dígitos que muda a cada
30 segundos no Google Authenticator, Microsoft Authenticator, Authy etc.).

O login passa a ter duas fases quando a pessoa ativou o recurso: a senha
certa não devolve tokens, e sim um "desafio" assinado e de vida curta; só
o desafio mais o código do aplicativo abrem a sessão.
"""

import base64
import io
import time

import pyotp
import qrcode
import qrcode.image.svg
from django.core import signing

EMISSOR = "LexOffice"
VALIDADE_DESAFIO_SEGUNDOS = 300
_SAL_DESAFIO = "lexoffice.login.segundo-fator"


def novo_segredo():
    return pyotp.random_base32()


def uri_de_cadastro(usuario, segredo):
    return pyotp.TOTP(segredo).provisioning_uri(name=usuario.email, issuer_name=EMISSOR)


def qr_code_svg(uri):
    """QR code em SVG (data URI): gerado no servidor, o segredo nunca passa
    por um serviço externo de QR code."""
    imagem = qrcode.make(uri, image_factory=qrcode.image.svg.SvgPathImage, box_size=8)
    buffer = io.BytesIO()
    imagem.save(buffer)
    return "data:image/svg+xml;base64," + base64.b64encode(buffer.getvalue()).decode()


def conferir_codigo(usuario, codigo):
    """Confere o código e impede que o mesmo seja usado duas vezes.

    Aceita o passo anterior e o seguinte (±30 s) para tolerar relógio
    levemente fora de hora no celular. Grava o passo usado: um código
    interceptado não abre uma segunda sessão.
    """
    codigo = "".join(ch for ch in str(codigo or "") if ch.isdigit())
    if len(codigo) != 6 or not usuario.totp_segredo:
        return False

    totp = pyotp.TOTP(usuario.totp_segredo)
    agora = int(time.time() // totp.interval)
    for deslocamento in (0, -1, 1):
        passo = agora + deslocamento
        if passo <= (usuario.totp_ultimo_passo or 0):
            continue
        if totp.generate_otp(passo) == codigo:
            usuario.totp_ultimo_passo = passo
            usuario.save(update_fields=["totp_ultimo_passo"])
            return True
    return False


def assinar_desafio(usuario):
    return signing.dumps(
        {"u": usuario.pk, "v": usuario.session_version}, salt=_SAL_DESAFIO
    )


def abrir_desafio(desafio):
    """Devolve (usuario_id, session_version) ou None se inválido/expirado."""
    try:
        dados = signing.loads(desafio, salt=_SAL_DESAFIO, max_age=VALIDADE_DESAFIO_SEGUNDOS)
    except signing.BadSignature:
        return None
    return dados.get("u"), dados.get("v")
