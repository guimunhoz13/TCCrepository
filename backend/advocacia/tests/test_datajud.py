"""Integração com o DataJud (CNJ)."""

import urllib.error
from datetime import date
from unittest.mock import patch

from django.contrib.auth.hashers import make_password
from django.core import mail
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..datajud import (
    ErroDataJud,
    alias_do_tribunal,
    interpretar_resposta,
    partes_do_numero,
)
from ..models import (
    Advogado,
    Cliente,
    Escritorio,
    Movimentacao,
    PreferenciasUsuario,
    Processo,
    RegistroAuditoria,
    Usuario,
)
from .base import (
    _criar_escritorio,
    _criar_usuario,
    _gerar_token_de_acesso,
    _resposta_datajud,
)


class NumeracaoCNJTestCase(TestCase):
    """Testa a leitura do número unificado e a descoberta do tribunal."""

    def test_quebra_o_numero_em_partes(self):
        partes = partes_do_numero("0005678-90.2026.8.26.0032")

        self.assertEqual(partes["sequencial"], "0005678")
        self.assertEqual(partes["digito"], "90")
        self.assertEqual(partes["ano"], "2026")
        self.assertEqual(partes["segmento"], "8")
        self.assertEqual(partes["tribunal"], "26")
        self.assertEqual(partes["origem"], "0032")

    def test_aceita_numero_sem_mascara(self):
        partes = partes_do_numero("00056789020268260032")
        self.assertEqual(partes["tribunal"], "26")

    def test_numero_com_tamanho_errado_e_rejeitado(self):
        with self.assertRaises(ErroDataJud):
            partes_do_numero("123456")

    def test_justica_estadual_vira_alias_do_tj(self):
        self.assertEqual(alias_do_tribunal("0005678-90.2026.8.26.0032"), "api_publica_tjsp")
        self.assertEqual(alias_do_tribunal("0005678-90.2026.8.19.0032"), "api_publica_tjrj")
        self.assertEqual(alias_do_tribunal("0005678-90.2026.8.13.0032"), "api_publica_tjmg")

    def test_justica_do_trabalho_vira_alias_do_trt(self):
        self.assertEqual(alias_do_tribunal("0001234-56.2026.5.15.0002"), "api_publica_trt15")
        self.assertEqual(alias_do_tribunal("0001234-56.2026.5.02.0002"), "api_publica_trt2")

    def test_justica_federal_vira_alias_do_trf(self):
        self.assertEqual(alias_do_tribunal("0001234-56.2026.4.03.0002"), "api_publica_trf3")

    def test_segmento_nao_coberto_explica_o_limite(self):
        with self.assertRaises(ErroDataJud) as contexto:
            alias_do_tribunal("0001234-56.2026.6.00.0002")

        self.assertIn("Estadual", str(contexto.exception))

    def test_codigo_de_tribunal_estadual_desconhecido_e_rejeitado(self):
        with self.assertRaises(ErroDataJud):
            alias_do_tribunal("0001234-56.2026.8.99.0002")


class InterpretacaoDaRespostaDataJudTestCase(TestCase):
    """Testa a leitura do JSON do DataJud, inclusive quando faltam campos."""

    def test_extrai_capa_e_movimentos(self):
        dados = interpretar_resposta(_resposta_datajud())

        self.assertEqual(dados["tribunal"], "TJSP")
        self.assertEqual(dados["orgao_julgador"], "2ª Vara Cível de Araçatuba")
        self.assertEqual(dados["classe"], "Execução de Título Extrajudicial")
        self.assertEqual(len(dados["movimentos"]), 2)
        self.assertEqual(dados["movimentos"][0]["descricao"], "Distribuição")

    def test_resposta_sem_resultados_devolve_none(self):
        self.assertIsNone(interpretar_resposta({"hits": {"hits": []}}))

    def test_resposta_vazia_devolve_none(self):
        self.assertIsNone(interpretar_resposta({}))
        self.assertIsNone(interpretar_resposta(None))

    def test_campos_ausentes_nao_quebram_a_leitura(self):
        """O formato varia entre tribunais; faltar campo não pode derrubar."""
        resposta = {"hits": {"hits": [{"_source": {"numeroProcesso": "123"}}]}}

        dados = interpretar_resposta(resposta)

        self.assertEqual(dados["numero_processo"], "123")
        self.assertEqual(dados["classe"], "")
        self.assertEqual(dados["orgao_julgador"], "")
        self.assertEqual(dados["movimentos"], [])

    def test_movimento_com_nome_alternativo_e_lido(self):
        resposta = _resposta_datajud(
            movimentos=[{"codigo": 9, "descricao": "Juntada", "data_hora": "2026-05-01T10:00:00Z"}]
        )

        dados = interpretar_resposta(resposta)

        self.assertEqual(dados["movimentos"][0]["descricao"], "Juntada")
        self.assertEqual(dados["movimentos"][0]["data_hora"], "2026-05-01T10:00:00Z")


