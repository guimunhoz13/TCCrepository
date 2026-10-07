"""Lembretes agendados e avisos por evento."""

from unittest.mock import patch

from django.contrib.auth.hashers import make_password
from django.core import mail
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import (
    Advogado,
    Agenda,
    Cliente,
    Escritorio,
    NotificacaoEnviada,
    PreferenciasUsuario,
    Processo,
    Usuario,
)
from .base import _criar_escritorio, _criar_usuario, _gerar_token_de_acesso


class EnvioDeLembretesTestCase(TestCase):
    """Testa o comando que dispara lembretes de agenda e o resumo semanal."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)
        # O resumo semanal fica desligado por padrão de propósito: o comando
        # o envia sozinho às segundas-feiras, e deixá-lo ligado aqui faria a
        # contagem de e-mails destes testes depender do dia da execução.
        self.preferencias = PreferenciasUsuario.objects.create(
            usuario=self.usuario,
            lembrete_audiencia=True,
            lembrete_prazo=True,
            antecedencia_audiencia=2,
            resumo_semanal=False,
        )
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Lembrete",
            cpf="77777777777",
            email="cliente.lembrete@teste.com",
            telefone="11966666666",
            endereco="Rua L",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Lembrete",
            email="advogado.lembrete@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="555555/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-LEMB-1",
            titulo="Processo Lembrete",
            descricao="Descrição.",
            cliente=cliente,
            advogado=advogado,
        )

    def _criar_evento(self, dias_a_frente, tipo="prazo", cumprido=False):
        return Agenda.objects.create(
            processo=self.processo,
            tipo=tipo,
            titulo=f"Evento em {dias_a_frente} dia(s)",
            descricao="Descrição do evento.",
            data_evento=timezone.now() + timezone.timedelta(days=dias_a_frente, hours=1),
            cumprido=cumprido,
        )

    def test_evento_dentro_da_antecedencia_gera_email(self):
        self._criar_evento(1)

        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Evento em 1 dia(s)", mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, [self.usuario.email])

    def test_evento_fora_da_antecedencia_nao_gera_email(self):
        self._criar_evento(10)

        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 0)

    def test_evento_ja_cumprido_nao_gera_email(self):
        self._criar_evento(1, cumprido=True)

        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 0)

    def test_comando_e_idempotente(self):
        self._criar_evento(1)

        call_command("enviar_lembretes")
        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(NotificacaoEnviada.objects.filter(tipo="lembrete_evento").count(), 1)

    def test_preferencia_desligada_nao_gera_email(self):
        self.preferencias.lembrete_prazo = False
        self.preferencias.lembrete_audiencia = False
        self.preferencias.save()
        self._criar_evento(1)

        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 0)

    def test_dry_run_nao_envia_nem_registra(self):
        self._criar_evento(1)

        call_command("enviar_lembretes", "--dry-run")

        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(NotificacaoEnviada.objects.count(), 0)

    def test_usuario_inativo_nao_recebe(self):
        self.usuario.ativo = False
        self.usuario.save()
        self._criar_evento(1)

        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 0)

    def test_resumo_semanal_e_enviado_uma_vez_por_semana(self):
        self.preferencias.resumo_semanal = True
        self.preferencias.save()

        call_command("enviar_lembretes", "--resumo-semanal")
        call_command("enviar_lembretes", "--resumo-semanal")

        resumos = [m for m in mail.outbox if m.subject.startswith("Resumo da semana")]
        self.assertEqual(len(resumos), 1)
        self.assertEqual(NotificacaoEnviada.objects.filter(tipo="resumo_semanal").count(), 1)

    def test_resumo_semanal_lista_eventos_da_semana(self):
        self.preferencias.lembrete_audiencia = False
        self.preferencias.lembrete_prazo = False
        self.preferencias.resumo_semanal = True
        self.preferencias.save()
        self._criar_evento(3, tipo="compromisso")

        call_command("enviar_lembretes", "--resumo-semanal")

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Evento em 3 dia(s)", mail.outbox[0].body + str(mail.outbox[0].alternatives))

    def test_falha_de_envio_nao_marca_como_enviado(self):
        self._criar_evento(1)

        with patch("advocacia.management.commands.enviar_lembretes.enviar_email") as envio:
            envio.side_effect = Exception("SMTP fora do ar")
            call_command("enviar_lembretes")

        self.assertEqual(NotificacaoEnviada.objects.count(), 0)

        # Com o serviço de volta, o lembrete é enviado normalmente.
        call_command("enviar_lembretes")
        self.assertEqual(len(mail.outbox), 1)

    def test_contagem_de_dias_usa_o_fuso_local(self):
        """Evento às 23h de Brasília cai no dia seguinte em UTC. Contar a
        diferença sobre a data UTC erraria por um dia — daí a conversão."""
        amanha_a_noite = (timezone.localtime() + timezone.timedelta(days=1)).replace(
            hour=23, minute=0, second=0, microsecond=0
        )
        Agenda.objects.create(
            processo=self.processo,
            tipo="prazo",
            titulo="Prazo noturno",
            descricao="Descrição.",
            data_evento=amanha_a_noite,
        )

        call_command("enviar_lembretes")

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("amanhã", mail.outbox[0].subject)

    def test_usuario_de_outro_escritorio_nao_recebe_eventos_alheios(self):
        outro = Escritorio.objects.create(
            nome="Outro Escritório",
            cnpj="99.999.999/0001-99",
            email="outro@escritorio.com",
            telefone="11955555555",
            endereco="Rua X",
        )
        intruso = Usuario.objects.create(
            escritorio=outro,
            nome="Intruso",
            email="intruso@outro.com",
            senha=make_password("senha12345"),
            tipo_usuario="admin",
        )
        PreferenciasUsuario.objects.create(usuario=intruso, lembrete_prazo=True)
        self._criar_evento(1)

        call_command("enviar_lembretes")

        destinatarios = [d for m in mail.outbox for d in m.to]
        self.assertIn(self.usuario.email, destinatarios)
        self.assertNotIn(intruso.email, destinatarios)


class AvisosPorEventoAPITestCase(APITestCase):
    """Testa os avisos disparados no momento da ação (seção E-mail das preferências)."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.autor = _criar_usuario(self.escritorio)
        PreferenciasUsuario.objects.create(
            usuario=self.autor,
            notificacao_novo_processo=True,
            notificacao_novo_cliente=True,
            notificacao_status_processo=True,
        )
        self.colega = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Colega",
            email="colega@escritorio.com",
            senha=make_password("senha12345"),
            tipo_usuario="admin",
        )
        PreferenciasUsuario.objects.create(
            usuario=self.colega,
            notificacao_novo_processo=True,
            notificacao_novo_cliente=True,
            notificacao_status_processo=True,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.autor)}"
        )

    def _criar_processo(self):
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Aviso",
            cpf="88888888888",
            email="cliente.aviso@teste.com",
            telefone="11944444444",
            endereco="Rua A",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Aviso",
            email="advogado.aviso@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="666666/SP",
            especialidade="Civil",
        )
        return Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-AVISO-1",
            titulo="Processo Aviso",
            descricao="Descrição.",
            cliente=cliente,
            advogado=advogado,
        )

    def test_novo_cliente_avisa_os_colegas(self):
        resposta = self.client.post(
            "/api/clientes/",
            {
                "nome": "Cliente Novo",
                "cpf": "12312312399",
                "email": "cliente.novo@teste.com",
                "telefone": "11933333333",
                "endereco": "Rua Nova",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Novo cliente cadastrado", mail.outbox[0].subject)

    def test_autor_da_acao_nao_recebe_o_proprio_aviso(self):
        self.client.post(
            "/api/clientes/",
            {
                "nome": "Cliente Novo",
                "cpf": "12312312399",
                "email": "cliente.novo@teste.com",
                "telefone": "11933333333",
                "endereco": "Rua Nova",
            },
        )

        destinatarios = [d for m in mail.outbox for d in m.to]
        self.assertIn(self.colega.email, destinatarios)
        self.assertNotIn(self.autor.email, destinatarios)

    def test_preferencia_desligada_nao_recebe(self):
        self.colega.preferencias.notificacao_novo_cliente = False
        self.colega.preferencias.save()

        self.client.post(
            "/api/clientes/",
            {
                "nome": "Cliente Novo",
                "cpf": "12312312399",
                "email": "cliente.novo@teste.com",
                "telefone": "11933333333",
                "endereco": "Rua Nova",
            },
        )

        self.assertEqual(len(mail.outbox), 0)

    def test_mudanca_de_status_avisa_os_colegas(self):
        processo = self._criar_processo()

        resposta = self.client.patch(
            f"/api/processos/{processo.id}/", {"status": "Concluido"}
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        avisos = [m for m in mail.outbox if "Status de processo alterado" in m.subject]
        self.assertEqual(len(avisos), 1)
        self.assertEqual(avisos[0].to, [self.colega.email])

    def test_edicao_sem_mudar_status_nao_avisa(self):
        processo = self._criar_processo()

        self.client.patch(f"/api/processos/{processo.id}/", {"titulo": "Outro título"})

        avisos = [m for m in mail.outbox if "Status de processo alterado" in m.subject]
        self.assertEqual(len(avisos), 0)

    def test_falha_de_email_nao_derruba_a_operacao(self):
        with patch("advocacia.notificacoes.enviar_email") as envio:
            envio.side_effect = Exception("SMTP fora do ar")
            resposta = self.client.post(
                "/api/clientes/",
                {
                    "nome": "Cliente Novo",
                    "cpf": "12312312399",
                    "email": "cliente.novo@teste.com",
                    "telefone": "11933333333",
                    "endereco": "Rua Nova",
                },
            )

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Cliente.objects.filter(nome="Cliente Novo").exists())
