"""Processos, movimentações, ficha, próximo prazo e download de documentos."""

from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import (
    Advogado,
    Agenda,
    ApontamentoHora,
    Cliente,
    Contrato,
    Despesa,
    Documento,
    Movimentacao,
    Processo,
    Tarefa,
    Usuario,
)
from .base import _criar_escritorio, _criar_usuario, _gerar_token_de_acesso


class ProcessosAPITestCase(APITestCase):
    """Testa o CRUD de processos, incluindo o erro de número duplicado."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Processo",
            cpf="22233344455",
            email="cliente.processo@teste.com",
            telefone="11988887777",
            endereco="Rua Cliente, 1",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Processo",
            email="advogado.processo@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="111111/SP",
            especialidade="Civil",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def _payload_valido(self, **overrides):
        dados = {
            "numero_processo": "PROC-0001",
            "titulo": "Processo Teste",
            "descricao": "Descrição do processo.",
            "status": "Em andamento",
            "cliente": self.cliente.id,
            "advogado": self.advogado.id,
        }
        dados.update(overrides)
        return dados

    def test_criar_processo(self):
        resposta = self.client.post("/api/processos/", self._payload_valido(), format="json")
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)

    def test_criar_processo_com_numero_duplicado_retorna_erro_especifico(self):
        """Antes, o número duplicado (unique_together com escritorio, campo
        que não está no serializer) derrubava um IntegrityError não tratado
        (500 genérico). Agora deve voltar um 400 claro, no campo
        "numero_processo"."""
        Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-0001",
            titulo="Processo Original",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        resposta = self.client.post("/api/processos/", self._payload_valido(), format="json")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("numero_processo", resposta.data)

    def test_editar_processo_para_numero_de_outro_retorna_erro_especifico(self):
        Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-0001",
            titulo="Processo Original",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        outro = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-0002",
            titulo="Processo Dois",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        resposta = self.client.patch(
            f"/api/processos/{outro.id}/",
            {"numero_processo": "PROC-0001"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("numero_processo", resposta.data)

    def test_criar_processo_com_dados_juridicos_adicionais(self):
        resposta = self.client.post(
            "/api/processos/",
            self._payload_valido(
                area_direito="trabalhista",
                vara="3ª Vara do Trabalho",
                comarca="Araçatuba",
                valor_causa="50000.00",
                nome_parte_contraria="Empresa Ré Ltda",
                nome_advogado_adverso="Dr. Advogado Adverso",
                oab_advogado_adverso="654321/SP",
                percentual_honorarios_sucumbencia="15.00",
            ),
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["area_direito"], "trabalhista")
        self.assertEqual(resposta.data["vara"], "3ª Vara do Trabalho")
        self.assertEqual(resposta.data["nome_parte_contraria"], "Empresa Ré Ltda")
        self.assertEqual(resposta.data["valor_estimado_honorarios_sucumbencia"], "7500.00")

    def test_processo_sem_dados_juridicos_adicionais_tem_estimativa_nula(self):
        resposta = self.client.post("/api/processos/", self._payload_valido(), format="json")
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(resposta.data["valor_estimado_honorarios_sucumbencia"])

    def test_valor_da_causa_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/processos/",
            self._payload_valido(valor_causa="0.00"),
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("valor_causa", resposta.data)

    def test_percentual_honorarios_sucumbencia_zero_e_rejeitado(self):
        resposta = self.client.post(
            "/api/processos/",
            self._payload_valido(percentual_honorarios_sucumbencia="0"),
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("percentual_honorarios_sucumbencia", resposta.data)


class MovimentacaoCriadoPorAPITestCase(APITestCase):
    """Testa que uma movimentação registra quem a criou."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Mov",
            cpf="77777777777",
            email="cliente.mov@teste.com",
            telefone="11966666688",
            endereco="Rua G",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Mov",
            email="advogado.mov@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="777777/SP",
            especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-MOV-1",
            titulo="Processo Movimentação",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_movimentacao_registra_o_usuario_que_criou(self):
        resposta = self.client.post(
            "/api/movimentacoes/",
            {"processo": self.processo.id, "descricao": "Petição protocolada."},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["criado_por_nome"], "Ana Admin")

        movimentacao = Movimentacao.objects.get(id=resposta.data["id"])
        self.assertEqual(movimentacao.criado_por, self.admin)


