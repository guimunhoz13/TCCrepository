"""Modelos de documento com variáveis."""

from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from ..modelos_documento import montar_contexto, preencher
from ..models import (
    Advogado,
    Cliente,
    Escritorio,
    ModeloDocumento,
    Processo,
    Usuario,
)
from .base import _criar_escritorio, _criar_usuario, _gerar_token_de_acesso


class PreenchimentoDeModeloTestCase(TestCase):
    """Testa o preenchimento de variáveis — inclusive o que ele se recusa a fazer."""

    def setUp(self):
        self.escritorio = _criar_escritorio(cidade="Araçatuba")
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Maria Fernanda Costa",
            cpf="123.456.789-00",
            rg="12.345.678-9",
            email="maria@teste.com",
            telefone="11988887777",
            endereco="Rua das Flores, 100",
            estado_civil="casado",
            nacionalidade="brasileira",
        )

    def test_substitui_variaveis_do_cliente(self):
        contexto = montar_contexto(self.escritorio, cliente=self.cliente)
        texto, desconhecidas, vazias = preencher(
            "Eu, {{cliente.nome}}, {{cliente.nacionalidade}}, {{cliente.estado_civil}}, "
            "portador do CPF {{cliente.cpf}}.",
            contexto,
        )

        self.assertIn("Maria Fernanda Costa", texto)
        self.assertIn("brasileira", texto)
        self.assertIn("Casado(a)", texto)
        self.assertIn("123.456.789-00", texto)
        self.assertEqual(desconhecidas, [])

    def test_variavel_fora_do_catalogo_e_mantida_e_sinalizada(self):
        contexto = montar_contexto(self.escritorio, cliente=self.cliente)
        texto, desconhecidas, _ = preencher("Valor: {{cliente.inventado}}", contexto)

        self.assertIn("{{cliente.inventado}}", texto)
        self.assertEqual(desconhecidas, ["cliente.inventado"])

    def test_nao_expoe_campo_sensivel_por_travessia_de_atributo(self):
        """A senha do usuário nunca deve ser alcançável a partir de um modelo."""
        usuario = _criar_usuario(self.escritorio)
        contexto = montar_contexto(self.escritorio, cliente=self.cliente)

        texto, desconhecidas, _ = preencher(
            "{{usuario.senha}} {{cliente.senha}} {{escritorio.plano}}", contexto
        )

        self.assertNotIn(usuario.senha, texto)
        self.assertIn("{{usuario.senha}}", texto)
        self.assertIn("{{cliente.senha}}", texto)
        self.assertIn("{{escritorio.plano}}", texto)
        self.assertEqual(len(desconhecidas), 3)

    def test_campo_em_branco_no_cadastro_e_sinalizado(self):
        self.cliente.rg = ""
        self.cliente.save()
        contexto = montar_contexto(self.escritorio, cliente=self.cliente)

        texto, _, vazias = preencher("RG: {{cliente.rg}}.", contexto)

        self.assertEqual(texto, "RG: .")
        self.assertIn("cliente.rg", vazias)

    def test_data_por_extenso_e_cidade(self):
        contexto = montar_contexto(self.escritorio)
        texto, _, _ = preencher("{{data.cidade_e_data}}", contexto)

        self.assertIn("Araçatuba,", texto)
        self.assertRegex(texto, r"\d{1,2} de \w+ de \d{4}")

    def test_processo_preenche_cliente_e_advogado_automaticamente(self):
        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="João Henrique Sabino",
            email="joao.modelo@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="123456/SP",
            especialidade="Civil",
        )
        processo = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="0001234-56.2026.5.15.0002",
            titulo="Ação de cobrança",
            descricao="Descrição.",
            cliente=self.cliente,
            advogado=advogado,
            area_direito="civil",
            valor_causa=Decimal("15000.00"),
        )

        contexto = montar_contexto(self.escritorio, processo=processo)
        texto, _, _ = preencher(
            "{{cliente.nome}} / {{advogado.nome}} - OAB {{advogado.oab}} / "
            "{{processo.numero}} / {{processo.valor_causa}}",
            contexto,
        )

        self.assertIn("Maria Fernanda Costa", texto)
        self.assertIn("João Henrique Sabino", texto)
        self.assertIn("123456/SP", texto)
        self.assertIn("0001234-56.2026.5.15.0002", texto)
        self.assertIn("R$ 15.000,00", texto)

    def test_espacos_dentro_das_chaves_sao_tolerados(self):
        contexto = montar_contexto(self.escritorio, cliente=self.cliente)
        texto, _, _ = preencher("{{ cliente.nome }}", contexto)

        self.assertEqual(texto, "Maria Fernanda Costa")


