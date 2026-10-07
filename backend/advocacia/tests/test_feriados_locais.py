"""Feriados locais (municipais, estaduais e suspensões de expediente) no
cálculo de prazos."""

from datetime import date
from unittest.mock import patch

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from ..feriados import FeriadosLocais, calcular_prazo, feriados_locais_no_periodo, prazo_de_publicacao
from ..models import FeriadoLocal, Intimacao
from .base import _criar_escritorio, _criar_usuario, _EquipeDoEscritorio, _gerar_token_de_acesso
from .test_djen import NUMERO, _item

# 09/07/2026 é quinta-feira: Revolução Constitucionalista, feriado em SP.
NOVE_DE_JULHO = FeriadosLocais(anuais={(7, 9)}, descricoes={(7, 9): "Revolução Constitucionalista"})


class CalculoComFeriadosLocaisTestCase(TestCase):

    def test_sem_feriado_local_nada_muda(self):
        self.assertEqual(calcular_prazo(date(2026, 7, 8), 1), date(2026, 7, 9))

    def test_feriado_local_pula_a_contagem(self):
        self.assertEqual(calcular_prazo(date(2026, 7, 8), 1, locais=NOVE_DE_JULHO), date(2026, 7, 10))

    def test_dias_corridos_ignoram_feriado_local(self):
        self.assertEqual(
            calcular_prazo(date(2026, 7, 8), 1, dias_uteis=False, locais=NOVE_DE_JULHO), date(2026, 7, 9)
        )

    def test_feriado_anual_vale_em_qualquer_ano(self):
        # 09/07/2027 é sexta-feira.
        self.assertEqual(calcular_prazo(date(2027, 7, 8), 1, locais=NOVE_DE_JULHO), date(2027, 7, 12))

    def test_suspensao_de_um_dia_so_vale_naquela_data(self):
        suspensao = FeriadosLocais(datas={date(2026, 7, 9)})
        self.assertEqual(calcular_prazo(date(2026, 7, 8), 1, locais=suspensao), date(2026, 7, 10))
        self.assertEqual(calcular_prazo(date(2027, 7, 8), 1, locais=suspensao), date(2027, 7, 9))

    def test_intimacao_publicada_e_vencimento_respeitam_feriado_local(self):
        # Disponibilizada na quarta 08/07: sem o feriado, publicação na
        # quinta 09/07; com ele, na sexta 10/07.
        publicacao, final = prazo_de_publicacao(date(2026, 7, 8), 1, locais=NOVE_DE_JULHO)
        self.assertEqual(publicacao, date(2026, 7, 10))
        self.assertEqual(final, date(2026, 7, 13))

    def test_feriado_local_no_meio_do_prazo_empurra_o_vencimento(self):
        # Publicada na terça 07/07, 2 dias úteis: 08/07 e 09/07 sem o
        # feriado; com ele, 08/07 e 10/07.
        _, sem = prazo_de_publicacao(date(2026, 7, 6), 2)
        _, com = prazo_de_publicacao(date(2026, 7, 6), 2, locais=NOVE_DE_JULHO)
        self.assertEqual(sem, date(2026, 7, 9))
        self.assertEqual(com, date(2026, 7, 10))

    def test_lista_so_os_feriados_locais_que_mudaram_a_contagem(self):
        locais = FeriadosLocais(
            datas={date(2026, 7, 11)},  # sábado: não muda nada
            anuais={(7, 9)},
            descricoes={(7, 9): "Revolução Constitucionalista", date(2026, 7, 11): "Sábado"},
        )
        achados = feriados_locais_no_periodo(date(2026, 7, 8), date(2026, 7, 14), locais)
        self.assertEqual(achados, [{"data": "2026-07-09", "descricao": "Revolução Constitucionalista"}])


class FeriadosLocaisAPITestCase(_EquipeDoEscritorio, APITestCase):

    def setUp(self):
        self._equipe()

    def _cadastrar(self, **dados):
        dados = {"data": "2026-07-09", "descricao": "Revolução Constitucionalista", "anual": True, **dados}
        return self.client.post("/api/feriados-locais/", dados, format="json")

    def test_cadastra_lista_e_exclui(self):
        self._como("admin")
        criado = self._cadastrar(abrangencia="TJSP")
        self.assertEqual(criado.status_code, status.HTTP_201_CREATED, criado.data)
        self.assertEqual(FeriadoLocal.objects.get().escritorio, self.escritorio)

        lista = self.client.get("/api/feriados-locais/")
        self.assertEqual([f["descricao"] for f in lista.data], ["Revolução Constitucionalista"])

        excluir = self.client.delete(f"/api/feriados-locais/{criado.data['id']}/")
        self.assertEqual(excluir.status_code, status.HTTP_204_NO_CONTENT)

    def test_mesma_data_duas_vezes_e_recusada(self):
        self._como("admin")
        self._cadastrar()
        repetido = self._cadastrar(descricao="Outro")
        self.assertEqual(repetido.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("data", repetido.data)

    def test_financeiro_so_consulta(self):
        self._como("financeiro")
        self.assertEqual(self._cadastrar().status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get("/api/feriados-locais/").status_code, status.HTTP_200_OK)

    def test_outro_escritorio_nao_ve_nem_usa(self):
        self._como("admin")
        self._cadastrar()
        outro = _criar_escritorio(nome="Outro", cnpj="99888777000166", email="o@o.com")
        usuario = _criar_usuario(outro, email="dono@outro.com")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(usuario)}")
        self.assertEqual(self.client.get("/api/feriados-locais/").data, [])
        resposta = self.client.post(
            "/api/agenda/calcular-prazo/", {"data_inicio": "2026-07-08", "dias": 1}, format="json"
        )
        self.assertEqual(resposta.data["data_final"], "2026-07-09")
        self.assertEqual(resposta.data["feriados_locais"], [])

    def test_calculadora_usa_e_mostra_o_feriado_local(self):
        self._como("admin")
        self._cadastrar()
        resposta = self.client.post(
            "/api/agenda/calcular-prazo/", {"data_inicio": "2026-07-08", "dias": 1}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["data_final"], "2026-07-10")
        self.assertEqual(
            resposta.data["feriados_locais"], [{"data": "2026-07-09", "descricao": "Revolução Constitucionalista"}]
        )

    @patch("advocacia.djen._chamar_api")
    def test_intimacao_do_djen_considera_o_feriado_local(self, api):
        self.advogado.oab = "123456/SP"
        self.advogado.save()
        self._processo(self.escritorio, self.cliente, self.advogado, NUMERO)
        FeriadoLocal.objects.create(escritorio=self.escritorio, data=date(2026, 7, 9), descricao="Feriado")
        api.return_value = {"items": [_item(disponibilizacao="2026-07-08")]}
        self._como("advogado")
        self.assertEqual(self.client.post("/api/intimacoes/buscar/").status_code, status.HTTP_200_OK)
        intimacao = Intimacao.objects.get()
        self.assertEqual(intimacao.data_publicacao, date(2026, 7, 10))
        _, sem_feriado = prazo_de_publicacao(date(2026, 7, 8), 15)
        self.assertGreater(intimacao.prazo_final, sem_feriado)
