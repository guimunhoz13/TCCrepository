import urllib.error
from datetime import date
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .djen import detectar_prazo, interpretar_item, separar_oab
from .feriados import prazo_de_publicacao
from .models import Advogado, Agenda, Intimacao
from .tests import _EquipeDoEscritorio, _criar_usuario

NUMERO = "0001234-56.2026.8.26.0100"


def _item(identificador=1, texto="Intime-se a parte autora para se manifestar no prazo de 15 (quinze) dias.",
          disponibilizacao="2026-10-05", numero=NUMERO):
    return {
        "id": identificador,
        "data_disponibilizacao": disponibilizacao,
        "siglaTribunal": "TJSP",
        "nomeOrgao": "1ª Vara Cível de Araçatuba",
        "tipoComunicacao": "Intimação",
        "numeroprocessocommascara": numero,
        "texto": f"<p>{texto}</p>",
        "link": "https://comunica.pje.jus.br/consulta/1",
    }


class RegrasDoPrazoTestCase(TestCase):

    def test_separa_numero_e_seccional_em_varios_formatos(self):
        self.assertEqual(separar_oab("123456/SP"), ("123456", "SP"))
        self.assertEqual(separar_oab("OAB/SP 123.456"), ("123456", "SP"))
        self.assertEqual(separar_oab("sp 012345"), ("12345", "SP"))
        self.assertIsNone(separar_oab("123456"))
        self.assertIsNone(separar_oab(""))

    def test_le_o_prazo_no_texto(self):
        self.assertEqual(detectar_prazo("no prazo de 15 (quinze) dias"), (15, True))
        self.assertEqual(detectar_prazo("no prazo legal de 5 dias úteis"), (5, True))
        self.assertEqual(detectar_prazo("prazo de 30 dias corridos"), (30, False))
        self.assertEqual(detectar_prazo("no prazo de quinze dias"), (15, True))
        self.assertIsNone(detectar_prazo("Ciência da decisão."))

    def test_publicacao_no_dia_util_seguinte_e_contagem_a_partir_dela(self):
        # Disponibilizada na sexta 02/10/2026: publicada na segunda 05/10;
        # 5 dias úteis contam de 06/10 a 12/10 — 12/10 é feriado (N. Sra.
        # Aparecida), então vence 13/10.
        publicacao, final = prazo_de_publicacao(date(2026, 10, 2), 5)
        self.assertEqual(publicacao, date(2026, 10, 5))
        self.assertEqual(final, date(2026, 10, 13))

    def test_recesso_forense_suspende_a_contagem(self):
        publicacao, final = prazo_de_publicacao(date(2026, 12, 17), 5)
        self.assertEqual(publicacao, date(2026, 12, 18))
        # 19/12 é sábado; de 20/12 a 20/01 não corre; volta em 21/01 (qui).
        self.assertEqual(final, date(2027, 1, 27))

    def test_interpreta_o_item_do_djen_e_limpa_html(self):
        dados = interpretar_item(_item())
        self.assertEqual(dados["identificador_externo"], "1")
        self.assertEqual(dados["numero_processo"], NUMERO)
        self.assertEqual(dados["data_disponibilizacao"], date(2026, 10, 5))
        self.assertNotIn("<p>", dados["texto"])
        self.assertIsNone(interpretar_item({"texto": "sem id nem data"}))