class ModeloDocumentoAPITestCase(APITestCase):
    """Testa o CRUD de modelos e a geração do documento preenchido."""

    def setUp(self):
        self.escritorio = _criar_escritorio(cidade="Araçatuba")
        self.admin = _criar_usuario(self.escritorio)
        self.cliente = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Roberto Almeida Lima",
            cpf="987.654.321-00",
            email="roberto@teste.com",
            telefone="11977776666",
            endereco="Av. Brasil, 500",
        )
        self.modelo = ModeloDocumento.objects.create(
            escritorio=self.escritorio,
            nome="Procuração ad judicia",
            tipo="procuracao",
            conteudo="OUTORGANTE: {{cliente.nome}}, CPF {{cliente.cpf}}.\n{{data.cidade_e_data}}",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

    def test_listar_variaveis_disponiveis(self):
        resposta = self.client.get("/api/modelos-documento/variaveis/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        chaves = [item["chave"] for item in resposta.data]
        self.assertIn("cliente.nome", chaves)
        self.assertIn("data.cidade_e_data", chaves)

    def test_gerar_documento_a_partir_de_cliente(self):
        resposta = self.client.post(
            f"/api/modelos-documento/{self.modelo.id}/gerar/",
            {"cliente": self.cliente.id},
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertIn("Roberto Almeida Lima", resposta.data["conteudo"])
        self.assertIn("987.654.321-00", resposta.data["conteudo"])
        self.assertIn("Araçatuba", resposta.data["conteudo"])

    def test_gerar_sem_cliente_nem_processo_e_rejeitado(self):
        resposta = self.client.post(f"/api/modelos-documento/{self.modelo.id}/gerar/", {})

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nao_preenche_com_cliente_de_outro_escritorio(self):
        outro = Escritorio.objects.create(
            nome="Outro Escritório",
            cnpj="77.777.777/0001-77",
            email="outro3@escritorio.com",
            telefone="11900000000",
            endereco="Rua W",
        )
        cliente_alheio = Cliente.objects.create(
            escritorio=outro,
            nome="Cliente Alheio",
            cpf="111.111.111-11",
            email="alheio2@teste.com",
            telefone="11900000001",
            endereco="Rua V",
        )

        resposta = self.client.post(
            f"/api/modelos-documento/{self.modelo.id}/gerar/",
            {"cliente": cliente_alheio.id},
        )

        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    def test_modelo_de_outro_escritorio_nao_e_acessivel(self):
        outro = Escritorio.objects.create(
            nome="Outro Escritório 2",
            cnpj="66.666.666/0001-66",
            email="outro4@escritorio.com",
            telefone="11900000002",
            endereco="Rua U",
        )
        modelo_alheio = ModeloDocumento.objects.create(
            escritorio=outro,
            nome="Modelo alheio",
            tipo="outros",
            conteudo="{{cliente.nome}}",
        )

        resposta = self.client.get(f"/api/modelos-documento/{modelo_alheio.id}/")

        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    def test_criar_modelo_pela_api(self):
        resposta = self.client.post(
            "/api/modelos-documento/",
            {
                "nome": "Declaração de hipossuficiência",
                "tipo": "declaracao",
                "conteudo": "Eu, {{cliente.nome}}, declaro...",
            },
        )

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        self.assertEqual(resposta.data["tipo_display"], "Declaração")

    def test_nome_de_modelo_duplicado_no_mesmo_escritorio_e_rejeitado(self):
        resposta = self.client.post(
            "/api/modelos-documento/",
            {"nome": "Procuração ad judicia", "tipo": "procuracao", "conteudo": "x"},
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
