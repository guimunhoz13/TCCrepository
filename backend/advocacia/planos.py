"""Planos do LexOffice: o Gratuito para qualquer escritório, sem pagamento,
e os pagos com mais vantagens.

O catálogo fica aqui, num lugar só: a API aplica os limites, a tela de
planos e a página inicial leem os mesmos números por /api/planos/.

Regras gerais:
  - nenhum dado é apagado ao cair de plano: passar do limite só impede
    criar mais (usuários, processos), nunca ver ou editar o que existe;
  - um plano pago com validade vencida vale como Gratuito até ser
    renovado (a validade é definida pelo administrador da plataforma);
  - recursos com custo por uso (IA) ou rotinas automáticas (DJEN,
    sincronização do DataJud) ficam nos planos pagos.
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException

PLANO_PADRAO = "gratuito"

# Recursos que dependem do plano.
IA = "ia"
INTIMACOES_DJEN = "intimacoes_djen"
SINCRONIZACAO_DATAJUD = "sincronizacao_datajud"

NOMES_RECURSOS = {
    IA: "Assistente de IA e mensagens ao cliente escritas pela IA",
    INTIMACOES_DJEN: "Intimações do DJEN com prazo lançado na agenda",
    SINCRONIZACAO_DATAJUD: "Andamentos do DataJud buscados automaticamente",
}

# Limites que dependem do plano (None = ilimitado).
USUARIOS = "usuarios"
PROCESSOS_ATIVOS = "processos_ativos"

NOMES_LIMITES = {
    USUARIOS: "usuários ativos",
    PROCESSOS_ATIVOS: "processos ativos",
}

# Processos encerrados ou arquivados não contam no limite.
STATUS_INATIVOS = ("Concluido", "Arquivado")

PLANOS = {
    "gratuito": {
        "nome": "Gratuito",
        "preco_mensal": 0,
        "descricao": "Para começar sem pagar nada: o essencial para organizar o escritório.",
        "limites": {USUARIOS: 3, PROCESSOS_ATIVOS: 30},
        "recursos": frozenset(),
        "vantagens": [
            "Até 3 usuários",
            "Até 30 processos ativos",
            "Clientes, agenda, tarefas e documentos",
            "Consulta ao DataJud e cálculo de prazos",
            "Cobrança por PIX e agenda no celular",
            "Verificação em duas etapas e LGPD",
        ],
    },
    "basico": {
        "nome": "Básico",
        "preco_mensal": 79,
        "descricao": "Para escritórios em crescimento que não querem perder prazo.",
        "limites": {USUARIOS: 10, PROCESSOS_ATIVOS: 300},
        "recursos": frozenset({INTIMACOES_DJEN, SINCRONIZACAO_DATAJUD}),
        "vantagens": [
            "Tudo do Gratuito",
            "Até 10 usuários",
            "Até 300 processos ativos",
            "Intimações do DJEN com prazo na agenda",
            "Andamentos do DataJud buscados todo dia",
        ],
    },
    "profissional": {
        "nome": "Profissional",
        "preco_mensal": 199,
        "descricao": "Para equipes maiores, com inteligência artificial e sem limites.",
        "limites": {USUARIOS: None, PROCESSOS_ATIVOS: None},
        "recursos": frozenset({INTIMACOES_DJEN, SINCRONIZACAO_DATAJUD, IA}),
        "vantagens": [
            "Tudo do Básico",
            "Usuários ilimitados",
            "Processos ilimitados",
            "Assistente de IA",
            "Mensagens ao cliente escritas pela IA",
        ],
    },
}


class LimiteDoPlano(APIException):
    """O plano atual não permite a ação; a mensagem já orienta o upgrade."""

    status_code = status.HTTP_403_FORBIDDEN
    default_code = "limite_do_plano"


def plano_efetivo(escritorio):
    """Chave do plano que vale hoje (pago vencido vale como Gratuito)."""
    chave = escritorio.plano if escritorio.plano in PLANOS else PLANO_PADRAO
    if (
        chave != PLANO_PADRAO
        and escritorio.plano_validade
        and escritorio.plano_validade < timezone.localdate()
    ):
        return PLANO_PADRAO
    return chave


def tem_recurso(escritorio, recurso):
    return recurso in PLANOS[plano_efetivo(escritorio)]["recursos"]


def _planos_com_recurso(recurso):
    return [nome for nome, plano in PLANOS.items() if recurso in plano["recursos"]]


def filtro_com_recurso(recurso, prefixo=""):
    """Q dos escritórios cujo plano em vigor inclui o recurso (para as rotinas).

    `prefixo` permite filtrar outro modelo pelo escritório: "escritorio__".
    """
    from django.db.models import Q

    hoje = timezone.localdate()
    return Q(**{f"{prefixo}plano__in": _planos_com_recurso(recurso)}) & (
        Q(**{f"{prefixo}plano_validade__isnull": True})
        | Q(**{f"{prefixo}plano_validade__gte": hoje})
    )


def exigir_recurso(escritorio, recurso):
    if tem_recurso(escritorio, recurso):
        return
    nomes = " ou ".join(PLANOS[chave]["nome"] for chave in _planos_com_recurso(recurso))
    raise LimiteDoPlano(
        f"{NOMES_RECURSOS[recurso]}: disponível no plano {nomes}. "
        f"Seu escritório está no plano {PLANOS[plano_efetivo(escritorio)]['nome']}."
    )


def uso(escritorio):
    """Quanto o escritório usa de cada limite."""
    from .models import Processo, Usuario

    return {
        USUARIOS: Usuario.objects.filter(escritorio=escritorio, ativo=True).count(),
        PROCESSOS_ATIVOS: Processo.objects.filter(escritorio=escritorio)
        .exclude(status__in=STATUS_INATIVOS)
        .count(),
    }


def verificar_limite(escritorio, limite, acrescimo=1):
    """Recusa a criação se ela passar do limite do plano."""
    chave = plano_efetivo(escritorio)
    maximo = PLANOS[chave]["limites"][limite]
    if maximo is None:
        return
    atual = uso(escritorio)[limite]
    if atual + acrescimo > maximo:
        raise LimiteDoPlano(
            f"O plano {PLANOS[chave]['nome']} permite até {maximo} {NOMES_LIMITES[limite]} "
            f"e o escritório já tem {atual}. Conheça os planos pagos em Planos."
        )


def catalogo():
    """Os planos como vão para a tela (sem frozenset, na ordem de preço)."""
    return [
        {
            "id": chave,
            "nome": plano["nome"],
            "preco_mensal": plano["preco_mensal"],
            "descricao": plano["descricao"],
            "limites": plano["limites"],
            "recursos": sorted(plano["recursos"]),
            "vantagens": plano["vantagens"],
        }
        for chave, plano in PLANOS.items()
    ]


def situacao(escritorio):
    """Plano atual do escritório, com uso e limites, para a tela de planos."""
    chave = plano_efetivo(escritorio)
    vencido = chave != escritorio.plano and escritorio.plano in PLANOS
    return {
        "plano": chave,
        "nome": PLANOS[chave]["nome"],
        "plano_contratado": escritorio.plano,
        "validade": escritorio.plano_validade,
        "vencido": vencido,
        "limites": PLANOS[chave]["limites"],
        "uso": uso(escritorio),
        "recursos": sorted(PLANOS[chave]["recursos"]),
    }
