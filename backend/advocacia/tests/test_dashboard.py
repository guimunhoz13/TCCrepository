"""Dashboard e indicadores financeiros."""

from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import (
    Advogado,
    Agenda,
    ApontamentoHora,
    Cliente,
    Contrato,
    Despesa,
    Parcela,
    Processo,
    Tarefa,
    Usuario,
)
from .base import (
    _criar_escritorio,
    _criar_usuario,
    _EscritorioComDados,
    _gerar_token_de_acesso,
)


class IndicadoresFinanceirosAPITestCase(APITestCase):
    """A dashboard só mostrava contagens — nenhum número de dinheiro, embora
    contratos, parcelas, horas e despesas já estivessem no banco."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Indicadores",
            cpf="99999999999",
            email="cliente.indicadores@teste.com",
            telefone="11966666666",
            endereco="Rua I",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Indicadores",
            email="advogado.indicadores@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="999999/SP",
            especialidade="Cível",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-IND-1",
            titulo="Processo Indicadores",
            descricao="Descrição.",
            cliente=cliente,
            advogado=advogado,
        )
        self.contrato = Contrato.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo_honorario="fixo",
            valor_total=Decimal("3000.00"),
            forma_pagamento="parcelado",
            numero_parcelas=3,
        )
        self.hoje = timezone.localdate()
        self.inicio_do_mes = self.hoje.replace(day=1)

        # Uma parcela quitada neste mês, uma vencida e uma a vencer.
        self.paga = Parcela.objects.create(
            contrato=self.contrato,
            numero=1,
            valor=Decimal("1000.00"),
            data_vencimento=self.inicio_do_mes,
            status="pago",
            pago_em=timezone.now(),
        )
        self.vencida = Parcela.objects.create(
            contrato=self.contrato,
            numero=2,
            valor=Decimal("1000.00"),
            data_vencimento=self.hoje - timedelta(days=5),
            status="pendente",
        )
        self.a_vencer = Parcela.objects.create(
            contrato=self.contrato,
            numero=3,
            valor=Decimal("1000.00"),
            data_vencimento=self.hoje + timedelta(days=30),
            status="pendente",
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def _financeiro(self):
        resposta = self.client.get("/api/dashboard/stats/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        return resposta.data["financeiro"]

    def test_a_receber_soma_as_parcelas_em_aberto(self):
        self.assertEqual(Decimal(str(self._financeiro()["a_receber"])), Decimal("2000.00"))

    def test_recebido_no_mes_conta_so_o_que_foi_quitado_desde_o_dia_primeiro(self):
        self.assertEqual(
            Decimal(str(self._financeiro()["recebido_no_mes"])), Decimal("1000.00")
        )

    def test_parcela_quitada_no_mes_passado_nao_entra_no_recebido_do_mes(self):
        self.paga.pago_em = timezone.now() - timedelta(days=45)
        self.paga.save()

        self.assertEqual(Decimal(str(self._financeiro()["recebido_no_mes"])), Decimal("0.00"))

    def test_vencidas_olham_a_data_e_nao_o_status_da_parcela(self):
        # O status "atrasado" existe no modelo mas nada o atribui; quem decide
        # é a comparação do vencimento com a data de hoje.
        financeiro = self._financeiro()

        self.assertEqual(financeiro["parcelas_vencidas"], 1)
        self.assertEqual(Decimal(str(financeiro["valor_vencido"])), Decimal("1000.00"))

    def test_parcela_vencida_mas_ja_paga_nao_conta_como_vencida(self):
        self.vencida.status = "pago"
        self.vencida.pago_em = timezone.now()
        self.vencida.save()

        self.assertEqual(self._financeiro()["parcelas_vencidas"], 0)

    def test_horas_faturaveis_do_mes_somam_tempo_e_valor(self):
        ApontamentoHora.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            usuario=self.admin,
            data=self.hoje,
            minutos=120,
            descricao="Audiência.",
            faturavel=True,
            valor_hora=Decimal("250.00"),
        )
        ApontamentoHora.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            usuario=self.admin,
            data=self.hoje,
            minutos=30,
            descricao="Cortesia.",
            faturavel=False,
        )

        financeiro = self._financeiro()

        self.assertEqual(financeiro["minutos_faturaveis_no_mes"], 120)
        self.assertEqual(
            Decimal(str(financeiro["valor_horas_faturaveis_no_mes"])), Decimal("500.00")
        )

    def test_despesas_a_reembolsar_ignoram_as_ja_reembolsadas(self):
        Despesa.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo="custas",
            descricao="A reembolsar.",
            valor=Decimal("200.00"),
            data=self.hoje,
            reembolsavel=True,
            reembolsada=False,
        )
        Despesa.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo="copias",
            descricao="Já reembolsada.",
            valor=Decimal("80.00"),
            data=self.hoje,
            reembolsavel=True,
            reembolsada=True,
        )

        self.assertEqual(
            Decimal(str(self._financeiro()["despesas_a_reembolsar"])), Decimal("200.00")
        )

    def test_escritorio_sem_movimento_recebe_zeros(self):
        outro = _criar_escritorio(nome="Escritório Vazio", cnpj="11222333000181")
        usuario = _criar_usuario(outro, email="admin.vazio@teste.com")
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(usuario)}"
        )

        financeiro = self._financeiro()

        self.assertEqual(Decimal(str(financeiro["a_receber"])), Decimal("0.00"))
        self.assertEqual(financeiro["parcelas_vencidas"], 0)
        self.assertEqual(financeiro["minutos_faturaveis_no_mes"], 0)

    def test_indicadores_nao_misturam_escritorios(self):
        outro = _criar_escritorio(nome="Escritório Vizinho", cnpj="11222333000262")
        usuario = _criar_usuario(outro, email="admin.vizinho@teste.com")
        cliente = Cliente.objects.create(
            escritorio=outro,
            nome="Cliente do Vizinho",
            cpf="10101010101",
            email="cliente.vizinho@teste.com",
            telefone="11977777777",
            endereco="Rua V",
        )
        usuario_adv = Usuario.objects.create(
            escritorio=outro,
            nome="Advogado Vizinho",
            email="advogado.vizinho@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        adv = Advogado.objects.create(
            escritorio=outro, usuario=usuario_adv, oab="101010/SP", especialidade="Cível"
        )
        processo = Processo.objects.create(
            escritorio=outro,
            numero_processo="PROC-VIZ-1",
            titulo="Processo do vizinho",
            descricao="Descrição.",
            cliente=cliente,
            advogado=adv,
        )
        contrato = Contrato.objects.create(
            escritorio=outro,
            processo=processo,
            tipo_honorario="fixo",
            valor_total=Decimal("9000.00"),
        )
        Parcela.objects.create(
            contrato=contrato,
            numero=1,
            valor=Decimal("9000.00"),
            data_vencimento=self.hoje,
            status="pendente",
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(usuario)}"
        )
        self.assertEqual(Decimal(str(self._financeiro()["a_receber"])), Decimal("9000.00"))


class DashboardResumoAPITestCase(_EscritorioComDados, APITestCase):

    def setUp(self):
        self.escritorio, self.usuario, self.advogado, self.cliente = self._montar()
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.usuario)}"
        )

    def test_traz_totais_e_os_cinco_processos_mais_recentes(self):
        for i in range(7):
            self._processo(self.escritorio, self.cliente, self.advogado, f"P-{i}")

        resposta = self.client.get("/api/dashboard/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["totais"]["processos"], 7)
        numeros = [p["numero_processo"] for p in resposta.data["processos_recentes"]]
        self.assertEqual(numeros, ["P-6", "P-5", "P-4", "P-3", "P-2"])
        self.assertEqual(resposta.data["novos_na_semana"]["processos"], 7)
        self.assertEqual(resposta.data["novos_na_semana"]["clientes"], 1)

    def test_minhas_tarefas_so_inclui_as_abertas_de_quem_abriu(self):
        colega = _criar_usuario(self.escritorio, email="colega@teste.com", tipo_usuario="advogado")
        Tarefa.objects.create(escritorio=self.escritorio, titulo="Minha", responsavel=self.usuario)
        Tarefa.objects.create(
            escritorio=self.escritorio, titulo="Já feita", responsavel=self.usuario, status="concluida"
        )
        Tarefa.objects.create(escritorio=self.escritorio, titulo="Do colega", responsavel=colega)

        resposta = self.client.get("/api/dashboard/")

        self.assertEqual([t["titulo"] for t in resposta.data["minhas_tarefas"]], ["Minha"])

    def test_nao_mistura_dados_de_outro_escritorio(self):
        outro, _, adv_outro, cli_outro = self._montar(
            nome="Outro", cnpj="99999999000199", email="o@o.com", sufixo="b"
        )
        self._processo(outro, cli_outro, adv_outro, "ALHEIO-1")
        Agenda.objects.create(escritorio=outro, titulo="Audiência alheia", data_evento=timezone.now())

        resposta = self.client.get("/api/dashboard/")

        self.assertEqual(resposta.data["processos_recentes"], [])
        self.assertEqual(resposta.data["agenda"], [])
        self.assertEqual(resposta.data["totais"]["clientes"], 1)

    def test_exige_autenticacao(self):
        self.client.credentials()
        self.assertEqual(self.client.get("/api/dashboard/").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_financeiro_mensal_traz_seis_meses_com_recebido_e_despesas(self):
        processo = self._processo(self.escritorio, self.cliente, self.advogado, "F-1")
        contrato = Contrato.objects.create(
            escritorio=self.escritorio, processo=processo, valor_total=Decimal("900.00")
        )
        hoje = timezone.localdate()
        Parcela.objects.create(
            contrato=contrato, numero=1, valor=Decimal("300.00"),
            data_vencimento=hoje, status="pago", pago_em=timezone.now(),
        )
        Parcela.objects.create(
            contrato=contrato, numero=2, valor=Decimal("600.00"),
            data_vencimento=hoje, status="pendente",
        )
        Despesa.objects.create(
            escritorio=self.escritorio, processo=processo, descricao="Custas",
            valor=Decimal("120.50"), data=hoje,
        )
        # Despesa de um ano atrás fica fora da janela de seis meses.
        Despesa.objects.create(
            escritorio=self.escritorio, processo=processo, descricao="Antiga",
            valor=Decimal("999.00"), data=hoje - timedelta(days=370),
        )

        serie = self.client.get("/api/dashboard/").data["financeiro_mensal"]

        self.assertEqual(len(serie), 6)
        self.assertEqual(serie[-1]["mes"], hoje.strftime("%Y-%m"))
        self.assertEqual(Decimal(serie[-1]["recebido"]), Decimal("300.00"))
        self.assertEqual(Decimal(serie[-1]["despesas"]), Decimal("120.50"))
        self.assertTrue(all(Decimal(m["despesas"]) == 0 for m in serie[:-1]))
