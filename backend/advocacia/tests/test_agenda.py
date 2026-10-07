"""Cálculo de prazo e agenda."""

from datetime import date

from django.contrib.auth.hashers import make_password
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..feriados import calcular_prazo, eh_dia_util, feriados_nacionais
from ..models import (
    Advogado,
    Agenda,
    Cliente,
    Processo,
    Usuario,
)
from .base import _criar_escritorio, _criar_usuario, _gerar_token_de_acesso


class CalculoDePrazoTestCase(TestCase):
    """Testa o cálculo de prazo em dias úteis/corridos (advocacia/feriados.py),
    incluindo os feriados nacionais móveis (baseados na Páscoa)."""

    def test_pascoa_bate_com_datas_conhecidas(self):
        from advocacia.feriados import _pascoa
        self.assertEqual(_pascoa(2024), date(2024, 3, 31))
        self.assertEqual(_pascoa(2025), date(2025, 4, 20))
        self.assertEqual(_pascoa(2026), date(2026, 4, 5))

    def test_feriados_nacionais_inclui_fixos_e_moveis(self):
        feriados = feriados_nacionais(2026)
        self.assertIn(date(2026, 1, 1), feriados)  # Confraternização
        self.assertIn(date(2026, 4, 21), feriados)  # Tiradentes
        self.assertIn(date(2026, 12, 25), feriados)  # Natal
        self.assertIn(date(2026, 4, 3), feriados)  # Sexta-feira Santa (Páscoa - 2)

    def test_eh_dia_util_rejeita_fim_de_semana_e_feriado(self):
        self.assertFalse(eh_dia_util(date(2026, 12, 25)))  # sexta, Natal
        self.assertFalse(eh_dia_util(date(2026, 12, 26)))  # sábado
        self.assertFalse(eh_dia_util(date(2026, 12, 27)))  # domingo
        self.assertTrue(eh_dia_util(date(2026, 12, 28)))  # segunda, útil

    def test_calcular_prazo_em_dias_uteis_pula_feriado_e_fim_de_semana(self):
        # 22/12/2026 é terça-feira; contando 5 dias úteis, pula o Natal
        # (25/12, sexta) e o fim de semana seguinte (26 e 27/12).
        inicio = date(2026, 12, 22)
        final = calcular_prazo(inicio, 5, dias_uteis=True)
        self.assertEqual(final, date(2026, 12, 30))

    def test_calcular_prazo_em_dias_corridos_conta_todos_os_dias(self):
        inicio = date(2026, 12, 22)
        final = calcular_prazo(inicio, 5, dias_uteis=False)
        self.assertEqual(final, date(2026, 12, 27))


