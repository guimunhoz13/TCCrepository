"""Agenda no formato iCalendar (RFC 5545).

O mesmo arquivo serve para dois usos:
  - download (.ics) para importar uma vez no Google Agenda, Outlook ou
    Calendário do iPhone;
  - assinatura: o aplicativo de agenda consulta um link privado de tempos
    em tempos e mantém audiências e prazos sempre atualizados.

Os horários vão em UTC (sufixo Z): todo aplicativo de agenda converte para
o fuso do aparelho, e assim não é preciso embutir a definição de fuso.
"""

from datetime import timedelta, timezone as dt_timezone

from django.utils import timezone

PRODID = "-//LexOffice//Agenda do escritório//PT-BR"
DURACAO_COMPROMISSO = timedelta(hours=1)
DURACAO_PRAZO = timedelta(minutes=30)


def _escapar(texto):
    """Escapa texto conforme a RFC 5545 (seção 3.3.11)."""
    return (
        (texto or "")
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")
    )


def _dobrar(linha):
    """Quebra linhas acima de 75 octetos, como a RFC exige (seção 3.1).

    A continuação começa com um espaço. O corte respeita caracteres UTF-8
    de vários bytes, para não partir um "ç" ao meio.
    """
    if len(linha.encode("utf-8")) <= 75:
        return linha
    partes, atual, tamanho = [], "", 0
    for caractere in linha:
        bytes_caractere = len(caractere.encode("utf-8"))
        limite = 75 if not partes else 74
        if tamanho + bytes_caractere > limite:
            partes.append(atual)
            atual, tamanho = "", 0
        atual += caractere
        tamanho += bytes_caractere
    partes.append(atual)
    return "\r\n ".join(partes)


def _data_utc(valor):
    return valor.astimezone(dt_timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _linhas_do_evento(evento, agora):
    eh_prazo = evento.tipo == "prazo"
    titulo = evento.titulo
    if eh_prazo:
        titulo = f"{'PRAZO FATAL' if evento.prioridade == 'fatal' else 'Prazo'}: {titulo}"

    descricao = evento.descricao or ""
    processo = getattr(evento, "processo", None)
    if processo is not None:
        descricao = f"Processo {processo.numero_processo} — {processo.titulo}\n\n{descricao}".strip()

    fim = evento.data_evento + (DURACAO_PRAZO if eh_prazo else DURACAO_COMPROMISSO)

    linhas = [
        "BEGIN:VEVENT",
        f"UID:agenda-{evento.pk}@lexoffice",
        f"DTSTAMP:{_data_utc(agora)}",
        f"DTSTART:{_data_utc(evento.data_evento)}",
        f"DTEND:{_data_utc(fim)}",
        f"SUMMARY:{_escapar(titulo)}",
        f"DESCRIPTION:{_escapar(descricao)}",
        f"CATEGORIES:{'Prazo' if eh_prazo else 'Compromisso'}",
        # Cumprido continua no calendário (é histórico), mas marcado.
        f"STATUS:{'CANCELLED' if evento.cumprido else 'CONFIRMED'}",
    ]
    if evento.local_evento:
        linhas.append(f"LOCATION:{_escapar(evento.local_evento)}")
    if eh_prazo and not evento.cumprido:
        # Prazo avisa na véspera; o fatal, também dois dias antes.
        antecedencias = ["-P1D"] + (["-P2D"] if evento.prioridade == "fatal" else [])
        for antecedencia in antecedencias:
            linhas += [
                "BEGIN:VALARM",
                "ACTION:DISPLAY",
                f"DESCRIPTION:{_escapar(titulo)}",
                f"TRIGGER:{antecedencia}",
                "END:VALARM",
            ]
    linhas.append("END:VEVENT")
    return linhas


def gerar_ics(eventos, nome_calendario):
    agora = timezone.now()
    linhas = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        f"PRODID:{PRODID}",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{_escapar(nome_calendario)}",
        # Sugere ao aplicativo atualizar a assinatura a cada hora.
        "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
        "X-PUBLISHED-TTL:PT1H",
    ]
    for evento in eventos:
        linhas += _linhas_do_evento(evento, agora)
    linhas.append("END:VCALENDAR")
    return "\r\n".join(_dobrar(linha) for linha in linhas) + "\r\n"


def eventos_para_calendario(queryset):
    """Do último mês em diante: o passado distante só pesa na assinatura."""
    desde = timezone.now() - timedelta(days=30)
    return (
        queryset.filter(data_evento__gte=desde)
        .select_related("processo")
        .order_by("data_evento")
    )
