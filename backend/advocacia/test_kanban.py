from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Tarefa
from .tests import _EquipeDoEscritorio


class QuadroDeTarefasAPITestCase(_EquipeDoEscritorio, APITestCase):

    def setUp(self):
        self._equipe()
        dono = self.membros["advogado"]

        def tarefa(titulo, situacao, concluida_ha=None):
            Tarefa.objects.create(
                escritorio=self.escritorio, titulo=titulo, responsavel=dono, status=situacao,
                concluida_em=timezone.now() - timedelta(days=concluida_ha) if concluida_ha is not None else None,
            )

        tarefa("Fazer", "aberta")
        tarefa("Fazendo", "em_andamento")
        tarefa("Feita ontem", "concluida", concluida_ha=1)
        tarefa("Feita há um mês", "concluida", concluida_ha=30)
        tarefa("Cancelada", "cancelada")

    def test_quadro_traz_o_que_esta_em_jogo_e_as_concluidas_recentes(self):
        self._como("advogado")
        resposta = self.client.get("/api/tarefas/", {"status": "quadro"})
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        titulos = {t["titulo"] for t in resposta.data["results"]}
        self.assertEqual(titulos, {"Fazer", "Fazendo", "Feita ontem"})

    def test_mover_o_cartao_para_concluida_registra_a_data(self):
        self._como("estagiario")
        tarefa = Tarefa.objects.get(titulo="Fazendo")
        resposta = self.client.patch(f"/api/tarefas/{tarefa.id}/", {"status": "concluida"}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        tarefa.refresh_from_db()
        self.assertIsNotNone(tarefa.concluida_em)
        titulos = {t["titulo"] for t in self.client.get("/api/tarefas/", {"status": "quadro"}).data["results"]}
        self.assertIn("Fazendo", titulos)
