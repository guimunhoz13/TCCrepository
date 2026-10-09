"""Feriados locais (municipais, estaduais e suspensões de expediente) no
cálculo de prazos."""

from datetime import date
from unittest.mock import patch

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from ..feriados import FeriadosLocais, calcular_prazo, feriados_locais_no_periodo, prazo_de_publicacao
from ..models import Advogado, Cliente, FeriadoLocal, Intimacao
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

    def test_dias_uteis_pulam_suspensao_de_dezembro_a_janeiro(self):
        self.assertEqual(calcular_prazo(date(2026, 12, 18), 1), date(2027, 1, 21))
        self.assertEqual(calcular_prazo(date(2027, 1, 20), 1), date(2027, 1, 21))
        self.assertEqual(calcular_prazo(date(2026, 12, 18), 1, dias_uteis=False), date(2026, 12, 19))

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

    def test_feriado_de_comarca_so_vale_para_processo_da_comarca(self):
        self._como("admin")
        self._cadastrar(abrangencia="Comarca de Araçatuba")
        processo_a = self._processo(self.escritorio, self.cliente, self.advogado, "PROC-A")
        processo_a.comarca = "Araçatuba"
        processo_a.save(update_fields=["comarca"])
        processo_b = self._processo(self.escritorio, self.cliente, self.advogado, "PROC-B")
        processo_b.comarca = "Bauru"
        processo_b.save(update_fields=["comarca"])

        for processo, esperado in ((processo_a, "2026-07-10"), (processo_b, "2026-07-09")):
            resposta = self.client.post(
                "/api/agenda/calcular-prazo/",
                {"data_inicio": "2026-07-08", "dias": 1, "processo": processo.pk}, format="json",
            )
            self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
            self.assertEqual(resposta.data["data_final"], esperado)

        sem_processo = self.client.post(
            "/api/agenda/calcular-prazo/", {"data_inicio": "2026-07-08", "dias": 1}, format="json"
        )
        self.assertEqual(sem_processo.data["data_final"], "2026-07-09")

    def test_mesma_data_pode_ser_cadastrada_para_comarcas_distintas(self):
        self._como("admin")
        self.assertEqual(self._cadastrar(abrangencia="Araçatuba").status_code, status.HTTP_201_CREATED)
        self.assertEqual(self._cadastrar(abrangencia="Bauru").status_code, status.HTTP_201_CREATED)

    def test_calculadora_rejeita_processo_alheio_e_booleano_invalido(self):
        self._como("admin")
        outro = _criar_escritorio(nome="Outro", cnpj="99888777000166", email="o@o.com")
        outro_usuario = _criar_usuario(outro, email="dono@outro.com")
        outro_cliente = Cliente.objects.create(escritorio=outro, nome="Cliente do outro")
        outro_advogado = Advogado.objects.create(escritorio=outro, usuario=outro_usuario, oab="999999/SP")
        outro_processo = self._processo(outro, outro_cliente, outro_advogado, "PROC-OUTRO")
        resposta = self.client.post(
            "/api/agenda/calcular-prazo/",
            {"data_inicio": "2026-07-08", "dias": 1, "processo": outro_processo.pk}, format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)
        resposta = self.client.post(
            "/api/agenda/calcular-prazo/",
            {"data_inicio": "2026-07-08", "dias": 1, "dias_uteis": "false"}, format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

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

    @patch("advocacia.djen._chamar_api")
    def test_djen_ignora_feriado_de_outro_tribunal(self, api):
        self.advogado.oab = "123456/SP"
        self.advogado.save(update_fields=["oab"])
        self._processo(self.escritorio, self.cliente, self.advogado, NUMERO)
        FeriadoLocal.objects.create(
            escritorio=self.escritorio, data=date(2026, 7, 9), descricao="Somente TJMG", abrangencia="TJMG"
        )
        api.return_value = {"items": [_item(disponibilizacao="2026-07-08")]}
        self._como("advogado")
        self.assertEqual(self.client.post("/api/intimacoes/buscar/").status_code, status.HTTP_200_OK)
        intimacao = Intimacao.objects.get()
        self.assertEqual(intimacao.data_publicacao, date(2026, 7, 9))


class CalendarioDeFeriadosAPITestCase(_EquipeDoEscritorio, APITestCase):
    """O calendário da tela mostra os mesmos feriados usados no cálculo."""

    def setUp(self):
        self._equipe()
        self._como("secretaria")

    def _ano(self, ano=2026):
        resposta = self.client.get(f"/api/agenda/feriados/?ano={ano}")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        return resposta.data

    def test_lista_os_feriados_nacionais_com_nome(self):
        feriados = {f["data"]: f for f in self._ano()["feriados"]}
        self.assertEqual(feriados["2026-12-25"]["nome"], "Natal")
        self.assertEqual(feriados["2026-12-25"]["tipo"], "nacional")
        # Páscoa de 2026 em 05/04: Carnaval em 16 e 17/02, Corpus Christi em 04/06.
        self.assertEqual(feriados["2026-02-16"]["nome"], "Carnaval")
        self.assertEqual(feriados["2026-06-04"]["nome"], "Corpus Christi")
        self.assertEqual(len([f for f in feriados.values() if f["tipo"] == "nacional"]), 13)

    def test_inclui_os_feriados_locais_do_escritorio(self):
        FeriadoLocal.objects.create(
            escritorio=self.escritorio, data=date(2025, 7, 9), descricao="Revolução Constitucionalista", anual=True
        )
        FeriadoLocal.objects.create(escritorio=self.escritorio, data=date(2027, 3, 3), descricao="Outro ano")
        locais = [f for f in self._ano()["feriados"] if f["tipo"] == "local"]
        self.assertEqual(locais, [{"data": "2026-07-09", "nome": "Revolução Constitucionalista", "tipo": "local"}])

    def test_feriado_local_na_data_de_um_nacional_nao_aparece_duas_vezes(self):
        FeriadoLocal.objects.create(escritorio=self.escritorio, data=date(2026, 12, 25), descricao="Repetido")
        natal = [f for f in self._ano()["feriados"] if f["data"] == "2026-12-25"]
        self.assertEqual(len(natal), 1)

    def test_29_de_fevereiro_anual_nao_quebra_ano_comum(self):
        FeriadoLocal.objects.create(escritorio=self.escritorio, data=date(2028, 2, 29), descricao="Bissexto", anual=True)
        self.assertFalse(any(f["nome"] == "Bissexto" for f in self._ano(2026)["feriados"]))
        # 2028 não serve: 29/02/2028 é terça de Carnaval.
        self.assertTrue(any(f["nome"] == "Bissexto" for f in self._ano(2032)["feriados"]))

    def test_informa_o_recesso_forense(self):
        self.assertEqual(
            self._ano()["recesso"],
            [{"inicio": "2026-01-01", "fim": "2026-01-20"}, {"inicio": "2026-12-20", "fim": "2026-12-31"}],
        )

    def test_ano_invalido(self):
        self.assertEqual(self.client.get("/api/agenda/feriados/?ano=99999").status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.client.get("/api/agenda/feriados/?ano=abc").status_code, status.HTTP_200_OK)

    def test_feriados_de_outro_escritorio_nao_aparecem(self):
        outro = _criar_escritorio(nome="Outro", cnpj="99888777000166", email="o@o.com")
        FeriadoLocal.objects.create(escritorio=outro, data=date(2026, 8, 1), descricao="Do outro")
        self.assertFalse(any(f["nome"] == "Do outro" for f in self._ano()["feriados"]))

    def test_calendario_identifica_duas_abrangencias_na_mesma_data(self):
        FeriadoLocal.objects.create(
            escritorio=self.escritorio, data=date(2026, 7, 9), descricao="Feriado municipal", abrangencia="Araçatuba"
        )
        FeriadoLocal.objects.create(
            escritorio=self.escritorio, data=date(2026, 7, 9), descricao="Suspensão", abrangencia="TJSP"
        )
        locais = [f for f in self._ano()["feriados"] if f["data"] == "2026-07-09" and f["tipo"] == "local"]
        self.assertEqual(len(locais), 1)
        self.assertIn("Araçatuba", locais[0]["nome"])
        self.assertIn("TJSP", locais[0]["nome"])