class CalcularPrazoAPITestCase(APITestCase):
    """Testa /api/agenda/calcular-prazo/, usado para preencher o prazo na
    agenda a partir de uma data de início e uma quantidade de dias."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_calcula_prazo_em_dias_uteis(self):
        resposta = self.client.post(
            "/api/agenda/calcular-prazo/",
            {"data_inicio": "2026-12-22", "dias": 5, "dias_uteis": True},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["data_final"], "2026-12-30")

    def test_calcula_prazo_em_dias_corridos(self):
        resposta = self.client.post(
            "/api/agenda/calcular-prazo/",
            {"data_inicio": "2026-12-22", "dias": 5, "dias_uteis": False},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["data_final"], "2026-12-27")

    def test_sem_dados_e_rejeitado(self):
        resposta = self.client.post("/api/agenda/calcular-prazo/", {}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_dias_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/agenda/calcular-prazo/",
            {"data_inicio": "2026-12-22", "dias": 0},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_sem_autenticacao_e_negado(self):
        self.client.credentials()
        resposta = self.client.post(
            "/api/agenda/calcular-prazo/",
            {"data_inicio": "2026-12-22", "dias": 5},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)


class AgendaPrazoAPITestCase(APITestCase):
    """Testa o tipo Prazo/Compromisso, o cálculo de atraso e os filtros da agenda."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Agenda",
            cpf="33333333333",
            email="cliente.agenda@teste.com",
            telefone="11977777777",
            endereco="Rua C",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Agenda",
            email="advogado.agenda@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="444444/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-AG-1",
            titulo="Processo Agenda",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_criar_prazo_atrasado_e_sinalizado(self):
        resposta = self.client.post(
            "/api/agenda/",
            {
                "processo": self.processo.id,
                "tipo": "prazo",
                "titulo": "Prazo recursal",
                "descricao": "Descrição.",
                "data_evento": "2020-01-01T10:00:00Z",
                "local_evento": "",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["tipo"], "prazo")
        self.assertTrue(resposta.data["atrasado"])
        self.assertEqual(resposta.data["prioridade"], "normal")

    def test_criar_prazo_fatal(self):
        resposta = self.client.post(
            "/api/agenda/",
            {
                "processo": self.processo.id,
                "tipo": "prazo",
                "prioridade": "fatal",
                "titulo": "Prazo fatal recursal",
                "descricao": "Descrição.",
                "data_evento": "2030-01-01T10:00:00Z",
                "local_evento": "",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["prioridade"], "fatal")

    def test_prazo_cumprido_nao_e_sinalizado_como_atrasado(self):
        evento = Agenda.objects.create(
            processo=self.processo,
            tipo="prazo",
            titulo="Prazo cumprido",
            descricao="Descrição.",
            data_evento=timezone.now() - timezone.timedelta(days=1),
            cumprido=True,
        )
        resposta = self.client.get(f"/api/agenda/{evento.id}/")
        self.assertFalse(resposta.data["atrasado"])

    def test_marcar_evento_como_cumprido(self):
        evento = Agenda.objects.create(
            processo=self.processo,
            tipo="compromisso",
            titulo="Audiência",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
        )
        resposta = self.client.patch(
            f"/api/agenda/{evento.id}/", {"cumprido": True}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        evento.refresh_from_db()
        self.assertTrue(evento.cumprido)

    def test_filtro_agenda_por_tipo(self):
        Agenda.objects.create(
            processo=self.processo,
            tipo="compromisso",
            titulo="Reunião",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
        )
        Agenda.objects.create(
            processo=self.processo,
            tipo="prazo",
            titulo="Prazo X",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=2),
        )
        resposta = self.client.get("/api/agenda/", {"tipo": "prazo"})
        self.assertEqual(len(resposta.data["results"]), 1)
        self.assertEqual(resposta.data["results"][0]["titulo"], "Prazo X")

    def test_criar_compromisso_sem_processo(self):
        resposta = self.client.post(
            "/api/agenda/",
            {
                "tipo": "compromisso",
                "titulo": "Reunião interna",
                "descricao": "Descrição.",
                "data_evento": "2030-01-01T10:00:00Z",
                "local_evento": "",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(resposta.data["processo"])
        self.assertIsNone(resposta.data["numero_processo"])
        self.assertIsNone(resposta.data["cliente_nome"])

    def test_compromisso_sem_processo_e_gravado_no_escritorio_de_quem_criou(self):
        Agenda.objects.create(
            escritorio=self.escritorio,
            tipo="compromisso",
            titulo="Reunião sem processo",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
        )
        resposta = self.client.get("/api/agenda/")
        titulos = [item["titulo"] for item in resposta.data["results"]]
        self.assertIn("Reunião sem processo", titulos)

    def test_compromisso_sem_processo_de_outro_escritorio_fica_isolado(self):
        outro_escritorio = _criar_escritorio(nome="Outro Escritório Agenda", cnpj="22222222000122")
        Agenda.objects.create(
            escritorio=outro_escritorio,
            tipo="compromisso",
            titulo="Reunião de outro escritório",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
        )
        resposta = self.client.get("/api/agenda/")
        titulos = [item["titulo"] for item in resposta.data["results"]]
        self.assertNotIn("Reunião de outro escritório", titulos)

    def test_editar_titulo_e_reagendar_data_do_evento(self):
        evento = Agenda.objects.create(
            processo=self.processo,
            tipo="compromisso",
            titulo="Audiência",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
        )
        nova_data = "2031-05-20T14:30:00Z"
        resposta = self.client.patch(
            f"/api/agenda/{evento.id}/",
            {"titulo": "Audiência remarcada", "data_evento": nova_data},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        evento.refresh_from_db()
        self.assertEqual(evento.titulo, "Audiência remarcada")
        self.assertEqual(evento.data_evento.isoformat(), "2031-05-20T14:30:00+00:00")

    def test_reabrir_evento_marcado_como_cumprido(self):
        evento = Agenda.objects.create(
            processo=self.processo,
            tipo="compromisso",
            titulo="Audiência",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
            cumprido=True,
        )
        resposta = self.client.patch(
            f"/api/agenda/{evento.id}/", {"cumprido": False}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        evento.refresh_from_db()
        self.assertFalse(evento.cumprido)

    def test_remover_vinculo_de_processo_de_um_evento_existente(self):
        evento = Agenda.objects.create(
            processo=self.processo,
            tipo="compromisso",
            titulo="Audiência",
            descricao="Descrição.",
            data_evento=timezone.now() + timezone.timedelta(days=1),
        )
        resposta = self.client.patch(
            f"/api/agenda/{evento.id}/", {"processo": None}, format="json"
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        evento.refresh_from_db()
        self.assertIsNone(evento.processo)
        self.assertEqual(evento.escritorio_id, self.escritorio.id)
