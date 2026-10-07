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
    estaduais/municipais e suspensões de expediente variam por comarca e
    entram por FeriadosLocais, cadastrados pelo escritório.
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


class FeriadosLocais:
    """Feriados que valem só para o escritório: municipais, estaduais e
    suspensões de expediente do tribunal (portarias, pontos facultativos).

    Quem define o calendário forense é cada tribunal, por isso o sistema
    não traz uma lista pronta: o escritório cadastra os dias da sua
    comarca. `datas` são dias exatos; `anuais`, pares (mês, dia) que se
    repetem todo ano (o aniversário da cidade, por exemplo).
    """

    def __init__(self, datas=(), anuais=(), descricoes=None):
        self.datas = frozenset(datas)
        self.anuais = frozenset(anuais)
        self.descricoes = descricoes or {}

    def __contains__(self, data):
        return data in self.datas or (data.month, data.day) in self.anuais

    def __bool__(self):
        return bool(self.datas or self.anuais)

    def descricao(self, data):
        return self.descricoes.get(data) or self.descricoes.get((data.month, data.day), "")

    @classmethod
    def do_escritorio(cls, escritorio):
        from .models import FeriadoLocal

        datas, anuais, descricoes = set(), set(), {}
        for feriado in FeriadoLocal.objects.filter(escritorio=escritorio):
            chave = (feriado.data.month, feriado.data.day) if feriado.anual else feriado.data
            (anuais if feriado.anual else datas).add(chave)
            descricoes[chave] = feriado.descricao
        return cls(datas, anuais, descricoes)


SEM_FERIADOS_LOCAIS = FeriadosLocais()


def eh_dia_util(data, locais=SEM_FERIADOS_LOCAIS):
    """Segunda a sexta, exceto feriado nacional e feriado local do escritório."""
    if data.weekday() >= 5:  # 5 = sábado, 6 = domingo
        return False
    return data not in feriados_nacionais(data.year) and data not in locais


def calcular_prazo(data_inicio, dias, dias_uteis=True, locais=SEM_FERIADOS_LOCAIS):
    """Calcula a data final de um prazo a partir de uma data de início
    (ex.: intimação/citação) e uma quantidade de dias.

    Em dias úteis (padrão para prazos processuais cíveis desde o CPC/2015,
    art. 219): conta apenas dias úteis, pulando fins de semana e feriados
    nacionais e os feriados locais cadastrados pelo escritório. Em dias corridos (ex.: prazos contratuais, alguns prazos de
    direito material): conta todos os dias do calendário.

    `data_inicio` é o dia do início da contagem (normalmente já é o
    primeiro dia útil seguinte à intimação, conforme art. 224 do CPC) — a
    contagem começa no dia seguinte a ela.
    """
    data = data_inicio
    dias_contados = 0

    while dias_contados < dias:
        data += timedelta(days=1)
        if not dias_uteis or eh_dia_util(data, locais):
            dias_contados += 1

    return data


def em_recesso_forense(data):
    """20 de dezembro a 20 de janeiro: prazos suspensos (CPC, art. 220)."""
    return (data.month == 12 and data.day >= 20) or (data.month == 1 and data.day <= 20)


def eh_dia_util_forense(data, locais=SEM_FERIADOS_LOCAIS):
    """Dia útil para contar prazo processual: sem fim de semana, feriado
    nacional, feriado local nem recesso forense."""
    return eh_dia_util(data, locais) and not em_recesso_forense(data)


def proximo_dia_util_forense(data, locais=SEM_FERIADOS_LOCAIS):
    data += timedelta(days=1)
    while not eh_dia_util_forense(data, locais):
        data += timedelta(days=1)
    return data


def feriados_locais_no_periodo(inicio, fim, locais):
    """Feriados locais que caíram em dia de semana entre as duas datas — os
    que de fato mudaram a contagem — para mostrar ao usuário."""
    if not locais:
        return []
    achados = []
    data = inicio + timedelta(days=1)
    while data <= fim:
        if data.weekday() < 5 and data in locais and data not in feriados_nacionais(data.year):
            achados.append({"data": data.isoformat(), "descricao": locais.descricao(data)})
        data += timedelta(days=1)
    return achados


def prazo_de_publicacao(data_disponibilizacao, dias, dias_uteis=True, locais=SEM_FERIADOS_LOCAIS):
    """Datas de uma intimação publicada no Diário de Justiça Eletrônico.

    - Publicação: primeiro dia útil seguinte à disponibilização no diário
      (Lei 11.419/2006, art. 4º, § 3º).
    - Contagem: começa no primeiro dia útil seguinte à publicação
      (art. 4º, § 4º; CPC, art. 224, § 3º).
    - Em dias úteis, pula fins de semana, feriados nacionais e o recesso
      de 20/12 a 20/01 (CPC, arts. 219 e 220). Em dias corridos, o recesso
      também suspende a contagem.

    Devolve (data_publicacao, data_final).
    """
    publicacao = proximo_dia_util_forense(data_disponibilizacao, locais)
    data = publicacao
    contados = 0
    while contados < dias:
        data += timedelta(days=1)
        if dias_uteis:
            if eh_dia_util_forense(data, locais):
                contados += 1
        elif not em_recesso_forense(data):
            contados += 1
    # Prazo que vence em dia sem expediente passa para o próximo útil
    # (CPC, art. 224, § 1º).
    if not eh_dia_util_forense(data, locais):
        data = proximo_dia_util_forense(data, locais)
    return publicacao, data
