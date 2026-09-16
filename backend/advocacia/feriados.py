from datetime import date, timedelta


def _pascoa(ano):
    """Data da Páscoa no calendário gregoriano (algoritmo de Meeus/Jones/Butcher).

    Necessária porque vários feriados forenses não têm data fixa: são
    contados a partir da Páscoa (Carnaval, Sexta-feira Santa, Corpus Christi).
    """
    a = ano % 19
    b = ano // 100
    c = ano % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    mes = (h + l - 7 * m + 114) // 31
    dia = ((h + l - 7 * m + 114) % 31) + 1
    return date(ano, mes, dia)


def feriados_nacionais(ano):
    """Conjunto de feriados nacionais brasileiros de um ano — os que
    suspendem prazo processual em todo o território nacional. Feriados
    estaduais/municipais e pontos facultativos (que variam por comarca)
    não entram aqui, já que dependem de qual vara/comarca é o processo,
    informação que o sistema não tem hoje.
    """
    pascoa = _pascoa(ano)

    return {
        date(ano, 1, 1),  # Confraternização Universal
        pascoa - timedelta(days=48),  # Carnaval (segunda-feira)
        pascoa - timedelta(days=47),  # Carnaval (terça-feira)
        pascoa - timedelta(days=2),  # Sexta-feira Santa
        pascoa + timedelta(days=60),  # Corpus Christi
        date(ano, 4, 21),  # Tiradentes
        date(ano, 5, 1),  # Dia do Trabalho
        date(ano, 9, 7),  # Independência do Brasil
        date(ano, 10, 12),  # Nossa Senhora Aparecida
        date(ano, 11, 2),  # Finados
        date(ano, 11, 15),  # Proclamação da República
        date(ano, 11, 20),  # Dia Nacional de Zumbi e da Consciência Negra (Lei 14.759/2023)
        date(ano, 12, 25),  # Natal
    }


def eh_dia_util(data):
    """Segunda a sexta, exceto feriado nacional."""
    if data.weekday() >= 5:  # 5 = sábado, 6 = domingo
        return False
    return data not in feriados_nacionais(data.year)


def calcular_prazo(data_inicio, dias, dias_uteis=True):
    """Calcula a data final de um prazo a partir de uma data de início
    (ex.: intimação/citação) e uma quantidade de dias.

    Em dias úteis (padrão para prazos processuais cíveis desde o CPC/2015,
    art. 219): conta apenas dias úteis, pulando fins de semana e feriados
    nacionais. Em dias corridos (ex.: prazos contratuais, alguns prazos de
    direito material): conta todos os dias do calendário.

    `data_inicio` é o dia do início da contagem (normalmente já é o
    primeiro dia útil seguinte à intimação, conforme art. 224 do CPC) — a
    contagem começa no dia seguinte a ela.
    """
    data = data_inicio
    dias_contados = 0

    while dias_contados < dias:
        data += timedelta(days=1)
        if not dias_uteis or eh_dia_util(data):
            dias_contados += 1

    return data
