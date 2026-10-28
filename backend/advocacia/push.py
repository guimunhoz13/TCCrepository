"""Notificações push no celular e no navegador (Web Push + VAPID).

O navegador entrega um "endereço" de inscrição (endpoint do Google, da
Apple ou da Mozilla) e duas chaves. O servidor cifra a mensagem com essas
chaves e assina o pedido com o par VAPID do sistema; só aquele aparelho
consegue ler. O service worker do front mostra a notificação mesmo com o
sistema fechado.

Como o e-mail, o push nunca derruba a operação que o disparou: falha vai
para o log. Inscrição expirada (404/410) é apagada.
"""

import base64
import json
import logging
from urllib.parse import urlsplit

import requests

from django.conf import settings

logger = logging.getLogger(__name__)

TEMPO_DE_VIDA = 60 * 60 * 24  # o serviço guarda a mensagem por até um dia


def endpoint_push_permitido(endpoint):
    """Aceita apenas serviços de push conhecidos, sem credenciais/porta livre.

    A URL vem do navegador e será acessada pelo servidor. Não basta exigir
    HTTPS: isso permitiria atingir endereços internos (SSRF).
    """
    if not isinstance(endpoint, str) or not endpoint or len(endpoint) > 1000:
        return False
    try:
        url = urlsplit(endpoint)
        host = url.hostname or ""
        if (url.scheme != "https" or url.port not in (None, 443)
                or url.username is not None or url.password is not None or url.fragment
                or any(c.isspace() or ord(c) < 32 for c in endpoint)):
            return False
        return host in {"fcm.googleapis.com", "web.push.apple.com"} or any(
            host == dominio or host.endswith("." + dominio)
            for dominio in ("push.services.mozilla.com", "notify.windows.com")
        )
    except ValueError:
        return False


class _TransportePush:
    @staticmethod
    def post(endpoint, **kwargs):
        # Um redirecionamento do provedor também não pode alcançar outra URL.
        return requests.post(endpoint, allow_redirects=False, **kwargs)


def push_ativo():
    return bool(settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY)


def gerar_chaves():
    """Par VAPID novo (P-256), em base64url, no formato que o front e o
    pywebpush usam."""
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

    chave = ec.generate_private_key(ec.SECP256R1())
    privada = chave.private_numbers().private_value.to_bytes(32, "big")
    publica = chave.public_key().public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)

    def b64(dados):
        return base64.urlsafe_b64encode(dados).rstrip(b"=").decode()

    return b64(publica), b64(privada)


def _enviar(inscricao, carga):
    from pywebpush import WebPushException, webpush

    if not endpoint_push_permitido(inscricao.endpoint):
        logger.warning("Destino push recusado para usuario=%s", inscricao.usuario_id)
        return False
    contato = settings.VAPID_EMAIL or "contato@lexnexo.app"
    try:
        webpush(
            subscription_info={
                "endpoint": inscricao.endpoint,
                "keys": {"p256dh": inscricao.p256dh, "auth": inscricao.auth},
            },
            data=json.dumps(carga),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{contato}"},
            ttl=TEMPO_DE_VIDA,
            timeout=10,
            requests_session=_TransportePush(),
        )
        return True
    except WebPushException as erro:
        codigo = getattr(getattr(erro, "response", None), "status_code", None)
        if codigo in (404, 410):
            inscricao.delete()
        else:
            logger.warning("Push recusado (%s) para %s", codigo, inscricao.usuario_id)
    except Exception:
        logger.exception("Falha ao enviar push para %s", inscricao.usuario_id)
    return False


def notificar_usuario(usuario, titulo, corpo, url="/dashboard", tag=None):
    """Manda a notificação a todos os aparelhos inscritos da pessoa.

    Devolve quantos aceitaram. Sem chaves VAPID, não faz nada.
    """
    if not push_ativo() or usuario is None or not usuario.ativo:
        return 0
    carga = {"titulo": titulo[:120], "corpo": corpo[:300], "url": url}
    if tag:
        carga["tag"] = tag
    return sum(_enviar(inscricao, carga) for inscricao in list(usuario.inscricoes_push.all()))
