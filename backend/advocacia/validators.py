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


UFS_VALIDAS = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO",
}


def _somente_digitos(valor):
    return re.sub(r"\D", "", valor or "")


def cpf_valido(valor):
    numeros = _somente_digitos(valor)
    if len(numeros) != 11 or numeros == numeros[0] * 11:
        return False

    def calcular_digito(base):
        soma = sum(
            int(digito) * peso
            for digito, peso in zip(base, range(len(base) + 1, 1, -1))
        )
        resto = (soma * 10) % 11
        return 0 if resto == 10 else resto

    digito1 = calcular_digito(numeros[:9])
    digito2 = calcular_digito(numeros[:9] + str(digito1))
    return numeros == numeros[:9] + str(digito1) + str(digito2)


def cnpj_valido(valor):
    numeros = _somente_digitos(valor)
    if len(numeros) != 14 or numeros == numeros[0] * 14:
        return False

    def calcular_digito(base):
        pesos = (
            [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            if len(base) == 12
            else [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        )
        soma = sum(int(digito) * peso for digito, peso in zip(base, pesos))
        resto = soma % 11
        return 0 if resto < 2 else 11 - resto

    digito1 = calcular_digito(numeros[:12])
    digito2 = calcular_digito(numeros[:12] + str(digito1))
    return numeros == numeros[:12] + str(digito1) + str(digito2)


def telefone_valido(valor):
    numeros = _somente_digitos(valor)
    return len(numeros) in (10, 11)


def rg_valido(valor):
    limpo = re.sub(r"[^0-9Xx]", "", valor or "")
    return 7 <= len(limpo) <= 9


def oab_valida(valor):
    bruto = (valor or "").upper()
    numeros = re.sub(r"[^0-9]", "", bruto)
    letras = re.sub(r"[^A-Z]", "", bruto)
    return 3 <= len(numeros) <= 6 and letras in UFS_VALIDAS


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
