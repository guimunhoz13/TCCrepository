"""Clientes e pedidos do titular (LGPD)."""

import json
from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APITestCase

from ..models import (
    Cliente,
    Processo,
    RegistroAuditoria,
)
from .base import (
    _criar_escritorio,
    _criar_usuario,
    _EquipeDoEscritorio,
    _gerar_token_de_acesso,
)


@patch("advocacia.validators._dominio_tem_mx", return_value=True)
class ClientesAPITestCase(APITestCase):
    """Testa o CRUD de clientes e o isolamento multi-tenant por escritório."""

    def setUp(self):
        self.escritorio_a = _criar_escritorio(
            nome="Escritorio A", cnpj="11111111000111", email="a@teste.com",
        )
        self.escritorio_b = _criar_escritorio(
            nome="Escritorio B", cnpj="22222222000122", email="b@teste.com",
        )
        self.admin_a = _criar_usuario(
            self.escritorio_a, nome="Admin A", email="admin.a@teste.com",
        )
        self.admin_b = _criar_usuario(
            self.escritorio_b, nome="Admin B", email="admin.b@teste.com",
        )
        self.cliente_a = Cliente.objects.create(
            escritorio=self.escritorio_a,
            nome="Cliente A",
            cpf="11122233344",
            email="cliente.a@teste.com",
            telefone="11988887777",
            endereco="Rua Cliente A",
        )

    def test_listar_clientes_sem_autenticacao_e_negado(self, _mock_mx):
        resposta = self.client.get("/api/clientes/")
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_cliente_autenticado(self, _mock_mx):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.post(
            "/api/clientes/",
            {
                "nome": "Novo Cliente",
                "cpf": "55566677788",
                "email": "novo@gmail.com",
                "telefone": "11977776666",
                "endereco": "Rua Nova, 10",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Cliente.objects.filter(escritorio=self.escritorio_a).count(), 2
        )

    def test_criar_cliente_com_cpf_duplicado_retorna_erro_especifico(self, _mock_mx):
        """Antes, um CPF duplicado (unique_together com escritorio, campo
        que não está no serializer) derrubava um IntegrityError não tratado
        (500 genérico). Agora deve voltar um 400 claro, no campo "cpf"."""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.post(
            "/api/clientes/",
            {
                "nome": "Outro Cliente",
                "cpf": "11122233344",  # mesmo CPF do cliente_a
                "email": "outro@gmail.com",
                "telefone": "11977776666",
                "endereco": "Rua Nova, 10",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cpf", resposta.data)

    def test_editar_cliente_para_cpf_de_outro_retorna_erro_especifico(self, _mock_mx):
        outro_cliente = Cliente.objects.create(
            escritorio=self.escritorio_a,
            nome="Cliente C",
            cpf="99988877766",
            email="cliente.c@teste.com",
            telefone="11988887779",
            endereco="Rua Cliente C",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.patch(
            f"/api/clientes/{outro_cliente.id}/",
            {"cpf": self.cliente_a.cpf},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cpf", resposta.data)

    def test_isolamento_multi_tenant_entre_escritorios(self, _mock_mx):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_b)}"
        )
        resposta = self.client.get("/api/clientes/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        nomes = [cliente["nome"] for cliente in resposta.data["results"]]
        self.assertNotIn("Cliente A", nomes)
        self.assertEqual(len(resposta.data["results"]), 0)

    def test_criar_cliente_pessoa_juridica_com_cnpj(self, _mock_mx):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.post(
            "/api/clientes/",
            {
                "tipo_pessoa": "juridica",
                "nome": "Empresa Cliente Ltda",
                "cnpj": "12345678000199",
                "email": "empresa@teste.com",
                "telefone": "11977776666",
                "endereco": "Av. Empresarial, 500",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["tipo_pessoa"], "juridica")
        self.assertEqual(resposta.data["cnpj"], "12345678000199")
        self.assertEqual(resposta.data["cpf"], "")

    def test_criar_cliente_com_cnpj_duplicado_retorna_erro_especifico(self, _mock_mx):
        Cliente.objects.create(
            escritorio=self.escritorio_a,
            tipo_pessoa="juridica",
            nome="Empresa Existente",
            cnpj="99988877000166",
            email="existente@teste.com",
            telefone="11988887779",
            endereco="Rua Empresa",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.post(
            "/api/clientes/",
            {
                "tipo_pessoa": "juridica",
                "nome": "Outra Empresa",
                "cnpj": "99988877000166",  # mesmo CNPJ
                "email": "outra@teste.com",
                "telefone": "11977776666",
                "endereco": "Rua Nova, 10",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cnpj", resposta.data)

    def test_dois_clientes_pessoa_juridica_sem_cpf_nao_colidem(self, _mock_mx):
        """cpf="" para dois clientes PJ no mesmo escritório não pode ser
        tratado como CPF duplicado — só o unique_together antigo faria isso,
        por isso virou um UniqueConstraint condicional (cpf != "")."""
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        for indice in range(2):
            resposta = self.client.post(
                "/api/clientes/",
                {
                    "tipo_pessoa": "juridica",
                    "nome": f"Empresa {indice}",
                    "cnpj": f"1111111100010{indice}",
                    "email": f"empresa{indice}@teste.com",
                    "telefone": "11977776666",
                    "endereco": "Rua Empresarial",
                },
                format="json",
            )
            self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)

    def test_dois_clientes_pessoa_fisica_sem_cnpj_nao_colidem(self, _mock_mx):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        for indice in range(2):
            resposta = self.client.post(
                "/api/clientes/",
                {
                    "nome": f"Pessoa {indice}",
                    "cpf": f"1234567890{indice}",
                    "email": f"pessoa{indice}@teste.com",
                    "telefone": "11977776666",
                    "endereco": "Rua Pessoal",
                },
                format="json",
            )
            self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)

    def test_admin_ve_apenas_clientes_do_proprio_escritorio(self, _mock_mx):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin_a)}"
        )
        resposta = self.client.get("/api/clientes/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        nomes = [cliente["nome"] for cliente in resposta.data["results"]]
        self.assertEqual(nomes, ["Cliente A"])


class LgpdClienteAPITestCase(_EquipeDoEscritorio, APITestCase):

    def setUp(self):
        self._equipe()
        self.cliente.nome = "Fulano de Tal"
        self.cliente.cpf = "12345678900"
        self.cliente.email = "titular@ex.com"
        self.cliente.telefone = "11988887777"
        self.cliente.save()
        self.processo = self._processo(self.escritorio, self.cliente, self.advogado, "L-1")

    def test_consentimento_registra_a_data_sozinho(self):
        self._como("advogado")
        resposta = self.client.patch(
            f"/api/clientes/{self.cliente.id}/", {"consentimento_lgpd": True}, format="json"
        )
        self.assertTrue(resposta.data["consentimento_lgpd"])
        self.assertIsNotNone(resposta.data["consentimento_lgpd_em"])

    def test_exporta_os_dados_do_titular_em_json(self):
        self._como("advogado")
        resposta = self.client.get(f"/api/clientes/{self.cliente.id}/exportar-dados/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertIn("attachment", resposta["Content-Disposition"])
        dados = json.loads(resposta.content)
        self.assertEqual(dados["cliente"]["cpf"], "12345678900")
        self.assertEqual(dados["processos"][0]["numero"], "L-1")
        self.assertTrue(RegistroAuditoria.objects.filter(acao="exportacao").exists())

    def test_estagiario_nao_atende_pedido_do_titular(self):
        self._como("estagiario")
        self.assertEqual(
            self.client.get(f"/api/clientes/{self.cliente.id}/exportar-dados/").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_anonimizar_apaga_dados_pessoais_e_mantem_o_processo(self):
        nome = self.cliente.nome
        RegistroAuditoria.objects.create(
            escritorio=self.escritorio, acao="criacao", descricao=f"{nome} cadastrado."
        )
        self._como("advogado")
        resposta = self.client.post(f"/api/clientes/{self.cliente.id}/anonimizar/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)

        self.cliente.refresh_from_db()
        self.assertEqual(self.cliente.cpf, "")
        self.assertEqual(self.cliente.email, "")
        self.assertFalse(self.cliente.ativo)
        self.assertIsNotNone(self.cliente.anonimizado_em)
        self.assertTrue(Processo.objects.filter(pk=self.processo.pk, cliente=self.cliente).exists())
        self.assertFalse(RegistroAuditoria.objects.filter(descricao__icontains=nome).exists())

        de_novo = self.client.post(f"/api/clientes/{self.cliente.id}/anonimizar/")
        self.assertEqual(de_novo.status_code, status.HTTP_400_BAD_REQUEST)
