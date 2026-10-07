from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import Advogado, Contrato, Parcela
from ..pix import ErroPix, crc16, montar_payload, normalizar_chave
from .base import _criar_usuario, _EquipeDoEscritorio


def _campos(payload):
    """Lê o payload EMV de volta em {id: valor}, para conferir a estrutura."""
    campos, i = {}, 0
    while i < len(payload):
        ident, tamanho = payload[i:i + 2], int(payload[i + 2:i + 4])
        campos[ident] = payload[i + 4:i + 4 + tamanho]
        i += 4 + tamanho
    return campos


class BRCodeTestCase(TestCase):

    def test_crc_do_exemplo_do_manual_do_banco_central(self):
        sem_crc = (
            "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000"
            "5204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304"
        )
        self.assertEqual(crc16(sem_crc), "1D3D")

    def test_payload_tem_valor_destinatario_e_crc_valido(self):
        payload = montar_payload(
            "contato@escritorio.com", "Silva & Sabino Advocacia", "Araçatuba",
            Decimal("1250.5"), txid="LEX12P3", descricao="Parcela 3/10",
        )
        campos = _campos(payload)
        self.assertEqual(campos["00"], "01")
        self.assertEqual(campos["54"], "1250.50")
        self.assertEqual(campos["53"], "986")
        self.assertEqual(campos["59"], "Silva Sabino Advocacia")
        self.assertEqual(campos["60"], "Aracatuba")
        conta = _campos(campos["26"])
        self.assertEqual(conta["00"], "br.gov.bcb.pix")
        self.assertEqual(conta["01"], "contato@escritorio.com")
        self.assertEqual(conta["02"], "Parcela 3/10")
        self.assertEqual(_campos(campos["62"])["05"], "LEX12P3")
        self.assertEqual(payload[-4:], crc16(payload[:-4]))

    def test_descricao_longa_e_cortada_para_caber_no_campo(self):
        chave = "123e4567-e12b-12d1-a456-426655440000"
        payload = montar_payload(chave, "Nome", "Cidade", 10, descricao="x" * 200)
        self.assertLessEqual(len(_campos(payload)["26"]), 99)

    def test_sem_chave_ou_sem_cidade_explica_o_que_falta(self):
        with self.assertRaisesMessage(ErroPix, "chave PIX"):
            montar_payload("", "Nome", "Cidade", 10)
        with self.assertRaisesMessage(ErroPix, "cidade"):
            montar_payload("a@b.com", "Nome", "", 10)

    def test_normaliza_a_chave_sem_validar_documento(self):
        self.assertEqual(normalizar_chave("cpf_cnpj", "123.456.789-00"), "12345678900")
        self.assertEqual(normalizar_chave("telefone", "(18) 99999-0000"), "+5518999990000")
        self.assertEqual(normalizar_chave("telefone", "+55 18 99999-0000"), "+5518999990000")
        self.assertEqual(normalizar_chave("email", " Contato@X.com "), "contato@x.com")


class PixDaParcelaAPITestCase(_EquipeDoEscritorio, APITestCase):

    def setUp(self):
        self._equipe()
        self.escritorio.cidade = "Araçatuba"
        self.escritorio.save()
        self.processo = self._processo(self.escritorio, self.cliente, self.advogado, "0001234-56.2026.8.26.0100")
        contrato = Contrato.objects.create(
            escritorio=self.escritorio, processo=self.processo, valor_total=Decimal("900"),
            forma_pagamento="parcelado", numero_parcelas=3,
        )
        self.parcela = Parcela.objects.create(
            contrato=contrato, numero=1, valor=Decimal("300"), data_vencimento="2030-01-10"
        )

    def _configurar_pix(self):
        self._como("admin")
        resposta = self.client.patch(
            "/api/configuracoes/escritorio/",
            {"tipo_chave_pix": "telefone", "chave_pix": "(18) 99999-0000", "nome_recebedor_pix": "Silva Sabino"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        return resposta

    def test_sem_chave_cadastrada_explica_onde_configurar(self):
        self._como("financeiro")
        resposta = self.client.get(f"/api/parcelas/{self.parcela.id}/pix/")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Configurações", resposta.data["detail"])

    def test_gera_qr_code_e_copia_e_cola_da_parcela(self):
        config = self._configurar_pix().data["configuracao_escritorio"]
        self.assertEqual(config["chave_pix"], "+5518999990000")
        self._como("financeiro")
        resposta = self.client.get(f"/api/parcelas/{self.parcela.id}/pix/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        campos = _campos(resposta.data["payload"])
        self.assertEqual(campos["54"], "300.00")
        self.assertEqual(campos["60"], "Aracatuba")
        self.assertTrue(resposta.data["qr_code"].startswith("data:image/svg+xml"))
        self.assertEqual(resposta.data["total_parcelas"], 1)

    def test_chave_sem_tipo_e_recusada(self):
        self._como("admin")
        resposta = self.client.patch("/api/configuracoes/escritorio/", {"chave_pix": "abc"}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_parcela_paga_nao_gera_pix(self):
        self._configurar_pix()
        self.parcela.status = "pago"
        self.parcela.save()
        self._como("financeiro")
        self.assertEqual(
            self.client.get(f"/api/parcelas/{self.parcela.id}/pix/").status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_perfil_sem_financeiro_nao_acessa(self):
        self._configurar_pix()
        self._como("secretaria")
        self.assertEqual(
            self.client.get(f"/api/parcelas/{self.parcela.id}/pix/").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_parcela_de_processo_sigiloso_nao_aparece_para_quem_nao_ve(self):
        self._configurar_pix()
        dono = _criar_usuario(self.escritorio, email="dono@equipe.com", tipo_usuario="advogado")
        self.processo.advogado = Advogado.objects.create(escritorio=self.escritorio, usuario=dono, oab="7/SP")
        self.processo.sigiloso = True
        self.processo.save()
        self._como("financeiro")
        self.assertEqual(
            self.client.get(f"/api/parcelas/{self.parcela.id}/pix/").status_code,
            status.HTTP_404_NOT_FOUND,
        )
