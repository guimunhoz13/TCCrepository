"""Timesheet, despesas e tempo de uso."""

from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import (
    JANELA_SESSAO_MINUTOS,
    Advogado,
    ApontamentoHora,
    Cliente,
    Despesa,
    Escritorio,
    Processo,
    SessaoUso,
    Usuario,
)
from .base import _criar_escritorio, _criar_usuario, _gerar_token_de_acesso


class ApontamentoHoraAPITestCase(APITestCase):
    """Testa o apontamento de horas por processo (timesheet)."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Horas",
            cpf="55555555555",
            email="cliente.horas@teste.com",
            telefone="11922222222",
            endereco="Rua H",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Horas",
            email="advogado.horas@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="777777/SP",
            especialidade="Trabalhista",
            valor_hora_padrao=Decimal("300.00"),
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-HORA-1",
            titulo="Processo Horas",
            descricao="Descrição.",
            cliente=cliente,
            advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_criar_apontamento_calcula_horas_e_valor(self):
        resposta = self.client.post(
            "/api/apontamentos/",
            {
                "processo": self.processo.id,
                "data": timezone.localdate().isoformat(),
                "minutos": 90,
                "descricao": "Elaboração de petição inicial.",
                "faturavel": True,
                "valor_hora": "300.00",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        self.assertEqual(resposta.data["horas"], "1.50")
        self.assertEqual(resposta.data["valor"], "450.00")

    def test_apontamento_e_lancado_em_nome_de_quem_esta_logado(self):
        resposta = self.client.post(
            "/api/apontamentos/",
            {
                "processo": self.processo.id,
                "data": timezone.localdate().isoformat(),
                "minutos": 60,
                "descricao": "Reunião com o cliente.",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["usuario"], self.admin.id)

    def test_hora_nao_faturavel_nao_tem_valor(self):
        apontamento = ApontamentoHora.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            usuario=self.admin,
            data=timezone.localdate(),
            minutos=60,
            descricao="Retrabalho interno.",
            faturavel=False,
            valor_hora=Decimal("300.00"),
        )

        self.assertIsNone(apontamento.valor)

    def test_apontamento_em_data_futura_e_rejeitado(self):
        resposta = self.client.post(
            "/api/apontamentos/",
            {
                "processo": self.processo.id,
                "data": (timezone.localdate() + timezone.timedelta(days=1)).isoformat(),
                "minutos": 60,
                "descricao": "Trabalho do futuro.",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_apontamento_acima_de_24h_e_rejeitado(self):
        resposta = self.client.post(
            "/api/apontamentos/",
            {
                "processo": self.processo.id,
                "data": timezone.localdate().isoformat(),
                "minutos": 1500,
                "descricao": "Dia impossível.",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_minutos_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/apontamentos/",
            {
                "processo": self.processo.id,
                "data": timezone.localdate().isoformat(),
                "minutos": 0,
                "descricao": "Nada feito.",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filtro_por_processo(self):
        outro_processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-HORA-2",
            titulo="Outro",
            descricao="Descrição.",
            cliente=self.processo.cliente,
            advogado=self.advogado,
        )
        for processo in (self.processo, outro_processo):
            ApontamentoHora.objects.create(
                escritorio=self.escritorio,
                processo=processo,
                usuario=self.admin,
                data=timezone.localdate(),
                minutos=60,
                descricao="Trabalho.",
            )

        resposta = self.client.get(f"/api/apontamentos/?processo={self.processo.id}")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resposta.data["results"]), 1)

    def test_apontamento_de_outro_escritorio_nao_aparece(self):
        outro = Escritorio.objects.create(
            nome="Outro Escritório",
            cnpj="88.888.888/0001-88",
            email="outro2@escritorio.com",
            telefone="11911111111",
            endereco="Rua Y",
        )
        outro_usuario = Usuario.objects.create(
            escritorio=outro,
            nome="Alheio",
            email="alheio@outro.com",
            senha=make_password("senha12345"),
            tipo_usuario="admin",
        )
        outro_cliente = Cliente.objects.create(
            escritorio=outro, nome="C", cpf="11111111112",
            email="c@outro.com", telefone="11900000000", endereco="Rua Z",
        )
        outro_advogado = Advogado.objects.create(
            escritorio=outro,
            usuario=outro_usuario,
            oab="999999/SP",
            especialidade="Civil",
        )
        outro_processo = Processo.objects.create(
            escritorio=outro, numero_processo="PROC-OUTRO",
            titulo="Alheio", descricao="d", cliente=outro_cliente,
            advogado=outro_advogado,
        )
        ApontamentoHora.objects.create(
            escritorio=outro, processo=outro_processo, usuario=outro_usuario,
            data=timezone.localdate(), minutos=120, descricao="Alheio.",
        )

        resposta = self.client.get("/api/apontamentos/")

        self.assertEqual(len(resposta.data["results"]), 0)


class DespesaAPITestCase(APITestCase):
    """Testa o lançamento de custas e despesas processuais."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Despesa",
            cpf="66666666666",
            email="cliente.despesa@teste.com",
            telefone="11933333333",
            endereco="Rua D",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Despesa",
            email="advogado.despesa@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="121212/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-DESP-1",
            titulo="Processo Despesa",
            descricao="Descrição.",
            cliente=cliente,
            advogado=advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_criar_despesa(self):
        resposta = self.client.post(
            "/api/despesas/",
            {
                "processo": self.processo.id,
                "tipo": "custas",
                "descricao": "Custas iniciais.",
                "valor": "250.00",
                "data": timezone.localdate().isoformat(),
                "reembolsavel": True,
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        self.assertEqual(resposta.data["tipo_display"], "Custas processuais")

    def test_despesa_registra_quem_lancou(self):
        self.client.post(
            "/api/despesas/",
            {
                "processo": self.processo.id,
                "tipo": "diligencia",
                "descricao": "Diligência.",
                "valor": "80.00",
                "data": timezone.localdate().isoformat(),
            },
        )

        despesa = Despesa.objects.get(descricao="Diligência.")
        self.assertEqual(despesa.criado_por, self.admin)

    def test_valor_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/despesas/",
            {
                "processo": self.processo.id,
                "tipo": "custas",
                "descricao": "Grátis.",
                "valor": "0.00",
                "data": timezone.localdate().isoformat(),
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nao_reembolsavel_nao_pode_ser_reembolsada(self):
        resposta = self.client.post(
            "/api/despesas/",
            {
                "processo": self.processo.id,
                "tipo": "outros",
                "descricao": "Café do escritório.",
                "valor": "15.00",
                "data": timezone.localdate().isoformat(),
                "reembolsavel": False,
                "reembolsada": True,
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filtro_por_reembolsavel(self):
        for reembolsavel in (True, False):
            Despesa.objects.create(
                escritorio=self.escritorio,
                processo=self.processo,
                tipo="custas",
                descricao="Despesa.",
                valor=Decimal("100.00"),
                data=timezone.localdate(),
                reembolsavel=reembolsavel,
            )

        resposta = self.client.get("/api/despesas/?reembolsavel=true")

        self.assertEqual(len(resposta.data["results"]), 1)


class TempoDeUsoAPITestCase(APITestCase):
    """Testa a medição de tempo de uso do sistema por usuário."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.advogado_usuario = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Tempo",
            email="advogado.tempo@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_primeiro_sinal_abre_uma_sessao(self):
        resposta = self.client.post("/api/atividade/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(SessaoUso.objects.filter(usuario=self.admin).count(), 1)

    def test_sinal_seguido_estende_a_mesma_sessao(self):
        self.client.post("/api/atividade/")
        self.client.post("/api/atividade/")

        self.assertEqual(SessaoUso.objects.filter(usuario=self.admin).count(), 1)

    def test_sinal_apos_a_janela_abre_nova_sessao(self):
        self.client.post("/api/atividade/")

        sessao = SessaoUso.objects.get(usuario=self.admin)
        antigo = timezone.now() - timezone.timedelta(minutes=JANELA_SESSAO_MINUTOS + 5)
        SessaoUso.objects.filter(pk=sessao.pk).update(inicio=antigo, ultima_atividade=antigo)

        self.client.post("/api/atividade/")

        self.assertEqual(SessaoUso.objects.filter(usuario=self.admin).count(), 2)

    def test_duracao_e_a_diferenca_entre_inicio_e_ultima_atividade(self):
        inicio = timezone.now() - timezone.timedelta(minutes=45)
        sessao = SessaoUso.objects.create(
            escritorio=self.escritorio,
            usuario=self.admin,
            inicio=inicio,
            ultima_atividade=inicio + timezone.timedelta(minutes=45),
        )

        self.assertEqual(sessao.duracao_minutos, 45)

    def test_relatorio_soma_o_tempo_do_mes(self):
        agora = timezone.now()
        for minutos in (30, 20):
            SessaoUso.objects.create(
                escritorio=self.escritorio,
                usuario=self.admin,
                inicio=agora - timezone.timedelta(minutes=minutos),
                ultima_atividade=agora,
            )

        resposta = self.client.get("/api/relatorios/tempo-uso/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        linha = next(u for u in resposta.data["usuarios"] if u["usuario"] == self.admin.id)
        self.assertEqual(linha["minutos"], 50)
        self.assertEqual(linha["sessoes"], 2)

    def test_admin_ve_o_tempo_de_toda_a_equipe(self):
        agora = timezone.now()
        SessaoUso.objects.create(
            escritorio=self.escritorio,
            usuario=self.advogado_usuario,
            inicio=agora - timezone.timedelta(minutes=60),
            ultima_atividade=agora,
        )

        resposta = self.client.get("/api/relatorios/tempo-uso/")

        nomes = [u["usuario_nome"] for u in resposta.data["usuarios"]]
        self.assertIn("Advogado Tempo", nomes)

    def test_nao_admin_ve_apenas_o_proprio_tempo(self):
        agora = timezone.now()
        for usuario in (self.admin, self.advogado_usuario):
            SessaoUso.objects.create(
                escritorio=self.escritorio,
                usuario=usuario,
                inicio=agora - timezone.timedelta(minutes=30),
                ultima_atividade=agora,
            )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.advogado_usuario)}"
        )
        resposta = self.client.get("/api/relatorios/tempo-uso/")

        ids = [u["usuario"] for u in resposta.data["usuarios"]]
        self.assertEqual(ids, [self.advogado_usuario.id])

    def test_mes_invalido_e_rejeitado(self):
        resposta = self.client.get("/api/relatorios/tempo-uso/?mes=setembro")

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mes_sem_uso_retorna_lista_vazia(self):
        resposta = self.client.get("/api/relatorios/tempo-uso/?mes=2020-01")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["usuarios"], [])
