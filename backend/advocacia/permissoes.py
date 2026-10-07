"""Perfis de acesso do escritório.

Uma matriz só — perfil × área × ação — decide o que cada pessoa pode fazer.
A mesma matriz protege a API (PermissaoPorPerfil) e vai para o frontend
(permissoes_do_perfil), que esconde o que o perfil não pode usar. Assim a
tela e o servidor nunca discordam: o botão some porque a API recusaria.
"""

from rest_framework.permissions import BasePermission

from .mixins import get_usuario_from_request
from .models import Usuario

VER, CRIAR, EDITAR, EXCLUIR = "ver", "criar", "editar", "excluir"
TUDO = frozenset({VER, CRIAR, EDITAR, EXCLUIR})

AREAS = (
    "clientes",
    "processos",
    "agenda",
    "documentos",
    "tarefas",
    "horas",
    "despesas",
    "financeiro",
    "modelos",
    "advogados",
    "relatorios",
    "exportar",
    "ia",
)

PERFIS = Usuario.TIPOS_USUARIO

_SO_VER = frozenset({VER})
_SEM_EXCLUIR = frozenset({VER, CRIAR, EDITAR})
_VER_E_CRIAR = frozenset({VER, CRIAR})

MATRIZ = {
    "admin": {area: TUDO for area in AREAS},
    "advogado": {area: TUDO for area in AREAS},
    # Apoia o advogado no dia a dia, mas não apaga nada e não vê dinheiro.
    "estagiario": {
        "clientes": _SEM_EXCLUIR,
        "processos": _SEM_EXCLUIR,
        "agenda": _SEM_EXCLUIR,
        "documentos": _VER_E_CRIAR,
        "tarefas": _SEM_EXCLUIR,
        "horas": _VER_E_CRIAR,
        "despesas": _VER_E_CRIAR,
        "modelos": _SO_VER,
        "advogados": _SO_VER,
        "ia": _SO_VER,
    },
    # Cuida de contratos, cobrança e custos; o resto só consulta.
    "financeiro": {
        "clientes": _SO_VER,
        "processos": _SO_VER,
        "agenda": _SO_VER,
        "documentos": _SO_VER,
        "tarefas": _SEM_EXCLUIR,
        "horas": _SO_VER,
        "despesas": TUDO,
        "financeiro": TUDO,
        "modelos": _SO_VER,
        "advogados": _SO_VER,
        "relatorios": _SO_VER,
        "exportar": _SO_VER,
        "ia": _SO_VER,
    },
    # Atendimento e agenda: cadastra clientes, marca compromissos e recebe
    # documentos, sem acesso ao financeiro nem à conversa com a IA.
    "secretaria": {
        "clientes": _SEM_EXCLUIR,
        "processos": _SO_VER,
        "agenda": TUDO,
        "documentos": _VER_E_CRIAR,
        "tarefas": _SEM_EXCLUIR,
        "despesas": _VER_E_CRIAR,
        "modelos": _SO_VER,
        "advogados": _SO_VER,
    },
}

_ACAO_POR_METODO = {
    "GET": VER,
    "HEAD": VER,
    "OPTIONS": VER,
    "POST": CRIAR,
    "PUT": EDITAR,
    "PATCH": EDITAR,
    "DELETE": EXCLUIR,
}


def pode(usuario, area, acao=VER):
    if usuario is None:
        return False
    return acao in MATRIZ.get(usuario.tipo_usuario, {}).get(area, frozenset())


def permissoes_do_perfil(tipo_usuario):
    """{"clientes": ["criar", "editar", "ver"], ...} — o que vai ao frontend."""
    matriz = MATRIZ.get(tipo_usuario, {})
    return {area: sorted(matriz.get(area, ())) for area in AREAS}


class PermissaoPorPerfil(BasePermission):
    """Aplica a matriz a uma view que declare `area_permissao`.

    A ação vem do método HTTP (GET = ver, POST = criar, PATCH = editar,
    DELETE = excluir). Ações customizadas que não seguem essa regra — gerar
    um documento a partir de um modelo é um POST, mas só exige poder ver o
    modelo — declaram a ação certa em `acoes_permissao`.
    """

    message = "Seu perfil de acesso não permite esta ação."

    def has_permission(self, request, view):
        area = getattr(view, "area_permissao", None)
        if area is None:
            return True

        acao = getattr(view, "acoes_permissao", {}).get(
            getattr(view, "action", None),
            _ACAO_POR_METODO.get(request.method, EDITAR),
        )
        return pode(get_usuario_from_request(request), area, acao)
