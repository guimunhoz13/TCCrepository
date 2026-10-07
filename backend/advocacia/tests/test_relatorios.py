"""Relatórios financeiros e exportação CSV segura."""

import csv
import io
from datetime import date
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.core import mail
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import (
    Advogado,
    ApontamentoHora,
    Cliente,
    Contrato,
    Despesa,
    Parcela,
    Processo,
    Usuario,
)
from .base import _criar_escritorio, _criar_usuario, _gerar_token_de_acesso


class RelatorioFinanceiroAPITestCase(APITestCase):
    """O relatório de cliente e o de processo nasceram antes dos módulos de
    contrato, horas e despesas, e por isso mostravam só processos, documentos
    e agenda. Estes testes cobrem a parte financeira que faltava."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Relatório",
            cpf="66666666666",
            email="cliente.relatorio@teste.com",
            telefone="11933333333",
            endereco="Rua R",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Relatório",
            email="advogado.relatorio@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="888888/SP",
            especialidade="Cível",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-REL-1",
            titulo="Processo Relatório",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )

        self.contrato = Contrato.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo_honorario="fixo",
            valor_total=Decimal("6000.00"),
            forma_pagamento="parcelado",
            numero_parcelas=3,
        )
        for numero in (1, 2, 3):
            Parcela.objects.create(
                contrato=self.contrato,
                numero=numero,
                valor=Decimal("2000.00"),
                data_vencimento=date(2026, numero, 10),
                status="pago" if numero == 1 else "pendente",
            )

        # Duas horas faturáveis a R$ 300/h e uma de cortesia.
        ApontamentoHora.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            usuario=self.admin,
            data=date(2026, 3, 10),
            minutos=120,
            descricao="Audiência.",
            faturavel=True,
            valor_hora=Decimal("300.00"),
        )
        ApontamentoHora.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            usuario=self.admin,
            data=date(2026, 3, 11),
            minutos=60,
            descricao="Reunião de cortesia.",
            faturavel=False,
        )

        Despesa.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo="custas",
            descricao="Guia de custas iniciais.",
            valor=Decimal("312.45"),
            data=date(2026, 3, 12),
            reembolsavel=True,
            reembolsada=False,
        )
        Despesa.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo="copias",
            descricao="Cópias autenticadas.",
            valor=Decimal("40.00"),
            data=date(2026, 3, 13),
            reembolsavel=False,
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_relatorio_do_cliente_traz_contratos_horas_e_despesas(self):
        resposta = self.client.get(f"/api/configuracoes/relatorio/cliente/{self.cliente.id}/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(len(resposta.data["contratos"]), 1)
        self.assertEqual(len(resposta.data["apontamentos"]), 2)
        self.assertEqual(len(resposta.data["despesas"]), 2)

    def test_resumo_do_cliente_consolida_os_valores(self):
        resposta = self.client.get(f"/api/configuracoes/relatorio/cliente/{self.cliente.id}/")
        resumo = resposta.data["resumo"]

        self.assertEqual(resumo["minutos_trabalhados"], 180)
        self.assertEqual(resumo["minutos_faturaveis"], 120)
        # Só as duas horas faturáveis viram dinheiro: 2h x R$ 300.
        self.assertEqual(Decimal(str(resumo["valor_horas_faturaveis"])), Decimal("600.00"))
        self.assertEqual(Decimal(str(resumo["total_despesas"])), Decimal("352.45"))
        self.assertEqual(Decimal(str(resumo["despesas_a_reembolsar"])), Decimal("312.45"))
        self.assertEqual(Decimal(str(resumo["valor_contratado"])), Decimal("6000.00"))
        self.assertEqual(Decimal(str(resumo["valor_pago"])), Decimal("2000.00"))
        self.assertEqual(Decimal(str(resumo["valor_pendente"])), Decimal("4000.00"))

    def test_hora_sem_valor_hora_nao_entra_no_valor_a_cobrar(self):
        ApontamentoHora.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            usuario=self.admin,
            data=date(2026, 3, 14),
            minutos=60,
            descricao="Hora faturável sem valor combinado.",
            faturavel=True,
            valor_hora=None,
        )

        resposta = self.client.get(f"/api/configuracoes/relatorio/cliente/{self.cliente.id}/")
        resumo = resposta.data["resumo"]

        self.assertEqual(resumo["minutos_faturaveis"], 180)
        self.assertEqual(Decimal(str(resumo["valor_horas_faturaveis"])), Decimal("600.00"))

    def test_relatorio_do_processo_tambem_traz_o_financeiro(self):
        resposta = self.client.get(f"/api/configuracoes/relatorio/processo/{self.processo.id}/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(len(resposta.data["contratos"]), 1)
        self.assertEqual(len(resposta.data["apontamentos"]), 2)
        self.assertEqual(
            Decimal(str(resposta.data["resumo"]["valor_pendente"])), Decimal("4000.00")
        )

    def test_relatorio_nao_soma_dados_de_outro_cliente(self):
        outro_cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Outro Cliente",
            cpf="77777777777",
            email="outro.cliente@teste.com",
            telefone="11944444444",
            endereco="Rua O",
        )
        outro_processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-REL-2",
            titulo="Processo de outro cliente",
            descricao="Descrição.",
            cliente=outro_cliente,
            advogado=self.advogado,
        )
        Despesa.objects.create(
            escritorio=self.escritorio,
            processo=outro_processo,
            tipo="custas",
            descricao="Despesa alheia.",
            valor=Decimal("999.00"),
            data=date(2026, 3, 15),
        )

        resposta = self.client.get(f"/api/configuracoes/relatorio/cliente/{self.cliente.id}/")

        self.assertEqual(len(resposta.data["despesas"]), 2)
        self.assertEqual(
            Decimal(str(resposta.data["resumo"]["total_despesas"])), Decimal("352.45")
        )

    def test_cliente_sem_lancamentos_tem_resumo_zerado(self):
        cliente_novo = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Sem Nada",
            cpf="88888888888",
            email="cliente.sem.nada@teste.com",
            telefone="11955555555",
            endereco="Rua S",
        )

        resposta = self.client.get(f"/api/configuracoes/relatorio/cliente/{cliente_novo.id}/")
        resumo = resposta.data["resumo"]

        self.assertEqual(resumo["minutos_trabalhados"], 0)
        self.assertEqual(Decimal(str(resumo["valor_contratado"])), Decimal("0.00"))
        self.assertEqual(Decimal(str(resumo["valor_pendente"])), Decimal("0.00"))

    def test_email_do_relatorio_de_cliente_lista_o_financeiro(self):
        resposta = self.client.post(
            f"/api/configuracoes/relatorio/cliente/{self.cliente.id}/email/",
            {"destinatario": "destino@teste.com"},
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(len(mail.outbox), 1)

        corpo_html = mail.outbox[0].alternatives[0][0]
        self.assertIn("Contratos", corpo_html)
        self.assertIn("Guia de custas iniciais.", corpo_html)
        self.assertIn("Audiência.", corpo_html)
        self.assertIn("R$ 4.000,00", corpo_html)
        # Hora de cortesia aparece, mas sem valor a cobrar.
        self.assertIn("não faturável", corpo_html)
        # Datas chegam ao builder já serializadas em ISO e precisam sair em pt-BR.
        self.assertIn("10/03/2026", corpo_html)
        self.assertNotIn("2026-03-10", corpo_html)

    def test_email_do_relatorio_de_processo_lista_o_financeiro(self):
        resposta = self.client.post(
            f"/api/configuracoes/relatorio/processo/{self.processo.id}/email/",
            {"destinatario": "destino@teste.com"},
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        corpo_html = mail.outbox[0].alternatives[0][0]
        self.assertIn("Despesas", corpo_html)
        self.assertIn("R$ 352,45", corpo_html)


class ExportacaoCSVSeguraAPITestCase(APITestCase):
    """Um nome ou endereço de cliente que comece com =, +, -, @, tab ou CR
    vira fórmula executável ao abrir o CSV exportado no Excel/Sheets. A
    exportação precisa neutralizar isso sem estragar valores normais."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def _linhas_csv(self, resposta):
        texto = resposta.content.decode("utf-8-sig")
        return list(csv.reader(io.StringIO(texto), delimiter=";"))

    def test_exportacao_de_clientes_neutraliza_nome_com_formula(self):
        Cliente.objects.create(
            escritorio=self.escritorio, nome="=CMD|'/c calc'!A1", cpf="11122233344",
            email="injecao@teste.com", telefone="11988887777", endereco="+SOMA(A1:A9)",
        )
        Cliente.objects.create(
            escritorio=self.escritorio, nome="Cliente Normal", cpf="22233344455",
            email="normal@teste.com", telefone="11977776666", endereco="Rua Normal, 10",
        )

        resposta = self.client.get("/api/configuracoes/exportar/clientes/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

        linhas = self._linhas_csv(resposta)
        linha_injecao = next(l for l in linhas if "CMD" in l[0])
        self.assertTrue(linha_injecao[0].startswith("'="))
        self.assertTrue(linha_injecao[6].startswith("'+"))

        linha_normal = next(l for l in linhas if "Normal" in l[0])
        self.assertEqual(linha_normal[0], "Cliente Normal")
        self.assertEqual(linha_normal[6], "Rua Normal, 10")

    def test_exportacao_de_processos_neutraliza_titulo_com_formula(self):
        cliente = Cliente.objects.create(
            escritorio=self.escritorio, nome="Cliente Proc", cpf="33344455566",
            email="clienteproc@teste.com", telefone="11966665555", endereco="Rua P",
        )
        usuario_adv = Usuario.objects.create(
            escritorio=self.escritorio, nome="Advogado Proc", email="advproc@teste.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio, usuario=usuario_adv, oab="111222/SP", especialidade="Cível",
        )
        Processo.objects.create(
            escritorio=self.escritorio, numero_processo="PROC-CSV-1",
            titulo="@SUM(1+1)*cmd|' /c calc'!A0", descricao="d",
            cliente=cliente, advogado=advogado,
        )

        resposta = self.client.get("/api/configuracoes/exportar/processos/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

        linhas = self._linhas_csv(resposta)
        linha = next(l for l in linhas if "SUM" in l[1])
        self.assertTrue(linha[1].startswith("'@"))