@patch("advocacia.djen._chamar_api")
class IntimacoesAPITestCase(_EquipeDoEscritorio, APITestCase):

    def setUp(self):
        self._equipe()
        self.advogado.oab = "123456/SP"
        self.advogado.save()
        self.processo = self._processo(self.escritorio, self.cliente, self.advogado, NUMERO)

    def test_buscar_grava_liga_ao_processo_e_lanca_o_prazo(self, api):
        api.return_value = {"items": [_item()]}
        self._como("advogado")
        resposta = self.client.post("/api/intimacoes/buscar/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(resposta.data["novas"], 1)
        parametros = api.call_args[0][0]
        self.assertEqual((parametros["numeroOab"], parametros["ufOab"]), ("123456", "SP"))

        intimacao = Intimacao.objects.get()
        self.assertEqual(intimacao.processo, self.processo)
        self.assertEqual(intimacao.prazo_dias, 15)
        self.assertFalse(intimacao.prazo_estimado)
        self.assertEqual(intimacao.data_publicacao, date(2026, 10, 6))
        evento = intimacao.evento_agenda
        self.assertEqual(evento.tipo, "prazo")
        self.assertEqual(evento.processo, self.processo)
        self.assertEqual(evento.data_evento.date(), intimacao.prazo_final)

    def test_nao_importa_a_mesma_intimacao_duas_vezes(self, api):
        api.return_value = {"items": [_item()]}
        self._como("advogado")
        self.client.post("/api/intimacoes/buscar/")
        resposta = self.client.post("/api/intimacoes/buscar/")
        self.assertEqual(resposta.data["novas"], 0)
        self.assertEqual(Intimacao.objects.count(), 1)
        self.assertEqual(Agenda.objects.filter(tipo="prazo").count(), 1)

    def test_sem_prazo_no_texto_usa_5_dias_uteis_marcado_como_estimado(self, api):
        api.return_value = {"items": [_item(texto="Ciência da decisão de fls. 30.")]}
        self._como("admin")
        self.client.post("/api/intimacoes/buscar/")
        intimacao = Intimacao.objects.get()
        self.assertEqual(intimacao.prazo_dias, 5)
        self.assertTrue(intimacao.prazo_estimado)
        self.assertIn("Prazo estimado", intimacao.evento_agenda.titulo)

    def test_processo_nao_cadastrado_fica_sem_vinculo(self, api):
        api.return_value = {"items": [_item(numero="0009999-11.2026.8.26.0001")]}
        self._como("admin")
        self.client.post("/api/intimacoes/buscar/")
        self.assertIsNone(Intimacao.objects.get().processo)

    def test_lista_marca_como_lida_e_filtra(self, api):
        api.return_value = {"items": [_item(1), _item(2, disponibilizacao="2026-10-06")]}
        self._como("advogado")
        self.client.post("/api/intimacoes/buscar/")
        lista = self.client.get("/api/intimacoes/", {"lida": "false"}).data["results"]
        self.assertEqual(len(lista), 2)
        resposta = self.client.patch(f"/api/intimacoes/{lista[0]['id']}/", {"lida": True, "texto": "x"}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertNotEqual(resposta.data["texto"], "x")
        self.assertEqual(len(self.client.get("/api/intimacoes/", {"lida": "false"}).data["results"]), 1)

    def test_secretaria_ve_mas_nao_busca(self, api):
        api.return_value = {"items": []}
        self._como("secretaria")
        self.assertEqual(self.client.get("/api/intimacoes/").status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.post("/api/intimacoes/buscar/").status_code, status.HTTP_403_FORBIDDEN)

    def test_intimacao_de_processo_sigiloso_some_para_quem_nao_ve(self, api):
        api.return_value = {"items": [_item()]}
        dono = _criar_usuario(self.escritorio, email="dono@equipe.com", tipo_usuario="advogado")
        self.processo.advogado = Advogado.objects.create(escritorio=self.escritorio, usuario=dono, oab="9/SP")
        self.processo.sigiloso = True
        self.processo.save()
        self._como("admin")
        self.client.post("/api/intimacoes/buscar/")
        self._como("estagiario")
        self.assertEqual(self.client.get("/api/intimacoes/").data["results"], [])

    def test_djen_fora_do_ar_avisa_sem_quebrar(self, api):
        api.side_effect = urllib.error.URLError("sem rede")
        self._como("advogado")
        resposta = self.client.post("/api/intimacoes/buscar/")
        self.assertEqual(resposta.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("DJEN", resposta.data["detail"])

    def test_advogado_com_oab_sem_seccional_e_avisado(self, api):
        api.return_value = {"items": []}
        self.advogado.oab = "123456"
        self.advogado.save()
        self._como("admin")
        resposta = self.client.post("/api/intimacoes/buscar/")
        self.assertEqual(resposta.data["sem_oab"], [self.admin.nome])

    def test_comando_agendado_busca_para_todos_os_escritorios(self, api):
        api.return_value = {"items": [_item()]}
        saida = StringIO()
        call_command("buscar_intimacoes", stdout=saida)
        self.assertIn("Total: 1", saida.getvalue())
