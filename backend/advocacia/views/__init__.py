"""Views da API, separadas por assunto.

Este pacote reexporta todas as views para que `from advocacia.views import X`
continue funcionando (urls.py, core/urls.py e testes).
"""

from .sessao import RenovarTokenView, LogoutView, LoginView, LoginSegundoFatorView, SolicitarRedefinicaoSenhaView, RedefinirSenhaView  # noqa: F401
from .cadastro import EscritorioRegistroView, ConfirmarEmailView  # noqa: F401
from .dashboard import DashboardStatsView, DashboardResumoView  # noqa: F401
from .busca import BuscaGlobalView  # noqa: F401
from .equipe import EscritorioViewSet, UsuarioViewSet, MembroRegistroView, AdvogadoRegistroView, AdvogadoViewSet  # noqa: F401
from .clientes import ClienteViewSet  # noqa: F401
from .processos import ProcessoViewSet, MovimentacaoViewSet, DocumentoViewSet  # noqa: F401
from .intimacoes import IntimacaoViewSet  # noqa: F401
from .agenda import CalcularPrazoView, AgendaViewSet, AgendaFeedView  # noqa: F401
from .financeiro import ContratoViewSet, ParcelaViewSet  # noqa: F401
from .horas_e_despesas import ApontamentoHoraViewSet, DespesaViewSet  # noqa: F401
from .ia import AssistenteIAView  # noqa: F401
from .configuracoes import ConfiguracoesView, ConfiguracoesContaView, ConfiguracoesSenhaView, ConfiguracoesDoisFatoresView, ConfiguracoesPreferenciasView, ConfiguracoesEscritorioView, ConfiguracoesDesativarEscritorioView  # noqa: F401
from .relatorios import RelatorioClienteView, RelatorioProcessoView, RelatorioClienteEmailView, RelatorioProcessoEmailView, ExportarClientesCSVView, ExportarProcessosCSVView  # noqa: F401
from .auditoria import AuditoriaViewSet  # noqa: F401
from .mestre import MasterLoginView, MasterEscritorioViewSet, MasterAuditoriaViewSet, MasterStatsView  # noqa: F401
from .tarefas import TarefaViewSet  # noqa: F401
from .uso import RegistrarAtividadeView, TempoDeUsoView  # noqa: F401
from .modelos import ModeloDocumentoViewSet  # noqa: F401
from .notificacoes_push import PushView, PushInscreverView, PushCancelarView, PushTestarView  # noqa: F401

__all__ = [
    "RenovarTokenView",
    "LogoutView",
    "LoginView",
    "LoginSegundoFatorView",
    "SolicitarRedefinicaoSenhaView",
    "RedefinirSenhaView",
    "EscritorioRegistroView",
    "ConfirmarEmailView",
    "DashboardStatsView",
    "DashboardResumoView",
    "BuscaGlobalView",
    "EscritorioViewSet",
    "UsuarioViewSet",
    "MembroRegistroView",
    "AdvogadoRegistroView",
    "AdvogadoViewSet",
    "ClienteViewSet",
    "ProcessoViewSet",
    "MovimentacaoViewSet",
    "DocumentoViewSet",
    "IntimacaoViewSet",
    "CalcularPrazoView",
    "AgendaViewSet",
    "AgendaFeedView",
    "ContratoViewSet",
    "ParcelaViewSet",
    "ApontamentoHoraViewSet",
    "DespesaViewSet",
    "AssistenteIAView",
    "ConfiguracoesView",
    "ConfiguracoesContaView",
    "ConfiguracoesSenhaView",
    "ConfiguracoesDoisFatoresView",
    "ConfiguracoesPreferenciasView",
    "ConfiguracoesEscritorioView",
    "ConfiguracoesDesativarEscritorioView",
    "RelatorioClienteView",
    "RelatorioProcessoView",
    "RelatorioClienteEmailView",
    "RelatorioProcessoEmailView",
    "ExportarClientesCSVView",
    "ExportarProcessosCSVView",
    "AuditoriaViewSet",
    "MasterLoginView",
    "MasterEscritorioViewSet",
    "MasterAuditoriaViewSet",
    "MasterStatsView",
    "TarefaViewSet",
    "RegistrarAtividadeView",
    "TempoDeUsoView",
    "ModeloDocumentoViewSet",
    "PushView",
    "PushInscreverView",
    "PushCancelarView",
    "PushTestarView",
]
