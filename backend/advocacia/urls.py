from rest_framework.routers import DefaultRouter

from .views import (
    UsuarioViewSet,
    ClienteViewSet,
    AdvogadoViewSet,
    ProcessoViewSet,
    MovimentacaoViewSet,
    DocumentoViewSet,
    AgendaViewSet,
)


router = DefaultRouter()

router.register(
    r'usuarios',
    UsuarioViewSet,
    basename='usuario'
)

router.register(
    r'clientes',
    ClienteViewSet,
    basename='cliente'
)

router.register(
    r'advogados',
    AdvogadoViewSet,
    basename='advogado'
)

router.register(
    r'processos',
    ProcessoViewSet,
    basename='processo'
)

router.register(
    r'movimentacoes',
    MovimentacaoViewSet,
    basename='movimentacao'
)

router.register(
    r'documentos',
    DocumentoViewSet,
    basename='documento'
)

router.register(
    r'agenda',
    AgendaViewSet,
    basename='agenda'
)


urlpatterns = router.urls