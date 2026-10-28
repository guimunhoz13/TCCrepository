"""Regressões descobertas na auditoria de 27/10/2026 (dados sintéticos)."""
from unittest.mock import patch
from datetime import datetime, timezone as datetime_timezone

from django.test import override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APITestCase

from ..models import ApontamentoHora, Contrato, InscricaoPush, SuperAdmin
from ..push import notificar_usuario
from .base import _EquipeDoEscritorio, _gerar_token_master


class AuditoriaRotasAnonimasTests(APITestCase):
    def test_todas_operacoes_protegidas_exigem_token(self):
        """Percorre todas as operações autenticadas descritas no contrato real."""
        import re
        esquema = self.client.get(
            "/api/schema/", HTTP_ACCEPT="application/vnd.oai.openapi+json"
        ).json()
        operacoes = []
        for caminho, item in esquema["paths"].items():
            for metodo, operacao in item.items():
                if metodo not in ("get", "post", "patch", "put", "delete"):
                    continue
                seguranca = operacao.get("security", esquema.get("security", []))
                if seguranca and {} not in seguranca:
                    operacoes.append((caminho, metodo))
        self.assertGreater(len(operacoes), 100)
        for caminho, metodo in operacoes:
            caminho = re.sub(r"\{[^}]+\}", "1", caminho)
            with self.subTest(caminho=caminho, metodo=metodo):
                resposta = getattr(self.client, metodo)(caminho, {}, format="json")
                self.assertIn(resposta.status_code, (401, 403))



class AuditoriaPermissoesTests(_EquipeDoEscritorio, APITestCase):
    def setUp(self):
        self._equipe()
        self.processo = self._processo(self.escritorio, self.cliente, self.advogado, "AUDIT-1")
        Contrato.objects.create(escritorio=self.escritorio, processo=self.processo, valor_total="1234.56")
        ApontamentoHora.objects.create(
            escritorio=self.escritorio, processo=self.processo, usuario=self.admin,
            minutos=60, data=timezone.localdate(), valor_hora="200.00",
        )

    def test_ficha_nao_contorna_a_permissao_financeira(self):
        for perfil in ("estagiario", "secretaria"):
            with self.subTest(perfil=perfil):
                self._como(perfil)
                self.assertEqual(self.client.get("/api/contratos/").status_code, 403)
                resposta = self.client.get(f"/api/processos/{self.processo.pk}/ficha/")
                self.assertEqual(resposta.status_code, 200)
                self.assertIsNone(resposta.data["contrato"])
                self.assertIsNone(resposta.data["resumo"])

    def test_ficha_respeita_permissao_de_leitura_das_horas(self):
        self._como("secretaria")
        self.assertEqual(self.client.get("/api/apontamentos/").status_code, 403)
        resposta = self.client.get(f"/api/processos/{self.processo.pk}/ficha/")
        self.assertEqual(resposta.data["apontamentos"], [])

    def test_ficha_preserva_contrato_para_perfis_autorizados(self):
        for perfil in ("admin", "advogado", "financeiro"):
            with self.subTest(perfil=perfil):
                self._como(perfil)
                dados = self.client.get(f"/api/processos/{self.processo.pk}/ficha/").data
                self.assertIsNotNone(dados["contrato"])
                self.assertIsNotNone(dados["resumo"])

    def test_configuracao_invalida_nao_salva_parte_do_escritorio(self):
        self._como("admin")
        nome_anterior = self.escritorio.nome
        resposta = self.client.patch("/api/configuracoes/escritorio/", {
            "nome": "Nome que deve sofrer rollback",
            "tipo_chave_pix": "tipo-inexistente",
        }, format="json")
        self.assertEqual(resposta.status_code, 400)
        self.escritorio.refresh_from_db()
        self.assertEqual(self.escritorio.nome, nome_anterior)

    def test_filtros_invalidos_retornam_400(self):
        self._como("admin")
        for rota, parametros in (
            ("apontamentos", {"processo": "invalido"}),
            ("apontamentos", {"usuario": "invalido"}),
            ("apontamentos", {"inicio": "2026-02-30"}),
            ("apontamentos", {"fim": "nao-e-data"}),
            ("despesas", {"processo": "invalido"}),
        ):
            with self.subTest(rota=rota, parametros=parametros):
                resposta = self.client.get(f"/api/{rota}/", parametros)
                self.assertEqual(resposta.status_code, 400)

    def test_documento_da_conta_respeita_extensao_assinatura_e_tamanho(self):
        self._como("admin")
        for nome, conteudo in (
            ("invalido.exe", b"arquivo sintetico"),
            ("invalido.pdf", b"arquivo sintetico sem assinatura"),
            ("grande.pdf", b"%PDF-" + b"0" * (10 * 1024 * 1024)),
        ):
            with self.subTest(nome=nome):
                resposta = self.client.patch("/api/configuracoes/conta/", {
                    "documento_identidade": SimpleUploadedFile(nome, conteudo),
                }, format="multipart")
                self.assertEqual(resposta.status_code, 400)
                self.admin.refresh_from_db()
                self.assertFalse(self.admin.documento_identidade)

    def test_documento_do_advogado_nao_contorna_validadores_do_modelo(self):
        self._como("admin")
        resposta = self.client.patch(f"/api/advogados/{self.advogado.pk}/", {
            "documento_identidade": SimpleUploadedFile("invalido.pdf", b"sem assinatura"),
        }, format="multipart")
        self.assertEqual(resposta.status_code, 400)

    def test_parcela_inicial_usa_data_local_na_virada_utc(self):
        from ..views.financeiro import _gerar_parcelas

        contrato = Contrato.objects.get(processo=self.processo)
        instante = datetime(2026, 10, 28, 0, 30, tzinfo=datetime_timezone.utc)
        with timezone.override("America/Sao_Paulo"), patch("django.utils.timezone.now", return_value=instante):
            _gerar_parcelas(contrato)
        self.assertEqual(contrato.parcelas.get().data_vencimento.isoformat(), "2026-10-27")


