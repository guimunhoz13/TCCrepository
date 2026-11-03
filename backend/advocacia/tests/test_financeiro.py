"""Contratos de honorários e parcelas."""


from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import (
    Advogado,
    Cliente,
    Contrato,
    Parcela,
    Processo,
    Usuario,
)
from .base import _EquipeDoEscritorio, _criar_escritorio, _criar_usuario, _gerar_token_de_acesso


class AuditoriaIntegridadeContratoTests(_EquipeDoEscritorio, APITestCase):
    """Regressões de integridade financeira verificadas em 03/11/2026."""

    def setUp(self):
        self._equipe()
        self.processo = self._processo(self.escritorio, self.cliente, self.advogado, "AUDIT-20261103")
        self._como("admin")

    def _dados(self, valor="100.00", parcelas=3):
        return {"processo": self.processo.pk, "tipo_honorario": "fixo",
                "valor_total": valor, "forma_pagamento": "parcelado",
                "numero_parcelas": parcelas}

    def test_falha_na_segunda_parcela_desfaz_contrato_e_primeira_parcela(self):
        criar = Parcela.objects.create
        chamadas = 0

        def falhar_na_segunda(**dados):
            nonlocal chamadas
            chamadas += 1
            if chamadas == 2:
                raise RuntimeError("Falha sintética na geração de parcelas")
            return criar(**dados)

        with patch("advocacia.views.financeiro.Parcela.objects.create", side_effect=falhar_na_segunda):
            with self.assertRaisesRegex(RuntimeError, "Falha sintética"):
                self.client.post("/api/contratos/", self._dados(), format="json")
        self.assertEqual(Contrato.objects.filter(processo=self.processo).count(), 0)
        self.assertEqual(Parcela.objects.filter(contrato__processo=self.processo).count(), 0)

    def test_parcelas_nao_podem_exceder_total_em_centavos(self):
        resposta = self.client.post("/api/contratos/", self._dados("0.02", 4), format="json")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("numero_parcelas", resposta.data)
        self.assertFalse(Contrato.objects.filter(processo=self.processo).exists())

    def test_arredondamento_nao_gera_parcela_zero_ou_negativa(self):
        resposta = self.client.post("/api/contratos/", self._dados("0.06", 4), format="json")
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        valores = [Decimal(p["valor"]) for p in resposta.data["parcelas"]]
        self.assertEqual(len(valores), 4)
        self.assertTrue(all(v >= Decimal("0.01") for v in valores), valores)
        self.assertEqual(sum(valores), Decimal("0.06"))


class ContratoHonorarioAPITestCase(APITestCase):
    """Testa a criação de contratos e a geração automática de parcelas."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Contrato",
            cpf="44444444444",
            email="cliente.contrato@teste.com",
            telefone="11966666666",
            endereco="Rua D",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Contrato",
            email="advogado.contrato@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="555555/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-CT-1",
            titulo="Processo Contrato",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_contrato_a_vista_gera_uma_unica_parcela(self):
        resposta = self.client.post(
            "/api/contratos/",
            {
                "processo": self.processo.id,
                "tipo_honorario": "fixo",
                "valor_total": "1500.00",
                "forma_pagamento": "avista",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(resposta.data["parcelas"]), 1)
        self.assertEqual(resposta.data["parcelas"][0]["valor"], "1500.00")

    def test_contrato_parcelado_divide_o_valor_total_sem_perder_centavos(self):
        resposta = self.client.post(
            "/api/contratos/",
            {
                "processo": self.processo.id,
                "tipo_honorario": "fixo",
                "valor_total": "1000.00",
                "forma_pagamento": "parcelado",
                "numero_parcelas": 3,
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        parcelas = resposta.data["parcelas"]
        self.assertEqual(len(parcelas), 3)
        soma = sum(float(p["valor"]) for p in parcelas)
        self.assertAlmostEqual(soma, 1000.00, places=2)

    def test_marcar_parcela_como_paga_atualiza_status_e_data(self):
        contrato = Contrato.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo_honorario="fixo",
            valor_total=500,
            forma_pagamento="avista",
        )
        parcela = contrato.parcelas.create(
            numero=1, valor=500, data_vencimento=timezone.now().date()
        )
        resposta = self.client.patch(
            f"/api/parcelas/{parcela.id}/", {"status": "pago"}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(resposta.data["pago_em"])
        parcela.refresh_from_db()
        self.assertEqual(parcela.status, "pago")

    def test_nao_e_possivel_criar_dois_contratos_para_o_mesmo_processo(self):
        Contrato.objects.create(
            escritorio=self.escritorio,
            processo=self.processo,
            tipo_honorario="fixo",
            valor_total=500,
            forma_pagamento="avista",
        )
        resposta = self.client.post(
            "/api/contratos/",
            {
                "processo": self.processo.id,
                "tipo_honorario": "fixo",
                "valor_total": "300.00",
                "forma_pagamento": "avista",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)


class ContratoValorMinimoAPITestCase(APITestCase):
    """Testa que valores não positivos em Contrato/Parcela são rejeitados."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Valor",
            cpf="66666666666",
            email="cliente.valor@teste.com",
            telefone="11966666677",
            endereco="Rua F",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Valor",
            email="advogado.valor@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="666666/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-VAL-1",
            titulo="Processo Valor",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_contrato_com_valor_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/contratos/",
            {
                "processo": self.processo.id,
                "tipo_honorario": "fixo",
                "valor_total": "0.00",
                "forma_pagamento": "avista",
                "numero_parcelas": 1,
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("valor_total", resposta.data)

    def test_contrato_com_numero_de_parcelas_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/contratos/",
            {
                "processo": self.processo.id,
                "tipo_honorario": "fixo",
                "valor_total": "1000.00",
                "forma_pagamento": "parcelado",
                "numero_parcelas": 0,
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("numero_parcelas", resposta.data)