class ConsultaDataJudAPITestCase(APITestCase):
    """Testa o endpoint de consulta, com a chamada de rede substituída."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente DataJud",
            cpf="44444444444",
            email="cliente.datajud@teste.com",
            telefone="11955554444",
            endereco="Rua J",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado DataJud",
            email="advogado.datajud@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="343434/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="0005678-90.2026.8.26.0032",
            titulo="Processo DataJud",
            descricao="Descrição.",
            cliente=cliente,
            advogado=advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )
        self.url = f"/api/processos/{self.processo.id}/consultar-datajud/"

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_consulta_importa_movimentacoes(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            resposta = self.client.post(self.url)

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(resposta.data["movimentacoes_importadas"], 2)
        self.assertEqual(resposta.data["capa"]["tribunal"], "TJSP")
        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_movimentacao_importada_guarda_a_data_do_tribunal(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            self.client.post(self.url)

        movimentacao = Movimentacao.objects.filter(
            processo=self.processo, descricao="Distribuição"
        ).first()

        self.assertIsNotNone(movimentacao)
        self.assertEqual(movimentacao.data_movimentacao.date(), date(2026, 3, 10))
        self.assertEqual(movimentacao.origem, "datajud")

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_consultar_duas_vezes_nao_duplica(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            self.client.post(self.url)
            segunda = self.client.post(self.url)

        self.assertEqual(segunda.data["movimentacoes_importadas"], 0)
        self.assertEqual(segunda.data["movimentacoes_ignoradas"], 2)
        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_movimento_novo_e_importado_sem_repetir_os_antigos(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            self.client.post(self.url)

        com_novo = _resposta_datajud(
            movimentos=[
                {"codigo": 26, "nome": "Distribuição", "dataHora": "2026-03-10T09:00:00.000Z"},
                {"codigo": 51, "nome": "Conclusão", "dataHora": "2026-04-02T16:30:00.000Z"},
                {"codigo": 193, "nome": "Sentença", "dataHora": "2026-09-19T11:00:00.000Z"},
            ]
        )
        with patch("advocacia.datajud._chamar_api", return_value=com_novo):
            resposta = self.client.post(self.url)

        self.assertEqual(resposta.data["movimentacoes_importadas"], 1)
        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 3)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_mesmo_codigo_em_datas_diferentes_nao_e_tratado_como_repetido(self):
        """Uma conclusão acontece várias vezes no mesmo processo."""
        movimentos = [
            {"codigo": 51, "nome": "Conclusão", "dataHora": "2026-04-02T16:30:00.000Z"},
            {"codigo": 51, "nome": "Conclusão", "dataHora": "2026-07-15T10:00:00.000Z"},
        ]
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud(movimentos)):
            resposta = self.client.post(self.url)

        self.assertEqual(resposta.data["movimentacoes_importadas"], 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_processo_inexistente_no_tribunal_devolve_404(self):
        with patch("advocacia.datajud._chamar_api", return_value={"hits": {"hits": []}}):
            resposta = self.client.post(self.url)

        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    @override_settings(DATAJUD_API_KEY="")
    def test_sem_chave_configurada_explica_o_que_falta(self):
        resposta = self.client.post(self.url)

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("DATAJUD_API_KEY", resposta.data["detail"])

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_chave_recusada_pelo_cnj_gera_mensagem_clara(self):
        erro = urllib.error.HTTPError(url="u", code=401, msg="Unauthorized", hdrs=None, fp=None)
        with patch("advocacia.datajud._chamar_api", side_effect=erro):
            resposta = self.client.post(self.url)

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("chave", resposta.data["detail"].lower())

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_falha_de_rede_nao_quebra_a_requisicao(self):
        with patch("advocacia.datajud._chamar_api", side_effect=urllib.error.URLError("sem rede")):
            resposta = self.client.post(self.url)

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("alcançar", resposta.data["detail"])

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_consulta_registra_auditoria(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            self.client.post(self.url)

        registro = RegistroAuditoria.objects.filter(
            escritorio=self.escritorio, descricao__icontains="DataJud"
        ).first()

        self.assertIsNotNone(registro)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_processo_de_outro_escritorio_nao_e_consultavel(self):
        outro = Escritorio.objects.create(
            nome="Outro Escritório DJ",
            cnpj="55.555.555/0001-55",
            email="outro5@escritorio.com",
            telefone="11900000003",
            endereco="Rua T",
        )
        cliente_alheio = Cliente.objects.create(
            escritorio=outro, nome="C", cpf="22222222222",
            email="c2@outro.com", telefone="11900000004", endereco="Rua S",
        )
        usuario_alheio = Usuario.objects.create(
            escritorio=outro, nome="A", email="a2@outro.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
        )
        advogado_alheio = Advogado.objects.create(
            escritorio=outro, usuario=usuario_alheio, oab="565656/SP", especialidade="Civil",
        )
        processo_alheio = Processo.objects.create(
            escritorio=outro, numero_processo="0009999-90.2026.8.26.0032",
            titulo="Alheio", descricao="d", cliente=cliente_alheio, advogado=advogado_alheio,
        )

        resposta = self.client.post(
            f"/api/processos/{processo_alheio.id}/consultar-datajud/"
        )

        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)


class SincronizacaoDataJudTestCase(TestCase):
    """Testa a rotina agendada que consulta o DataJud e avisa sobre andamentos."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)
        PreferenciasUsuario.objects.create(
            usuario=self.usuario, notificacao_movimentacao=True
        )
        cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Sync",
            cpf="10101010101",
            email="cliente.sync@teste.com",
            telefone="11911112222",
            endereco="Rua S",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Sync",
            email="advogado.sync@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="787878/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="0005678-90.2026.8.26.0032",
            titulo="Processo Sync",
            descricao="Descrição.",
            cliente=cliente,
            advogado=self.advogado,
            status="Em andamento",
        )

    def _processo_extra(self, numero, status):
        return Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo=numero,
            titulo=f"Processo {status}",
            descricao="Descrição.",
            cliente=self.processo.cliente,
            advogado=self.advogado,
            status=status,
        )

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_importa_andamentos_e_avisa(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            call_command("sincronizar_datajud")

        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 2)
        avisos = [m for m in mail.outbox if "Andamento novo" in m.subject]
        self.assertEqual(len(avisos), 1)
        self.assertEqual(avisos[0].to, [self.usuario.email])

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_sem_andamento_novo_nao_avisa(self):
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            call_command("sincronizar_datajud")
            Processo.objects.update(datajud_sincronizado_em=None)
            mail.outbox.clear()
            call_command("sincronizar_datajud")

        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_processo_concluido_nao_e_consultado(self):
        Processo.objects.filter(pk=self.processo.pk).update(status="Concluido")

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()) as chamada:
            call_command("sincronizar_datajud")

        chamada.assert_not_called()

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_processo_suspenso_continua_sendo_acompanhado(self):
        Processo.objects.filter(pk=self.processo.pk).update(status="Suspenso")

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()) as chamada:
            call_command("sincronizar_datajud")

        self.assertTrue(chamada.called)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_nao_reconsulta_antes_do_intervalo(self):
        Processo.objects.filter(pk=self.processo.pk).update(
            datajud_sincronizado_em=timezone.now()
        )

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()) as chamada:
            call_command("sincronizar_datajud", "--intervalo-horas", "12")

        chamada.assert_not_called()

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_falha_em_um_processo_nao_interrompe_os_demais(self):
        """Um número fora do padrão não pode abortar a varredura inteira."""
        Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="numero-invalido",
            titulo="Processo com número ruim",
            descricao="Descrição.",
            cliente=self.processo.cliente,
            advogado=self.advogado,
            status="Em andamento",
        )

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            call_command("sincronizar_datajud")

        # O processo válido foi sincronizado mesmo com o outro falhando.
        self.processo.refresh_from_db()
        self.assertIsNotNone(self.processo.datajud_sincronizado_em)
        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_limite_restringe_a_quantidade_por_execucao(self):
        for indice in range(3):
            self._processo_extra(f"000000{indice}-90.2026.8.26.0032", "Em andamento")

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()) as chamada:
            call_command("sincronizar_datajud", "--limite", "2")

        self.assertEqual(chamada.call_count, 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_processo_nunca_sincronizado_tem_prioridade_na_fila(self):
        """No Postgres, ASC põe NULL por último: sem nulls_first, um processo
        novo ficaria no fim da fila e o limite nunca o alcançaria."""
        Processo.objects.filter(pk=self.processo.pk).update(
            datajud_sincronizado_em=timezone.now() - timezone.timedelta(days=5)
        )
        novo_processo = self._processo_extra("0007777-90.2026.8.26.0032", "Em andamento")

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            call_command("sincronizar_datajud", "--limite", "1")

        novo_processo.refresh_from_db()
        self.assertIsNotNone(novo_processo.datajud_sincronizado_em)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_dry_run_nao_consulta_nem_grava(self):
        with patch("advocacia.datajud._chamar_api") as chamada:
            call_command("sincronizar_datajud", "--dry-run")

        chamada.assert_not_called()
        self.processo.refresh_from_db()
        self.assertIsNone(self.processo.datajud_sincronizado_em)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_preferencia_desligada_nao_recebe_aviso(self):
        self.usuario.preferencias.notificacao_movimentacao = False
        self.usuario.preferencias.save()

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            call_command("sincronizar_datajud")

        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(Movimentacao.objects.filter(processo=self.processo).count(), 2)

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_escritorio_inativo_nao_e_sincronizado(self):
        Escritorio.objects.filter(pk=self.escritorio.pk).update(ativo=False)

        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()) as chamada:
            call_command("sincronizar_datajud")

        chamada.assert_not_called()
