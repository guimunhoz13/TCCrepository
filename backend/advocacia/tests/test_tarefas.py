"""Tarefas com responsável."""

from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.core import mail
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import (
    Advogado,
    Cliente,
    PreferenciasUsuario,
    Processo,
    Tarefa,
    Usuario,
)
from .base import _criar_escritorio, _criar_usuario, _gerar_token_de_acesso


class TarefaAPITestCase(APITestCase):
    """A Agenda guarda compromissos e prazos com hora marcada. O trabalho
    interno do escritório — levantar jurisprudência, revisar uma minuta —
    não tinha onde ser registrado nem a quem ser atribuído."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.colega = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Bruno Advogado",
            email="bruno@escritorio.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        PreferenciasUsuario.objects.create(usuario=self.colega)

        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Tarefa",
            cpf="12312312312",
            email="cliente.tarefa@teste.com",
            telefone="11911111111",
            endereco="Rua T",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=self.colega,
            oab="123123/SP",
            especialidade="Cível",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-TAR-1",
            titulo="Processo Tarefa",
            descricao="Descrição.",
            cliente=cliente,
            advogado=advogado,
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def _criar(self, **extras):
        dados = {
            "titulo": "Levantar jurisprudência sobre horas in itinere",
            "responsavel": self.colega.id,
            "prioridade": "alta",
        }
        dados.update(extras)
        return self.client.post("/api/tarefas/", dados)

    def test_criar_tarefa_registra_quem_atribuiu(self):
        resposta = self._criar()

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        self.assertEqual(resposta.data["responsavel_nome"], "Bruno Advogado")
        self.assertEqual(resposta.data["criado_por_nome"], self.admin.nome)
        self.assertEqual(resposta.data["status"], "aberta")

    def test_tarefa_pode_existir_sem_processo(self):
        resposta = self._criar(titulo="Renovar o certificado digital do escritório")

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        self.assertIsNone(resposta.data["processo"])

    def test_tarefa_pode_ser_vinculada_a_um_processo(self):
        resposta = self._criar(processo=self.processo.id)

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        self.assertEqual(resposta.data["numero_processo"], "PROC-TAR-1")

    def test_titulo_em_branco_e_recusado(self):
        resposta = self._criar(titulo="   ")

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("titulo", resposta.data)

    def test_responsavel_de_outro_escritorio_e_recusado(self):
        outro = _criar_escritorio(nome="Escritório Alheio", cnpj="11222333000181")
        estranho = _criar_usuario(outro, email="estranho@alheio.com")

        resposta = self._criar(responsavel=estranho.id)

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("responsavel", resposta.data)

    def test_nao_atribui_tarefa_a_usuario_inativo(self):
        self.colega.ativo = False
        self.colega.save()

        resposta = self._criar()

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("responsavel", resposta.data)

    def test_responsavel_e_avisado_por_email(self):
        mail.outbox = []

        self._criar(prazo=(timezone.localdate() + timedelta(days=3)).isoformat())

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["bruno@escritorio.com"])
        self.assertIn("tarefa", mail.outbox[0].subject.lower())

    def test_quem_se_atribui_uma_tarefa_nao_recebe_aviso_de_si_mesmo(self):
        PreferenciasUsuario.objects.create(usuario=self.admin)
        mail.outbox = []

        self._criar(responsavel=self.admin.id)

        self.assertEqual(len(mail.outbox), 0)

    def test_aviso_respeita_a_preferencia_do_responsavel(self):
        preferencias = self.colega.preferencias
        preferencias.notificacao_tarefa_atribuida = False
        preferencias.save()
        mail.outbox = []

        self._criar()

        self.assertEqual(len(mail.outbox), 0)

    def test_concluir_tarefa_grava_a_data_de_conclusao(self):
        tarefa_id = self._criar().data["id"]

        resposta = self.client.patch(f"/api/tarefas/{tarefa_id}/", {"status": "concluida"})

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertIsNotNone(resposta.data["concluida_em"])

    def test_reabrir_tarefa_limpa_a_data_de_conclusao(self):
        tarefa_id = self._criar().data["id"]
        self.client.patch(f"/api/tarefas/{tarefa_id}/", {"status": "concluida"})

        resposta = self.client.patch(f"/api/tarefas/{tarefa_id}/", {"status": "em_andamento"})

        self.assertIsNone(resposta.data["concluida_em"])

    def test_tarefa_com_prazo_vencido_aparece_como_atrasada(self):
        resposta = self._criar(prazo=(timezone.localdate() - timedelta(days=1)).isoformat())

        self.assertTrue(resposta.data["atrasada"])

    def test_tarefa_concluida_nao_conta_como_atrasada(self):
        tarefa_id = self._criar(
            prazo=(timezone.localdate() - timedelta(days=1)).isoformat()
        ).data["id"]

        resposta = self.client.patch(f"/api/tarefas/{tarefa_id}/", {"status": "concluida"})

        self.assertFalse(resposta.data["atrasada"])

    def test_tarefa_sem_prazo_nunca_esta_atrasada(self):
        resposta = self._criar()

        self.assertFalse(resposta.data["atrasada"])

    def test_filtro_responsavel_eu_traz_so_as_minhas(self):
        self._criar()
        self._criar(titulo="Minha própria tarefa", responsavel=self.admin.id)

        resposta = self.client.get("/api/tarefas/?responsavel=eu")
        titulos = [t["titulo"] for t in resposta.data["results"]]

        self.assertEqual(titulos, ["Minha própria tarefa"])

    def test_filtro_abertas_deixa_de_fora_concluidas_e_canceladas(self):
        aberta = self._criar(titulo="Ainda por fazer").data["id"]
        concluida = self._criar(titulo="Já feita").data["id"]
        cancelada = self._criar(titulo="Não vai mais").data["id"]
        self.client.patch(f"/api/tarefas/{concluida}/", {"status": "concluida"})
        self.client.patch(f"/api/tarefas/{cancelada}/", {"status": "cancelada"})

        resposta = self.client.get("/api/tarefas/?status=abertas")
        ids = [t["id"] for t in resposta.data["results"]]

        self.assertEqual(ids, [aberta])

    def test_trocar_o_responsavel_avisa_o_novo(self):
        tarefa_id = self._criar(responsavel=self.admin.id).data["id"]
        mail.outbox = []

        self.client.patch(f"/api/tarefas/{tarefa_id}/", {"responsavel": self.colega.id})

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["bruno@escritorio.com"])

    def test_editar_sem_trocar_responsavel_nao_reenvia_aviso(self):
        tarefa_id = self._criar().data["id"]
        mail.outbox = []

        self.client.patch(f"/api/tarefas/{tarefa_id}/", {"prioridade": "baixa"})

        self.assertEqual(len(mail.outbox), 0)

    def test_alta_prioridade_vem_antes_de_media_e_baixa(self):
        # Ordenar os campos de texto direto daria a ordem alfabética, em que
        # "media" vem antes de "alta".
        self._criar(titulo="Prioridade média", prioridade="media")
        self._criar(titulo="Prioridade baixa", prioridade="baixa")
        self._criar(titulo="Prioridade alta", prioridade="alta")

        resposta = self.client.get("/api/tarefas/")
        titulos = [t["titulo"] for t in resposta.data["results"]]

        self.assertEqual(
            titulos, ["Prioridade alta", "Prioridade média", "Prioridade baixa"]
        )

    def test_entre_tarefas_de_mesma_prioridade_vence_o_prazo_mais_proximo(self):
        hoje = timezone.localdate()
        self._criar(titulo="Para a semana que vem", prazo=(hoje + timedelta(days=7)).isoformat())
        self._criar(titulo="Para amanhã", prazo=(hoje + timedelta(days=1)).isoformat())
        self._criar(titulo="Sem prazo nenhum")

        resposta = self.client.get("/api/tarefas/")
        titulos = [t["titulo"] for t in resposta.data["results"]]

        self.assertEqual(
            titulos, ["Para amanhã", "Para a semana que vem", "Sem prazo nenhum"]
        )

    def test_tarefa_encerrada_vai_para_o_fim_da_lista(self):
        # "cancelada" vem antes de "em_andamento" em ordem alfabética, mas
        # quem trabalha quer ver primeiro o que ainda está aberto.
        concluida = self._criar(titulo="Já resolvida", prioridade="alta").data["id"]
        self.client.patch(f"/api/tarefas/{concluida}/", {"status": "concluida"})
        self._criar(titulo="Ainda pendente", prioridade="baixa")

        resposta = self.client.get("/api/tarefas/")
        titulos = [t["titulo"] for t in resposta.data["results"]]

        self.assertEqual(titulos, ["Ainda pendente", "Já resolvida"])

    def test_tarefa_de_outro_escritorio_nao_aparece(self):
        self._criar()
        outro = _criar_escritorio(nome="Escritório Vizinho", cnpj="11222333000262")
        usuario = _criar_usuario(outro, email="admin.vizinho@teste.com")
        Tarefa.objects.create(
            escritorio=outro,
            titulo="Tarefa do vizinho",
            responsavel=usuario,
        )

        resposta = self.client.get("/api/tarefas/")
        titulos = [t["titulo"] for t in resposta.data["results"]]

        self.assertNotIn("Tarefa do vizinho", titulos)