class MovimentacaoManualAPITestCase(APITestCase):
    """A ficha do processo só tinha andamento vindo do DataJud — não havia
    como lançar à mão nem apagar o que foi lançado errado. Cobre as duas
    pontas, e a regra que protege o histórico oficial: só o que foi
    lançado manualmente pode ser excluído."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio, nome="Cliente Mov Manual", cpf="66677788899",
            email="cliente.movmanual@teste.com", telefone="11955554444", endereco="Rua H",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio, nome="Advogado Mov Manual",
            email="advogado.movmanual@teste.com", senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio, usuario=usuario_advogado, oab="888888/SP", especialidade="Civil",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio, numero_processo="PROC-MOV-MANUAL-1",
            titulo="Processo Movimentação Manual", descricao="Descrição.",
            cliente=self.cliente, advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_movimentacao_criada_pela_api_nasce_com_origem_manual(self):
        resposta = self.client.post(
            "/api/movimentacoes/",
            {"processo": self.processo.id, "descricao": "Cliente enviou novos documentos."},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["origem"], "manual")

    def test_exclui_movimentacao_lancada_manualmente(self):
        movimentacao = Movimentacao.objects.create(
            processo=self.processo, criado_por=self.admin, descricao="Lançamento por engano.",
        )
        resposta = self.client.delete(f"/api/movimentacoes/{movimentacao.id}/")
        self.assertEqual(resposta.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Movimentacao.objects.filter(id=movimentacao.id).exists())

    def test_nao_exclui_movimentacao_importada_do_datajud(self):
        movimentacao = Movimentacao.objects.create(
            processo=self.processo, descricao="Juntada de petição.",
            origem="datajud", identificador_externo="mov-datajud-1",
        )
        resposta = self.client.delete(f"/api/movimentacoes/{movimentacao.id}/")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Movimentacao.objects.filter(id=movimentacao.id).exists())


class FichaDoProcessoAPITestCase(APITestCase):
    """A ficha reúne, numa resposta só, tudo o que estava espalhado em sete
    painéis — movimentações, documentos, agenda, tarefas, horas, despesas
    e contrato. Existir a rota não bastava: cada bloco precisa vir com o
    formato certo e nenhum vazar de outro escritório."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Cliente Ficha",
            cpf="33344455566",
            email="cliente.ficha@teste.com",
            telefone="11977776666",
            endereco="Rua Ficha, 1",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Ficha",
            email="advogado.ficha@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="222222/SP",
            especialidade="Cível",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-FICHA-1",
            titulo="Processo da Ficha",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_ficha_de_processo_vazio_traz_listas_vazias_e_sem_contrato(self):
        resposta = self.client.get(f"/api/processos/{self.processo.id}/ficha/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(resposta.data["processo"]["id"], self.processo.id)
        self.assertEqual(resposta.data["movimentacoes"], [])
        self.assertEqual(resposta.data["documentos"], [])
        self.assertEqual(resposta.data["agenda"], [])
        self.assertEqual(resposta.data["tarefas"], [])
        self.assertEqual(resposta.data["apontamentos"], [])
        self.assertEqual(resposta.data["despesas"], [])
        self.assertIsNone(resposta.data["contrato"])
        self.assertEqual(Decimal(str(resposta.data["resumo"]["valor_contratado"])), Decimal("0.00"))

    def test_ficha_reune_todos_os_blocos_do_processo(self):
        Movimentacao.objects.create(
            processo=self.processo,
            descricao="Juntada de petição.", criado_por=self.admin,
        )
        Agenda.objects.create(
            processo=self.processo,
            titulo="Audiência", tipo="compromisso", data_evento=timezone.now(),
        )
        Tarefa.objects.create(
            escritorio=self.escritorio, processo=self.processo,
            titulo="Revisar minuta", responsavel=self.admin,
        )
        ApontamentoHora.objects.create(
            escritorio=self.escritorio, processo=self.processo, usuario=self.admin,
            data=timezone.localdate(), minutos=90, descricao="Audiência.",
        )
        Despesa.objects.create(
            escritorio=self.escritorio, processo=self.processo, tipo="custas",
            descricao="Guia de custas.", valor=Decimal("312.45"), data=timezone.localdate(),
        )
        contrato = Contrato.objects.create(
            escritorio=self.escritorio, processo=self.processo,
            tipo_honorario="fixo", valor_total=Decimal("5000.00"),
        )

        resposta = self.client.get(f"/api/processos/{self.processo.id}/ficha/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(len(resposta.data["movimentacoes"]), 1)
        self.assertEqual(len(resposta.data["agenda"]), 1)
        self.assertEqual(len(resposta.data["tarefas"]), 1)
        self.assertEqual(len(resposta.data["apontamentos"]), 1)
        self.assertEqual(len(resposta.data["despesas"]), 1)
        self.assertIsNotNone(resposta.data["contrato"])
        self.assertEqual(resposta.data["contrato"]["id"], contrato.id)
        self.assertEqual(
            Decimal(str(resposta.data["resumo"]["valor_contratado"])), Decimal("5000.00")
        )

    def test_ficha_expoe_a_origem_da_movimentacao(self):
        Movimentacao.objects.create(
            processo=self.processo,
            descricao="Lançada à mão.", criado_por=self.admin, origem="manual",
        )
        Movimentacao.objects.create(
            processo=self.processo,
            descricao="Importada do tribunal.", origem="datajud",
            identificador_externo="123:2026-01-01T00:00:00",
        )

        resposta = self.client.get(f"/api/processos/{self.processo.id}/ficha/")

        origens = {m["origem"] for m in resposta.data["movimentacoes"]}
        self.assertEqual(origens, {"manual", "datajud"})

    def test_ficha_nao_alcanca_processo_de_outro_escritorio(self):
        outro_escritorio = _criar_escritorio(nome="Escritório Alheio", cnpj="11222333000181")
        outro_cliente = Cliente.objects.create(
            escritorio=outro_escritorio, nome="Cliente Alheio", cpf="99988877766",
            email="alheio@teste.com", telefone="11966665555", endereco="Rua Alheia, 1",
        )
        outro_usuario_adv = Usuario.objects.create(
            escritorio=outro_escritorio, nome="Advogado Alheio",
            email="advogado.alheio@teste.com", senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        outro_advogado = Advogado.objects.create(
            escritorio=outro_escritorio, usuario=outro_usuario_adv,
            oab="333333/SP", especialidade="Cível",
        )
        processo_alheio = Processo.objects.create(
            escritorio=outro_escritorio, numero_processo="PROC-ALHEIO-1",
            titulo="Processo Alheio", descricao="d",
            cliente=outro_cliente, advogado=outro_advogado,
        )

        resposta = self.client.get(f"/api/processos/{processo_alheio.id}/ficha/")

        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    def test_ficha_exige_autenticacao(self):
        self.client.credentials()

        resposta = self.client.get(f"/api/processos/{self.processo.id}/ficha/")

        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_processo_serializado_traz_data_de_sincronizacao_com_datajud(self):
        agora = timezone.now()
        self.processo.datajud_sincronizado_em = agora
        self.processo.save()

        resposta = self.client.get(f"/api/processos/{self.processo.id}/ficha/")

        self.assertIsNotNone(resposta.data["processo"]["datajud_sincronizado_em"])


class ProximoPrazoDoProcessoAPITestCase(APITestCase):
    """A listagem de processos precisa sinalizar urgência sem que quem usa
    a tela tenha que abrir a ficha de cada um para descobrir se há prazo
    vencendo."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio, nome="Cliente Prazo", cpf="44455566677",
            email="cliente.prazo@teste.com", telefone="11966665555", endereco="Rua P",
        )
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio, nome="Advogado Prazo",
            email="advogado.prazo@teste.com", senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio, usuario=usuario_advogado,
            oab="555555/SP", especialidade="Cível",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio, numero_processo="PROC-PRAZO-1",
            titulo="Processo com prazo", descricao="d",
            cliente=self.cliente, advogado=self.advogado,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def _processo_na_listagem(self):
        resposta = self.client.get("/api/processos/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        (item,) = [p for p in resposta.data["results"] if p["id"] == self.processo.id]
        return item

    def test_processo_sem_prazo_nao_tem_proximo_prazo(self):
        item = self._processo_na_listagem()
        self.assertIsNone(item["proximo_prazo"])

    def test_prazo_futuro_aparece_e_nao_esta_atrasado(self):
        Agenda.objects.create(
            processo=self.processo,
            titulo="Contestação", tipo="prazo",
            data_evento=timezone.now() + timedelta(days=3),
        )

        item = self._processo_na_listagem()

        self.assertIsNotNone(item["proximo_prazo"])
        self.assertFalse(item["proximo_prazo"]["atrasado"])

    def test_prazo_vencido_aparece_como_atrasado(self):
        Agenda.objects.create(
            processo=self.processo,
            titulo="Contestação", tipo="prazo",
            data_evento=timezone.now() - timedelta(days=1),
        )

        item = self._processo_na_listagem()

        self.assertTrue(item["proximo_prazo"]["atrasado"])

    def test_prazo_cumprido_nao_conta_como_proximo_prazo(self):
        Agenda.objects.create(
            processo=self.processo,
            titulo="Contestação", tipo="prazo",
            data_evento=timezone.now() - timedelta(days=1), cumprido=True,
        )

        item = self._processo_na_listagem()

        self.assertIsNone(item["proximo_prazo"])

    def test_compromisso_nao_e_confundido_com_prazo(self):
        Agenda.objects.create(
            processo=self.processo,
            titulo="Reunião", tipo="compromisso",
            data_evento=timezone.now() + timedelta(days=1),
        )

        item = self._processo_na_listagem()

        self.assertIsNone(item["proximo_prazo"])

    def test_com_varios_prazos_traz_o_mais_proximo(self):
        Agenda.objects.create(
            processo=self.processo,
            titulo="Prazo distante", tipo="prazo",
            data_evento=timezone.now() + timedelta(days=30), prioridade="normal",
        )
        Agenda.objects.create(
            processo=self.processo,
            titulo="Prazo fatal próximo", tipo="prazo",
            data_evento=timezone.now() + timedelta(days=1), prioridade="fatal",
        )

        item = self._processo_na_listagem()

        self.assertEqual(item["proximo_prazo"]["prioridade"], "fatal")

    def test_processo_recem_criado_tambem_traz_proximo_prazo(self):
        # Fora da listagem paginada (sem o prefetch), o serializer cai para
        # a consulta direta — este teste cobre esse caminho.
        Agenda.objects.create(
            processo=self.processo,
            titulo="Contestação", tipo="prazo",
            data_evento=timezone.now() + timedelta(days=2),
        )

        resposta = self.client.patch(
            f"/api/processos/{self.processo.id}/", {"titulo": "Novo título"}, format="json"
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertIsNotNone(resposta.data["proximo_prazo"])


class DownloadAutenticadoAPITestCase(APITestCase):
    """Documento e o documento de identidade de cliente/usuário não saem
    mais como URL direta no serializer — só por uma rota autenticada que
    confere o escritório (e, para usuário, também quem está pedindo)."""

    def setUp(self):
        self.escritorio_a = _criar_escritorio()
        self.admin_a = _criar_usuario(self.escritorio_a)
        self.escritorio_b = _criar_escritorio(
            nome="Outro Escritorio", cnpj="99999999000199", email="outro@teste.com"
        )
        self.admin_b = _criar_usuario(self.escritorio_b, email="admin.b@teste.com")

        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio_a, nome="Cliente Download", cpf="11122233344",
            email="download@teste.com", telefone="11988887777", endereco="Rua D",
            documento_identidade=SimpleUploadedFile("rg.pdf", b"%PDF-1.4\nconteudo do rg"),
        )
        usuario_adv = Usuario.objects.create(
            escritorio=self.escritorio_a, nome="Advogado Download", email="advdownload@teste.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio_a, usuario=usuario_adv, oab="999999/SP", especialidade="Cível",
        )
        self.processo = Processo.objects.create(
            escritorio=self.escritorio_a, numero_processo="PROC-DOWNLOAD-1",
            titulo="Processo Download", descricao="d", cliente=self.cliente, advogado=self.advogado,
        )
        self.documento = Documento.objects.create(
            processo=self.processo, nome_arquivo="peticao.pdf",
            arquivo=SimpleUploadedFile("peticao.pdf", b"%PDF-1.4\nconteudo da peticao"),
        )

    def _entrar_como(self, usuario):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(usuario)}")

    # ---------- documentos do processo ----------

    def test_serializer_de_documento_nao_expoe_url_do_arquivo(self):
        self._entrar_como(self.admin_a)
        resposta = self.client.get(f"/api/documentos/{self.documento.id}/")
        self.assertNotIn("arquivo", resposta.data)

    def test_download_de_documento_do_proprio_escritorio_funciona(self):
        self._entrar_como(self.admin_a)
        resposta = self.client.get(f"/api/documentos/{self.documento.id}/download/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        conteudo = b"".join(resposta.streaming_content)
        self.assertEqual(conteudo, b"%PDF-1.4\nconteudo da peticao")

    def test_download_de_documento_de_outro_escritorio_e_404(self):
        self._entrar_como(self.admin_b)
        resposta = self.client.get(f"/api/documentos/{self.documento.id}/download/")
        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    def test_download_de_documento_sem_autenticacao_e_negado(self):
        resposta = self.client.get(f"/api/documentos/{self.documento.id}/download/")
        self.assertIn(resposta.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    # ---------- documento de identidade do cliente ----------

    def test_serializer_de_cliente_nao_expoe_url_mas_avisa_que_ha_documento(self):
        self._entrar_como(self.admin_a)
        resposta = self.client.get(f"/api/clientes/{self.cliente.id}/")
        self.assertNotIn("documento_identidade", resposta.data)
        self.assertTrue(resposta.data["documento_identidade_enviado"])

    def test_download_do_documento_de_identidade_do_cliente_funciona(self):
        self._entrar_como(self.admin_a)
        resposta = self.client.get(f"/api/clientes/{self.cliente.id}/documento-identidade/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

    def test_download_do_documento_de_identidade_de_cliente_de_outro_escritorio_e_404(self):
        self._entrar_como(self.admin_b)
        resposta = self.client.get(f"/api/clientes/{self.cliente.id}/documento-identidade/")
        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    # ---------- documento de identidade do usuário ----------

    def test_advogado_baixa_o_proprio_documento_de_identidade(self):
        usuario_com_doc = Usuario.objects.create(
            escritorio=self.escritorio_a, nome="Advogado com Doc", email="advcomdoc@teste.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
            documento_identidade=SimpleUploadedFile("oab.pdf", b"%PDF-1.4\ndoc do advogado"),
        )
        self._entrar_como(usuario_com_doc)
        resposta = self.client.get(f"/api/usuarios/{usuario_com_doc.id}/documento-identidade/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)

    def test_advogado_nao_baixa_documento_de_identidade_de_outro_advogado(self):
        outro_adv = Usuario.objects.create(
            escritorio=self.escritorio_a, nome="Outro Advogado", email="outroadv@teste.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
            documento_identidade=SimpleUploadedFile("oab2.pdf", b"%PDF-1.4\ndoc do outro"),
        )
        usuario_solicitante = Usuario.objects.create(
            escritorio=self.escritorio_a, nome="Advogado Solicitante", email="solicitante@teste.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
        )
        self._entrar_como(usuario_solicitante)
        resposta = self.client.get(f"/api/usuarios/{outro_adv.id}/documento-identidade/")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_baixa_documento_de_identidade_de_qualquer_usuario_do_escritorio(self):
        usuario_com_doc = Usuario.objects.create(
            escritorio=self.escritorio_a, nome="Advogado com Doc 2", email="advcomdoc2@teste.com",
            senha=make_password("senha12345"), tipo_usuario="advogado",
            documento_identidade=SimpleUploadedFile("oab3.pdf", b"%PDF-1.4\ndoc"),
        )
        self._entrar_como(self.admin_a)
        resposta = self.client.get(f"/api/usuarios/{usuario_com_doc.id}/documento-identidade/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
