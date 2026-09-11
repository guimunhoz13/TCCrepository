from django.urls import path
from rest_framework.routers import DefaultRouter

from .noticias import NoticiasJuridicasView
from .views import (
    EscritorioRegistroView,
    DashboardStatsView,
    AdvogadoRegistroView,
    VerificarEmailView,
    AssistenteIAView,
    EscritorioViewSet,
    UsuarioViewSet,
    ClienteViewSet,
    AdvogadoViewSet,
    ProcessoViewSet,
    MovimentacaoViewSet,
    DocumentoViewSet,
    AgendaViewSet,
    ContratoViewSet,
    ParcelaViewSet,
    ConfiguracoesView,
    ConfiguracoesContaView,
    ConfiguracoesSenhaView,
    ConfiguracoesPreferenciasView,
    ConfiguracoesEscritorioView,
    ConfiguracoesDesativarEscritorioView,
    ExportarClientesCSVView,
    ExportarProcessosCSVView,
    RelatorioClienteView,
    RelatorioProcessoView,
    RelatorioClienteEmailView,
    RelatorioProcessoEmailView,
    MasterLoginView,
    MasterEscritorioViewSet,
    MasterStatsView,
)


router = DefaultRouter()

router.register(r"escritorios", EscritorioViewSet, basename="escritorio")
router.register(r"usuarios", UsuarioViewSet, basename="usuario")
router.register(r"clientes", ClienteViewSet, basename="cliente")
router.register(r"advogados", AdvogadoViewSet, basename="advogado")
router.register(r"processos", ProcessoViewSet, basename="processo")
router.register(r"movimentacoes", MovimentacaoViewSet, basename="movimentacao")
router.register(r"documentos", DocumentoViewSet, basename="documento")
router.register(r"agenda", AgendaViewSet, basename="agenda")
router.register(r"contratos", ContratoViewSet, basename="contrato")
router.register(r"parcelas", ParcelaViewSet, basename="parcela")

master_router = DefaultRouter()
master_router.register(r"master/escritorios", MasterEscritorioViewSet, basename="master-escritorio")


urlpatterns = [
    path("escritorios/registrar/", EscritorioRegistroView.as_view(), name="escritorio-registrar"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("noticias/", NoticiasJuridicasView.as_view(), name="noticias-juridicas"),
    path("advogados/registrar/", AdvogadoRegistroView.as_view(), name="advogado-registrar"),
    path("login/verificar-email/", VerificarEmailView.as_view(), name="verificar-email"),
    path("assistente-ia/", AssistenteIAView.as_view(), name="assistente-ia"),
    path("configuracoes/", ConfiguracoesView.as_view(), name="configuracoes"),
    path("configuracoes/conta/", ConfiguracoesContaView.as_view(), name="configuracoes-conta"),
    path("configuracoes/senha/", ConfiguracoesSenhaView.as_view(), name="configuracoes-senha"),
    path("configuracoes/preferencias/", ConfiguracoesPreferenciasView.as_view(), name="configuracoes-preferencias"),
    path("configuracoes/escritorio/", ConfiguracoesEscritorioView.as_view(), name="configuracoes-escritorio"),
    path("configuracoes/desativar-escritorio/", ConfiguracoesDesativarEscritorioView.as_view(), name="configuracoes-desativar-escritorio"),
    path("configuracoes/exportar/clientes/", ExportarClientesCSVView.as_view(), name="exportar-clientes"),
    path("configuracoes/exportar/processos/", ExportarProcessosCSVView.as_view(), name="exportar-processos"),
    path("configuracoes/relatorio/cliente/<int:cliente_id>/", RelatorioClienteView.as_view(), name="relatorio-cliente"),
    path("configuracoes/relatorio/processo/<int:processo_id>/", RelatorioProcessoView.as_view(), name="relatorio-processo"),
    path("configuracoes/relatorio/cliente/<int:cliente_id>/email/", RelatorioClienteEmailView.as_view(), name="relatorio-cliente-email"),
    path("configuracoes/relatorio/processo/<int:processo_id>/email/", RelatorioProcessoEmailView.as_view(), name="relatorio-processo-email"),
    path("master/login/", MasterLoginView.as_view(), name="master-login"),
    path("master/stats/", MasterStatsView.as_view(), name="master-stats"),
] + router.urls + master_router.urls
