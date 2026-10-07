from django.urls import path
from rest_framework.routers import DefaultRouter

from .noticias import NoticiasJuridicasView
from .views import (
    EscritorioRegistroView,
    ConfirmarEmailView,
    DashboardStatsView,
    DashboardResumoView,
    BuscaGlobalView,
    AdvogadoRegistroView,
    MembroRegistroView,
    SolicitarRedefinicaoSenhaView,
    RedefinirSenhaView,
    AssistenteIAView,
    EscritorioViewSet,
    UsuarioViewSet,
    ClienteViewSet,
    AdvogadoViewSet,
    ProcessoViewSet,
    MovimentacaoViewSet,
    DocumentoViewSet,
    CalcularPrazoView,
    AgendaViewSet,
    FeriadoLocalViewSet,
    AgendaFeedView,
    ContratoViewSet,
    ParcelaViewSet,
    ApontamentoHoraViewSet,
    DespesaViewSet,
    TarefaViewSet,
    IntimacaoViewSet,
    PlanoAtualView,
    PlanosView,
    PushView,
    PushInscreverView,
    PushCancelarView,
    PushTestarView,
    ModeloDocumentoViewSet,
    RegistrarAtividadeView,
    TempoDeUsoView,
    AuditoriaViewSet,
    MasterAuditoriaViewSet,
    ConfiguracoesView,
    ConfiguracoesContaView,
    ConfiguracoesSenhaView,
    ConfiguracoesDoisFatoresView,
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
router.register(r"feriados-locais", FeriadoLocalViewSet, basename="feriado-local")
router.register(r"contratos", ContratoViewSet, basename="contrato")
router.register(r"parcelas", ParcelaViewSet, basename="parcela")
router.register(r"apontamentos", ApontamentoHoraViewSet, basename="apontamento")
router.register(r"despesas", DespesaViewSet, basename="despesa")
router.register(r"tarefas", TarefaViewSet, basename="tarefa")
router.register(r"intimacoes", IntimacaoViewSet, basename="intimacao")
router.register(r"modelos-documento", ModeloDocumentoViewSet, basename="modelo-documento")
router.register(r"auditoria", AuditoriaViewSet, basename="auditoria")

master_router = DefaultRouter()
master_router.register(r"master/escritorios", MasterEscritorioViewSet, basename="master-escritorio")
master_router.register(r"master/auditoria", MasterAuditoriaViewSet, basename="master-auditoria")


urlpatterns = [
    path("escritorios/registrar/", EscritorioRegistroView.as_view(), name="escritorio-registrar"),
    path("escritorios/confirmar-email/", ConfirmarEmailView.as_view(), name="confirmar-email"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("dashboard/", DashboardResumoView.as_view(), name="dashboard-resumo"),
    path("busca/", BuscaGlobalView.as_view(), name="busca-global"),
    path("noticias/", NoticiasJuridicasView.as_view(), name="noticias-juridicas"),
    path("advogados/registrar/", AdvogadoRegistroView.as_view(), name="advogado-registrar"),
    path("equipe/registrar/", MembroRegistroView.as_view(), name="membro-registrar"),
    path("login/esqueci-senha/", SolicitarRedefinicaoSenhaView.as_view(), name="solicitar-redefinicao-senha"),
    path("login/redefinir-senha/", RedefinirSenhaView.as_view(), name="redefinir-senha"),
    path("assistente-ia/", AssistenteIAView.as_view(), name="assistente-ia"),
    path("agenda/feed/<str:token>.ics", AgendaFeedView.as_view(), name="agenda-feed"),
    path("agenda/calcular-prazo/", CalcularPrazoView.as_view(), name="calcular-prazo"),
    path("planos/", PlanosView.as_view(), name="planos"),
    path("plano/", PlanoAtualView.as_view(), name="plano-atual"),
    path("push/", PushView.as_view(), name="push"),
    path("push/inscrever/", PushInscreverView.as_view(), name="push-inscrever"),
    path("push/cancelar/", PushCancelarView.as_view(), name="push-cancelar"),
    path("push/testar/", PushTestarView.as_view(), name="push-testar"),
    path("atividade/", RegistrarAtividadeView.as_view(), name="registrar-atividade"),
    path("relatorios/tempo-uso/", TempoDeUsoView.as_view(), name="tempo-de-uso"),
    path("configuracoes/", ConfiguracoesView.as_view(), name="configuracoes"),
    path("configuracoes/conta/", ConfiguracoesContaView.as_view(), name="configuracoes-conta"),
    path("configuracoes/senha/", ConfiguracoesSenhaView.as_view(), name="configuracoes-senha"),
    path("configuracoes/2fa/", ConfiguracoesDoisFatoresView.as_view(), name="configuracoes-2fa"),
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
