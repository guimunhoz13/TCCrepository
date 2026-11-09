"""Entradas JSON inválidas devem retornar 400, sem executar integrações.

Todos os dados e usuários são exclusivos do banco local de testes.
"""
from unittest.mock import patch

from django.core.cache import cache
from rest_framework.test import APITestCase

from ..models import Cliente, ModeloDocumento
from .base import _EquipeDoEscritorio


class RobustezEntradasAPITests(_EquipeDoEscritorio, APITestCase):
    def setUp(self):
        cache.clear()
        self._equipe()
        self._como("admin")

    def tearDown(self):
        cache.clear()

    def test_login_com_tipos_invalidos_nao_gera_erro_interno(self):
        self.client.credentials()
        self.client.raise_request_exception = False
        for rota in ("/api/login/", "/api/master/login/"):
            for dados in ({"email": None, "senha": "x"}, {"email": ["x"], "senha": "x"},
                          {"email": "admin@exemplo.test", "senha": {"x": 1}}, ["email", "senha"]):
                with self.subTest(rota=rota, dados=dados):
                    resposta = self.client.post(rota, dados, format="json")
                    self.assertEqual(resposta.status_code, 400)

    def test_modelos_recusam_identificadores_malformados_sem_erro_interno(self):
        modelo = ModeloDocumento.objects.create(escritorio=self.escritorio, nome="Modelo auditoria",
                                                tipo="outros", conteudo="{{cliente.nome}}")
        self.client.raise_request_exception = False
        for campo in ("cliente", "processo"):
            for valor in ("abc", [], {"id": 1}, True, -1, 1.5, 10**100):
                with self.subTest(campo=campo, valor=valor):
                    resposta = self.client.post(f"/api/modelos-documento/{modelo.pk}/gerar/",
                                                {campo: valor}, format="json")
                    self.assertEqual(resposta.status_code, 400)

    def test_modelo_nao_mistura_cliente_com_processo_de_outra_pessoa(self):
        processo = self._processo(self.escritorio, self.cliente, self.advogado, "MODELO-COERENTE")
        outro = Cliente.objects.create(escritorio=self.escritorio, nome="Outro cliente fictício")
        modelo = ModeloDocumento.objects.create(escritorio=self.escritorio, nome="Modelo com vínculos",
                                                tipo="outros", conteudo="{{cliente.nome}} / {{processo.numero}}")
        url = f"/api/modelos-documento/{modelo.pk}/gerar/"
        self.assertEqual(self.client.post(url, {"cliente": self.cliente.pk, "processo": processo.pk}, format="json").status_code, 200)
        resposta = self.client.post(url, {"cliente": outro.pk, "processo": processo.pk}, format="json")
        self.assertEqual(resposta.status_code, 400)
        self.assertNotIn("conteudo", resposta.data)

    def test_intimacoes_recusam_filtro_de_processo_invalido(self):
        self.client.raise_request_exception = False
        for valor in ("abc", "1.5", "-1", str(10**100)):
            with self.subTest(valor=valor):
                self.assertEqual(self.client.get("/api/intimacoes/", {"processo": valor}).status_code, 400)

    @patch("advocacia.views.ia.gerar_resposta_ia")
    def test_assistente_recusa_estrutura_invalida_antes_de_chamar_provedor(self, gerar):
        gerar.return_value = "Resposta sintética; nenhum provedor externo foi chamado."
        self.client.raise_request_exception = False
        for dados in ({"mensagem": ["pergunta"]}, {"mensagem": "Olá", "contexto": [1]},
                      {"mensagem": "Olá", "historico": "texto"}):
            with self.subTest(dados=dados):
                self.assertEqual(self.client.post("/api/assistente-ia/", dados, format="json").status_code, 400)
        gerar.assert_not_called()

    def test_calculadora_recusa_dias_fracionarios_booleanos_e_estouro_de_data(self):
        self.client.raise_request_exception = False
        for dados in ({"data_inicio": "2026-11-09", "dias": 1.5},
                      {"data_inicio": "2026-11-09", "dias": True},
                      {"data_inicio": "2026-11-09", "dias": 10001},
                      {"data_inicio": "9999-12-31", "dias": 1, "dias_uteis": False}):
            with self.subTest(dados=dados):
                self.assertEqual(self.client.post("/api/agenda/calcular-prazo/", dados, format="json").status_code, 400)

    def test_configuracao_invalida_nao_salva_parcialmente_o_escritorio(self):
        nome = self.escritorio.nome
        resposta = self.client.patch("/api/configuracoes/escritorio/",
                                    {"nome": "NÃO SALVAR ESTE NOME", "timezone": "inexistente"}, format="json")
        self.assertEqual(resposta.status_code, 400)
        self.escritorio.refresh_from_db()
        self.assertEqual(self.escritorio.nome, nome)

    def test_dados_pessoais_com_tipos_invalidos_sao_recusados(self):
        self.client.raise_request_exception = False
        for campo in ("nome", "email", "telefone"):
            with self.subTest(campo=campo):
                self.assertEqual(self.client.patch("/api/configuracoes/conta/", {campo: ["inválido"]}, format="json").status_code, 400)

    def test_configuracoes_recusam_nome_maior_que_a_coluna_sem_erro_interno(self):
        self.client.raise_request_exception = False
        for rota, modelo in (("/api/configuracoes/conta/", self.admin),
                             ("/api/configuracoes/escritorio/", self.escritorio)):
            with self.subTest(rota=rota):
                tamanho = modelo._meta.get_field("nome").max_length
                self.assertEqual(self.client.patch(rota, {"nome": "x" * (tamanho + 1)}, format="json").status_code, 400)

    def test_corpos_json_nao_objeto_sao_recusados_nas_operacoes_customizadas(self):
        self.client.raise_request_exception = False
        for rota in ("/api/login/2fa/", "/api/logout/", "/api/token/refresh/",
                     "/api/login/esqueci-senha/", "/api/login/redefinir-senha/", "/api/escritorios/confirmar-email/",
                     "/api/configuracoes/senha/", "/api/configuracoes/2fa/", "/api/push/cancelar/"):
            with self.subTest(rota=rota):
                self.assertEqual(self.client.post(rota, ["inválido"], format="json").status_code, 400)

    def test_recuperacao_e_tokens_recusam_tipos_invalidos(self):
        self.client.raise_request_exception = False
        casos = [("/api/login/esqueci-senha/", "email"),
                 ("/api/login/redefinir-senha/", "token"), ("/api/escritorios/confirmar-email/", "token"),
                 ("/api/configuracoes/senha/", "senha_atual")]
        for rota, campo in casos:
            with self.subTest(rota=rota):
                self.assertEqual(self.client.post(rota, {campo: {"invalido": 1}}, format="json").status_code, 400)
