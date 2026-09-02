from django.urls import path
from rest_framework.routers import DefaultRouter

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
    ConfiguracoesView,
    ConfiguracoesContaView,
    ConfiguracoesSenhaView,
    ConfiguracoesPreferenciasView,
    ConfiguracoesEscritorioView,
    ConfiguracoesDesativarEscritorioView,
    ExportarClientesCSVView,
    ExportarProcessosCSVView,
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


urlpatterns = [
    path("escritorios/registrar/", EscritorioRegistroView.as_view(), name="escritorio-registrar"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
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
] + router.urls
