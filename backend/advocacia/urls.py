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
] + router.urls
