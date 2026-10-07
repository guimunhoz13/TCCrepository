"""Filtros de lista e busca global."""


from django.contrib.auth.hashers import make_password
from rest_framework.test import APITestCase

from ..models import (
    Advogado,
    Cliente,
    ModeloDocumento,
    Processo,
    Tarefa,
    Usuario,
)
from .base import (
    _criar_escritorio,
    _criar_usuario,
    _EscritorioComDados,
    _gerar_token_de_acesso,
)


class FiltroBuscaAPITestCase(APITestCase):
    """Testa os filtros de busca em clientes e processos."""

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.admin = _criar_usuario(self.escritorio)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.admin)}"
        )

        self.cliente_joao = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="João Silva",
            cpf="11111111111",
            email="joao@teste.com",
            telefone="11999999999",
            endereco="Rua A",
        )
        self.cliente_maria = Cliente.objects.create(
            escritorio=self.escritorio,
            nome="Maria Souza",
            cpf="22222222222",
            email="maria@teste.com",
            telefone="11888888888",
            endereco="Rua B",
        )

        usuario_advogado = Usuario.objects.create(
            escritorio=self.escritorio,
            nome="Advogado Filtro",
            email="advogado.filtro@teste.com",
            senha=make_password("senha12345"),
            tipo_usuario="advogado",
        )
        self.advogado = Advogado.objects.create(
            escritorio=self.escritorio,
            usuario=usuario_advogado,
            oab="333333/SP",
            especialidade="Civil",
        )

        self.processo_andamento = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-0001",
            titulo="Ação de Cobrança",
            descricao="Descrição.",
            status="Em andamento",
            cliente=self.cliente_joao,
            advogado=self.advogado,
        )
        self.processo_concluido = Processo.objects.create(
            escritorio=self.escritorio,
            numero_processo="PROC-0002",
            titulo="Ação Trabalhista",
            descricao="Descrição.",
            status="Concluido",
            cliente=self.cliente_maria,
            advogado=self.advogado,
        )

    def test_busca_clientes_por_nome(self):
        resposta = self.client.get("/api/clientes/", {"busca": "João"})
        nomes = [c["nome"] for c in resposta.data["results"]]
        self.assertIn("João Silva", nomes)
        self.assertNotIn("Maria Souza", nomes)

    def test_busca_clientes_sem_correspondencia_retorna_vazio(self):
        resposta = self.client.get("/api/clientes/", {"busca": "Inexistente"})
        self.assertEqual(len(resposta.data["results"]), 0)

    def test_filtro_processos_por_status(self):
        resposta = self.client.get("/api/processos/", {"status": "Concluido"})
        numeros = [p["numero_processo"] for p in resposta.data["results"]]
        self.assertEqual(numeros, ["PROC-0002"])

    def test_filtro_processos_por_cliente(self):
        resposta = self.client.get("/api/processos/", {"cliente": self.cliente_joao.id})
        numeros = [p["numero_processo"] for p in resposta.data["results"]]
        self.assertEqual(numeros, ["PROC-0001"])

    def test_busca_processos_por_titulo(self):
        resposta = self.client.get("/api/processos/", {"busca": "Trabalhista"})
        numeros = [p["numero_processo"] for p in resposta.data["results"]]
        self.assertEqual(numeros, ["PROC-0002"])


class BuscaGlobalAPITestCase(_EscritorioComDados, APITestCase):

    def setUp(self):
        self.escritorio, self.usuario, self.advogado, self.cliente = self._montar()
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.usuario)}"
        )

    def _buscar(self, termo):
        return self.client.get("/api/busca/", {"q": termo})

    def test_termo_curto_nao_busca_nada(self):
        self.assertEqual(self._buscar("a").data, {})

    def test_ignora_acentos_e_maiusculas(self):
        Cliente.objects.create(escritorio=self.escritorio, nome="João Conceição")

        resposta = self._buscar("CONCEICAO")

        self.assertEqual([c["nome"] for c in resposta.data["clientes"]], ["João Conceição"])

    def test_acha_processo_pelo_nome_do_cliente(self):
        self._processo(self.escritorio, self.cliente, self.advogado, "0001-23")

        resposta = self._buscar("cliente a")

        self.assertEqual([p["numero_processo"] for p in resposta.data["processos"]], ["0001-23"])

    def test_acha_em_varias_areas_de_uma_vez(self):
        processo = self._processo(self.escritorio, self.cliente, self.advogado, "X-1", titulo="Despejo")
        Tarefa.objects.create(
            escritorio=self.escritorio, titulo="Revisar despejo", processo=processo, responsavel=self.usuario
        )
        ModeloDocumento.objects.create(escritorio=self.escritorio, nome="Notificação", conteudo="Ação de despejo")

        resposta = self._buscar("despejo")

        self.assertEqual(len(resposta.data["processos"]), 1)
        self.assertEqual(len(resposta.data["tarefas"]), 1)
        self.assertEqual(len(resposta.data["modelos"]), 1)
        self.assertEqual(resposta.data["clientes"], [])

    def test_limita_a_quatro_resultados_por_area(self):
        for i in range(6):
            Cliente.objects.create(escritorio=self.escritorio, nome=f"Silva {i}")

        self.assertEqual(len(self._buscar("silva").data["clientes"]), 4)

    def test_nao_enxerga_outro_escritorio(self):
        outro, _, _, _ = self._montar(nome="Outro", cnpj="99999999000199", email="o@o.com", sufixo="b")
        Cliente.objects.create(escritorio=outro, nome="Segredo Alheio")

        self.assertEqual(self._buscar("segredo").data["clientes"], [])
