import re

from django.core.exceptions import ValidationError

try:
    import dns.resolver
    import dns.exception
    _DNS_DISPONIVEL = True
except ImportError:  # dnspython pode não estar instalado em todo ambiente
    _DNS_DISPONIVEL = False


EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
)

# Domínios de e-mail temporário/descartável mais comuns — usuários reais
# de um escritório de advocacia não deveriam se cadastrar com esses.
DOMINIOS_DESCARTAVEIS = {
    "mailinator.com", "tempmail.com", "temp-mail.org", "10minutemail.com",
    "guerrillamail.com", "guerrillamail.info", "yopmail.com", "trashmail.com",
    "throwawaymail.com", "getnada.com", "sharklasers.com", "dispostable.com",
    "fakeinbox.com", "maildrop.cc", "mintemail.com", "mytemp.email",
}

_CACHE_MX = {}


def _dominio_tem_mx(dominio):
    """Verifica se o domínio tem servidor de e-mail configurado (registro MX).

    Retorna True quando não é possível determinar com segurança (timeout,
    biblioteca ausente, sem rede) — a checagem de MX é um reforço, não deve
    bloquear cadastros legítimos por instabilidade de rede/DNS.
    """
    if not _DNS_DISPONIVEL:
        return True

    if dominio in _CACHE_MX:
        return _CACHE_MX[dominio]

    try:
        respostas = dns.resolver.resolve(dominio, "MX", lifetime=3)
        resultado = len(respostas) > 0
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
        resultado = False
    except Exception:
        resultado = True

    _CACHE_MX[dominio] = resultado
    return resultado


def validar_email_real(valor):
    """Validador de e-mail para uso em serializers/forms do DRF.

    Levanta django.core.exceptions.ValidationError quando o e-mail não
    parece real: formato inválido, domínio descartável/temporário, ou
    domínio sem registro MX (não recebe e-mails).
    """
    email = (valor or "").strip()

    if not email or not EMAIL_REGEX.match(email):
        raise ValidationError("Informe um e-mail válido.")

    dominio = email.rsplit("@", 1)[-1].lower()

    if dominio in DOMINIOS_DESCARTAVEIS:
        raise ValidationError("Não aceitamos e-mails temporários/descartáveis. Use um e-mail real.")

    if not _dominio_tem_mx(dominio):
        raise ValidationError("O domínio deste e-mail não existe ou não recebe e-mails.")

    return email


def _somente_digitos(valor):
    return re.sub(r"\D", "", valor or "")


def validar_cpf(valor):
    """CPF deve ter exatamente 11 dígitos (fora pontuação)."""
    if not valor:
        return valor
    if len(_somente_digitos(valor)) != 11:
        raise ValidationError("CPF deve conter 11 dígitos.")
    return valor


def validar_cnpj(valor):
    """CNPJ deve ter exatamente 14 dígitos (fora pontuação)."""
    if not valor:
        return valor
    if len(_somente_digitos(valor)) != 14:
        raise ValidationError("CNPJ deve conter 14 dígitos.")
    return valor


def validar_telefone(valor):
    """Telefone (com DDD) deve ter 10 dígitos (fixo) ou 11 (celular)."""
    if not valor:
        return valor
    if len(_somente_digitos(valor)) not in (10, 11):
        raise ValidationError("Telefone deve conter 10 ou 11 dígitos, incluindo o DDD.")
    return valor


OAB_REGEX = re.compile(r"^\d{4,6}/[A-Za-z]{2}$")


def validar_oab(valor):
    """OAB no formato número/UF (ex.: 123456/SP), com 4 a 6 dígitos."""
    if not valor:
        return valor
    if not OAB_REGEX.match(valor.strip()):
        raise ValidationError("OAB deve estar no formato número/UF, com 4 a 6 dígitos (ex.: 123456/SP).")
    return valor


def validar_rg(valor):
    """RG varia por estado — aceita de 5 a 9 dígitos (dígito verificador 'X' incluso)."""
    limpo = (valor or "").strip()
    if not limpo:
        return valor
    tem_x_final = limpo[-1].upper() == "X"
    digitos = _somente_digitos(limpo[:-1] if tem_x_final else limpo)
    total = len(digitos) + (1 if tem_x_final else 0)
    if not (5 <= total <= 9):
        raise ValidationError("RG deve conter entre 5 e 9 dígitos.")
    return valor
