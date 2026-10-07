from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .calendario import _dobrar, _escapar, gerar_ics
from .models import Advogado, Agenda
from .tests import _EquipeDoEscritorio, _criar_usuario


class FormatoICalendarTestCase(TestCase):

    def test_escapa_caracteres_especiais(self):
        self.assertEqual(_escapar("a;b,c\\d\ne"), "a\;b\\,c\\\\d\\ne")

    def test_dobra_linhas_longas_sem_partir_acento(self):
        linha = "SUMMARY:" + "ação " * 40
        dobrada = _dobrar(linha)
        for pedaco in dobrada.split("\r\n"):
            self.assertLessEqual(len(pedaco.encode("utf-8")), 75)
        self.assertEqual(dobrada.replace("\r\n ", ""), linha)

    def test_prazo_fatal_tem_alarmes_e_horario_em_utc(self):
        evento = Agenda(
            pk=7, tipo="prazo", prioridade="fatal", titulo="Contestação", descricao="",
            data_evento=timezone.make_aware(timezone.datetime(2030, 3, 4, 9, 0)),
        )
        conteudo = gerar_ics([evento], "Teste")
        self.assertIn("SUMMARY:PRAZO FATAL: Contestação", conteudo)
        self.assertIn("UID:agenda-7@lexoffice", conteudo)
        # 9h em Brasília = 12h UTC.
        self.assertIn("DTSTART:20300304T120000Z", conteudo)
        self.assertEqual(conteudo.count("BEGIN:VALARM"), 2)
        self.assertTrue(conteudo.startswith("BEGIN:VCALENDAR\r\n"))
        self.assertTrue(conteudo.endswith("END:VCALENDAR\r\n"))


class ExportacaoDaAgendaAPITestCase(_EquipeDoEscritorio, APITestCase):

    def setUp(self):
        self._equipe()
        responsavel = _criar_usuario(self.escritorio, email="resp@equipe.com", tipo_usuario="advogado")
        adv = Advogado.objects.create(escritorio=self.escritorio, usuario=responsavel, oab="9/SP")
        self.sigiloso = self._processo(self.escritorio, self.cliente, adv, "SEGREDO-1")
        self.sigiloso.sigiloso = True
        self.sigiloso.save()
        amanha = timezone.now() + timedelta(days=1)
        Agenda.objects.create(escritorio=self.escritorio, titulo="Reunião com cliente", descricao="", data_evento=amanha)
        Agenda.objects.create(
            escritorio=self.escritorio, processo=self.sigiloso, titulo="Audiência sigilosa",
            descricao="", data_evento=amanha,
        )
        Agenda.objects.create(
            escritorio=self.escritorio, titulo="Evento antigo", descricao="",
            data_evento=timezone.now() - timedelta(days=90),
        )

    def test_download_respeita_sigilo_e_deixa_o_passado_distante_de_fora(self):
        self._como("advogado")
        resposta = self.client.get("/api/agenda/exportar-ics/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertTrue(resposta["Content-Type"].startswith("text/calendar"))
        conteudo = resposta.content.decode()
        self.assertIn("Reunião com cliente", conteudo)
        self.assertNotIn("Audiência sigilosa", conteudo)
        self.assertNotIn("Evento antigo", conteudo)

    def test_assinatura_gera_link_que_funciona_sem_login(self):
        self._como("secretaria")
        url = self.client.post("/api/agenda/assinatura/").data["url"]
        self.assertIn("/api/agenda/feed/", url)
        self.client.credentials()
        caminho = url.split("testserver")[1]
        resposta = self.client.get(caminho)
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertIn("Reunião com cliente", resposta.content.decode())
        self.assertNotIn("Audiência sigilosa", resposta.content.decode())

    def test_gerar_novo_link_invalida_o_antigo_e_desligar_apaga(self):
        self._como("admin")
        antigo = self.client.post("/api/agenda/assinatura/").data["url"].split("testserver")[1]
        novo = self.client.post("/api/agenda/assinatura/").data["url"].split("testserver")[1]
        self.assertEqual(self.client.get(antigo).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.get(novo).status_code, status.HTTP_200_OK)
        # Admin enxerga o sigiloso também na assinatura.
        self.assertIn("Audiência sigilosa", self.client.get(novo).content.decode())
        self.assertEqual(self.client.delete("/api/agenda/assinatura/").data["url"], "")
        self.assertEqual(self.client.get(novo).status_code, status.HTTP_404_NOT_FOUND)

    def test_link_de_usuario_inativo_para_de_funcionar(self):
        self._como("advogado")
        caminho = self.client.post("/api/agenda/assinatura/").data["url"].split("testserver")[1]
        usuario = self.membros["advogado"]
        usuario.ativo = False
        usuario.save()
        self.assertEqual(self.client.get(caminho).status_code, status.HTTP_404_NOT_FOUND)

    def test_token_curto_ou_inexistente_da_404(self):
        self.assertEqual(self.client.get("/api/agenda/feed/abc.ics").status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            self.client.get("/api/agenda/feed/" + "x" * 43 + ".ics").status_code,
            status.HTTP_404_NOT_FOUND,
        )