@override_settings(VAPID_PUBLIC_KEY="teste-publica", VAPID_PRIVATE_KEY="teste-privada")
class AuditoriaPushTests(_EquipeDoEscritorio, APITestCase):
    def setUp(self):
        self._equipe()
        self._como("admin")

    def test_push_recusa_destino_fora_dos_provedores(self):
        for endpoint in (
            "https://127.0.0.1/push", "https://localhost/push",
            "https://example.org/push", "https://fcm.googleapis.com.example.org/push",
            "https://fcm.googleapis.com:8443/push", "https://usuario@fcm.googleapis.com/push",
        ):
            with self.subTest(endpoint=endpoint):
                resposta = self.client.post("/api/push/inscrever/", {
                    "endpoint": endpoint, "keys": {"p256dh": "a", "auth": "b"},
                }, format="json")
                self.assertEqual(resposta.status_code, 400)

    def test_push_recusa_chaves_malformadas_sem_500(self):
        for chaves in ("texto", [1], {"p256dh": [1], "auth": "a"}):
            with self.subTest(chaves=chaves):
                resposta = self.client.post("/api/push/inscrever/", {
                    "endpoint": "https://fcm.googleapis.com/fcm/send/teste", "keys": chaves,
                }, format="json")
                self.assertEqual(resposta.status_code, 400)

    def test_push_nao_aceita_token_master_como_membro(self):
        master = SuperAdmin.objects.create(nome="Auditoria", email="master@example.org", senha="inutilizavel")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_master(master)}")
        for rota in ("inscrever", "cancelar", "testar"):
            with self.subTest(rota=rota), patch("advocacia.views.notificacoes_push.notificar_usuario") as enviar:
                resposta = self.client.post(f"/api/push/{rota}/", {
                    "endpoint": "https://fcm.googleapis.com/fcm/send/teste",
                    "keys": {"p256dh": "a", "auth": "b"},
                }, format="json")
                self.assertEqual(resposta.status_code, 403)
                enviar.assert_not_called()

    def test_destino_interno_legado_nao_e_acessado(self):
        InscricaoPush.objects.create(
            usuario=self.admin, endpoint="https://127.0.0.1/legado", p256dh="a", auth="b"
        )
        with patch("requests.post") as enviar:
            self.assertEqual(notificar_usuario(self.admin, "Teste", "Sintético"), 0)
        enviar.assert_not_called()
