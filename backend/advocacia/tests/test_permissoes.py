"""Isolamento entre escritórios, perfis de acesso e processo sigiloso."""

from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import (
    Advogado,
    Agenda,
    Cliente,
    Contrato,
    Movimentacao,
    Processo,
)
from .base import (
    _criar_escritorio,
    _criar_usuario,
    _EquipeDoEscritorio,
    _gerar_refresh_token,
    _gerar_token_de_acesso,
)


class IsolamentoEAutorizacaoTestCase(APITestCase):
    """Cobre o que a suíte não cobria: escrita entre escritórios, escalada de
    privilégio e validade da conta a cada requisição.

    Os 244 testes anteriores passavam com essas falhas abertas porque quase
    todos usavam um escritório só, e os que usavam dois conferiam apenas se
    a LISTAGEM vazava. Nenhum tentava escrever com identificador alheio.
    """

    def setUp(self):
        self.a = _criar_escritorio()
        self.b = _criar_escritorio(nome="Escritório B", cnpj="98765432000199")

        self.advogado_a = _criar_usuario(self.a, email="adv@a.com", tipo_usuario="advogado")
        self.admin_a = _criar_usuario(self.a, email="admin@a.com", tipo_usuario="admin")

        self.cliente_b = Cliente.objects.create(
            escritorio=self.b, nome="Cliente do B", cpf="55544433322",
            email="cliente@b.com", telefone="11955554444", endereco="Rua B",
        )
        usuario_adv_b = _criar_usuario(self.b, email="adv@b.com", tipo_usuario="advogado")
        self.advogado_b = Advogado.objects.create(
            escritorio=self.b, usuario=usuario_adv_b, oab="333333/SP", especialidade="Cível",
        )
        self.processo_b = Processo.objects.create(
            escritorio=self.b, numero_processo="PROC-B-1", titulo="Do escritório B",
            descricao="Descrição.", cliente=self.cliente_b, advogado=self.advogado_b,
        )

        self._entrar_como(self.advogado_a)

    def _entrar_como(self, usuario):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(usuario)}"
        )

    # ---------- escalada de privilégio ----------

    def test_advogado_nao_se_promove_a_administrador(self):
        resposta = self.client.patch(
            f"/api/usuarios/{self.advogado_a.id}/", {"tipo_usuario": "admin"}
        )

        self.advogado_a.refresh_from_db()
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.advogado_a.tipo_usuario, "advogado")

    def test_a_rota_generica_nao_troca_senha(self):
        senha_antes = self.advogado_a.senha

        resposta = self.client.patch(f"/api/usuarios/{self.advogado_a.id}/", {"senha": "a"})

        self.advogado_a.refresh_from_db()
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.advogado_a.senha, senha_antes)

    def test_advogado_nao_reativa_a_propria_conta(self):
        resposta = self.client.patch(f"/api/usuarios/{self.advogado_a.id}/", {"ativo": True})

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_advogado_nao_edita_outro_usuario(self):
        resposta = self.client.patch(
            f"/api/usuarios/{self.admin_a.id}/", {"nome": "Nome trocado"}
        )

        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_cada_um_edita_os_proprios_dados(self):
        resposta = self.client.patch(
            f"/api/usuarios/{self.advogado_a.id}/", {"telefone": "11912345678"}
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)

    def test_colega_ve_apenas_resumo_da_equipe(self):
        self.admin_a.cpf = "12345678909"
        self.admin_a.rg = "123456789"
        self.admin_a.save(update_fields=["cpf", "rg"])

        for resposta in (
            self.client.get("/api/usuarios/"),
            self.client.get(f"/api/usuarios/{self.admin_a.pk}/"),
        ):
            self.assertEqual(resposta.status_code, status.HTTP_200_OK)
            membro = resposta.data["results"][0] if "results" in resposta.data else (
                resposta.data[0] if isinstance(resposta.data, list) else resposta.data
            )
            self.assertNotIn("cpf", membro)
            self.assertNotIn("rg", membro)
            self.assertNotIn("data_nascimento", membro)
            self.assertNotIn("documento_identidade_enviado", membro)

        configuracoes = self.client.get("/api/configuracoes/")
        self.assertEqual(configuracoes.status_code, status.HTTP_200_OK)
        self.assertTrue(any(membro["id"] == self.admin_a.pk for membro in configuracoes.data["membros"]))
        self.assertTrue(all("cpf" not in membro and "rg" not in membro for membro in configuracoes.data["membros"]))
        self.assertIn("cpf", configuracoes.data["usuario"])

    def test_admin_pode_consultar_dados_completos_de_membro(self):
        self._entrar_como(self.admin_a)
        resposta = self.client.get(f"/api/usuarios/{self.advogado_a.pk}/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertIn("cpf", resposta.data)

    def test_administrador_troca_o_perfil_de_outro(self):
        self._entrar_como(self.admin_a)

        resposta = self.client.post(
            f"/api/usuarios/{self.advogado_a.id}/definir-perfil/", {"tipo_usuario": "admin"}
        )

        self.advogado_a.refresh_from_db()
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(self.advogado_a.tipo_usuario, "admin")

    def test_administrador_nao_altera_o_proprio_perfil(self):
        self._entrar_como(self.admin_a)

        resposta = self.client.post(
            f"/api/usuarios/{self.admin_a.id}/definir-perfil/", {"tipo_usuario": "advogado"}
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_escritorio_nao_fica_sem_administrador(self):
        outro_admin = _criar_usuario(self.a, email="admin2@a.com", tipo_usuario="admin")
        self._entrar_como(self.admin_a)

        resposta = self.client.post(
            f"/api/usuarios/{outro_admin.id}/definir-perfil/", {"tipo_usuario": "advogado"}
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)

        # Agora só resta um administrador: rebaixá-lo deixaria o escritório sem nenhum.
        self._entrar_como(outro_admin)
        resposta = self.client.post(
            f"/api/usuarios/{self.admin_a.id}/definir-perfil/", {"tipo_usuario": "advogado"}
        )
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_apenas_administrador_desativa_usuario(self):
        resposta = self.client.post(f"/api/usuarios/{self.admin_a.id}/alternar-ativo/")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

        self._entrar_como(self.admin_a)
        resposta = self.client.post(f"/api/usuarios/{self.advogado_a.id}/alternar-ativo/")
        self.advogado_a.refresh_from_db()
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertFalse(self.advogado_a.ativo)

    # ---------- isolamento na escrita ----------

    def test_processo_nao_aceita_cliente_de_outro_escritorio(self):
        resposta = self.client.post("/api/processos/", {
            "numero_processo": "PROC-A-1", "titulo": "Tentativa", "descricao": "d",
            "cliente": self.cliente_b.id, "advogado": self.advogado_b.id,
            "status": "Em andamento",
        })

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cliente", resposta.data)
        self.assertFalse(Processo.objects.filter(numero_processo="PROC-A-1").exists())

    def test_movimentacao_nao_entra_em_processo_alheio(self):
        resposta = self.client.post(
            "/api/movimentacoes/", {"processo": self.processo_b.id, "descricao": "Invasão."}
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Movimentacao.objects.filter(processo=self.processo_b).exists())

    def test_agenda_nao_entra_em_processo_alheio(self):
        resposta = self.client.post("/api/agenda/", {
            "processo": self.processo_b.id, "titulo": "Audiência alheia",
            "tipo": "compromisso", "data_evento": timezone.now().isoformat(),
        })

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_apontamento_nao_entra_em_processo_alheio(self):
        resposta = self.client.post("/api/apontamentos/", {
            "processo": self.processo_b.id, "data": timezone.localdate().isoformat(),
            "minutos": 60, "descricao": "Trabalho alheio.",
        })

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_despesa_nao_entra_em_processo_alheio(self):
        resposta = self.client.post("/api/despesas/", {
            "processo": self.processo_b.id, "tipo": "custas", "descricao": "Custa alheia.",
            "valor": "100.00", "data": timezone.localdate().isoformat(),
        })

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_contrato_nao_entra_em_processo_alheio(self):
        resposta = self.client.post("/api/contratos/", {
            "processo": self.processo_b.id, "tipo_honorario": "fixo",
            "valor_total": "1000.00", "forma_pagamento": "avista",
        })

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_a_mensagem_nao_confirma_a_existencia_do_registro_alheio(self):
        # Dizer "sem permissão" revelaria que aquele id existe.
        resposta = self.client.post(
            "/api/movimentacoes/", {"processo": self.processo_b.id, "descricao": "x"}
        )

        self.assertIn("não encontrado", str(resposta.data).lower())

    # ---------- validade da conta ----------

    def test_usuario_desativado_perde_o_acesso_imediatamente(self):
        self.assertEqual(self.client.get("/api/clientes/").status_code, status.HTTP_200_OK)

        self.advogado_a.ativo = False
        self.advogado_a.save()

        self.assertEqual(
            self.client.get("/api/clientes/").status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_escritorio_desativado_derruba_os_usuarios(self):
        self.a.ativo = False
        self.a.save()

        self.assertEqual(
            self.client.get("/api/clientes/").status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_refresh_nao_renova_acesso_de_conta_desativada(self):
        refresh = _gerar_refresh_token(self.advogado_a)
        self.client.credentials()

        resposta = self.client.post("/api/token/refresh/", {"refresh": refresh})
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)

        self.advogado_a.ativo = False
        self.advogado_a.save()

        resposta = self.client.post("/api/token/refresh/", {"refresh": refresh})
        self.assertEqual(resposta.status_code, status.HTTP_401_UNAUTHORIZED)

    # ---------- histórico ----------

    def test_excluir_cliente_com_processo_e_recusado(self):
        self._entrar_como(self.admin_a)
        cliente = Cliente.objects.create(
            escritorio=self.a, nome="Cliente com caso", cpf="11122233344",
            email="comcaso@a.com", telefone="11944443333", endereco="Rua A",
        )
        usuario_adv = _criar_usuario(self.a, email="adv3@a.com", tipo_usuario="advogado")
        advogado = Advogado.objects.create(
            escritorio=self.a, usuario=usuario_adv, oab="444444/SP", especialidade="Cível",
        )
        processo = Processo.objects.create(
            escritorio=self.a, numero_processo="PROC-A-9", titulo="Caso",
            descricao="d", cliente=cliente, advogado=advogado,
        )

        resposta = self.client.delete(f"/api/clientes/{cliente.id}/")

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Processo.objects.filter(id=processo.id).exists())
        self.assertTrue(Cliente.objects.filter(id=cliente.id).exists())

    def test_cliente_sem_processo_continua_excluivel(self):
        self._entrar_como(self.admin_a)
        cliente = Cliente.objects.create(
            escritorio=self.a, nome="Cliente solto", cpf="99988877766",
            email="solto@a.com", telefone="11933332222", endereco="Rua A",
        )

        resposta = self.client.delete(f"/api/clientes/{cliente.id}/")

        self.assertEqual(resposta.status_code, status.HTTP_204_NO_CONTENT)

    # ---------- parâmetros de filtro ----------

    def test_filtro_invalido_responde_400_e_nao_500(self):
        for parametro in ("data_inicio_de=nao-e-data", "data_inicio_ate=32/13/2026",
                          "cliente=abc", "advogado=xyz"):
            with self.subTest(parametro=parametro):
                resposta = self.client.get(f"/api/processos/?{parametro}")
                self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filtro_valido_continua_funcionando(self):
        resposta = self.client.get(
            f"/api/processos/?data_inicio_de=2020-01-01&cliente={self.cliente_b.id}"
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)


class PerfisDeAcessoAPITestCase(_EquipeDoEscritorio, APITestCase):

    def setUp(self):
        self._equipe()
        self.processo = self._processo(self.escritorio, self.cliente, self.advogado, "P-1")
        self.contrato = Contrato.objects.create(
            escritorio=self.escritorio, processo=self.processo, valor_total=Decimal("1000")
        )

    def test_estagiario_cadastra_cliente_mas_nao_exclui(self):
        self._como("estagiario")
        criado = self.client.post(
            "/api/clientes/",
            {"nome": "Novo", "email": "n@n.com", "telefone": "11999999999", "endereco": "Rua"},
            format="json",
        )
        self.assertEqual(criado.status_code, status.HTTP_201_CREATED, criado.data)
        self.assertEqual(
            self.client.delete(f"/api/clientes/{criado.data['id']}/").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_estagiario_e_secretaria_nao_veem_o_financeiro(self):
        for perfil in ("estagiario", "secretaria"):
            self._como(perfil)
            self.assertEqual(self.client.get("/api/contratos/").status_code, status.HTTP_403_FORBIDDEN)
            painel = self.client.get("/api/dashboard/").data
            self.assertNotIn("financeiro", painel)
            self.assertIsNone(painel["financeiro_mensal"])

    def test_financeiro_cuida_dos_contratos_mas_nao_altera_processo(self):
        self._como("financeiro")
        self.assertEqual(self.client.get("/api/contratos/").status_code, status.HTTP_200_OK)
        resposta = self.client.patch(f"/api/processos/{self.processo.id}/", {"titulo": "x"}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_secretaria_agenda_compromisso_mas_nao_usa_a_ia(self):
        self._como("secretaria")
        agendado = self.client.post(
            "/api/agenda/",
            {"titulo": "Reunião", "descricao": "Primeira conversa", "tipo": "compromisso",
             "data_evento": "2030-01-10T10:00:00Z"},
            format="json",
        )
        self.assertEqual(agendado.status_code, status.HTTP_201_CREATED, agendado.data)
        self.assertEqual(
            self.client.post("/api/assistente-ia/", {"mensagem": "oi"}, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_busca_nao_traz_area_que_o_perfil_nao_ve(self):
        self._como("estagiario")
        resultado = self.client.get("/api/busca/", {"q": "P-1"}).data
        self.assertIn("processos", resultado)
        self.assertNotIn("contratos", resultado)

    def test_login_devolve_as_permissoes_do_perfil(self):
        login = self.client.post(
            "/api/login/", {"email": "estagiario@equipe.com", "senha": "senha12345"}, format="json"
        )
        permissoes = login.data["usuario"]["permissoes"]
        self.assertEqual(permissoes["clientes"], ["criar", "editar", "ver"])
        self.assertEqual(permissoes["financeiro"], [])

    def test_admin_cadastra_membro_sem_oab_e_ele_consegue_entrar(self):
        self._como("admin")
        resposta = self.client.post(
            "/api/equipe/registrar/",
            {"nome": "Bia", "email": "bia@equipe.com", "senha": "Senha@Forte123", "tipo_usuario": "secretaria"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        login = self.client.post(
            "/api/login/", {"email": "bia@equipe.com", "senha": "Senha@Forte123"}, format="json"
        )
        self.assertEqual(login.data["usuario"]["tipo_usuario"], "secretaria")

    def test_so_admin_cadastra_membro(self):
        self._como("advogado")
        resposta = self.client.post(
            "/api/equipe/registrar/",
            {"nome": "X", "email": "x@equipe.com", "senha": "Senha@Forte123", "tipo_usuario": "financeiro"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_troca_perfil_para_financeiro(self):
        self._como("admin")
        resposta = self.client.post(
            f"/api/usuarios/{self.membros['estagiario'].id}/definir-perfil/",
            {"tipo_usuario": "financeiro"},
        )
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)
        self.assertEqual(resposta.data["tipo_usuario_display"], "Financeiro")


class ProcessoSigilosoAPITestCase(_EquipeDoEscritorio, APITestCase):

    def setUp(self):
        self._equipe()
        # self.advogado (Advogado do admin) é o responsável pelo sigiloso.
        responsavel = _criar_usuario(self.escritorio, email="resp@equipe.com", tipo_usuario="advogado")
        self.membros["responsavel"] = responsavel
        adv = Advogado.objects.create(escritorio=self.escritorio, usuario=responsavel, oab="9/SP")
        self.sigiloso = self._processo(self.escritorio, self.cliente, adv, "SEGREDO-1", titulo="Guarda")
        self.sigiloso.sigiloso = True
        self.sigiloso.save()
        self.comum = self._processo(self.escritorio, self.cliente, adv, "COMUM-1")
        Agenda.objects.create(
            escritorio=self.escritorio, processo=self.sigiloso, titulo="Audiência sigilosa",
            data_evento=timezone.now() + timedelta(days=1),
        )

    def _numeros(self):
        return [p["numero_processo"] for p in self.client.get("/api/processos/").data["results"]]

    def test_outro_advogado_nao_ve_o_processo_nem_o_que_pende_dele(self):
        self._como("advogado")
        self.assertEqual(self._numeros(), ["COMUM-1"])
        self.assertEqual(
            self.client.get(f"/api/processos/{self.sigiloso.id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )
        agenda = [e["titulo"] for e in self.client.get("/api/agenda/").data["results"]]
        self.assertNotIn("Audiência sigilosa", agenda)
        self.assertEqual(self.client.get("/api/busca/", {"q": "segredo"}).data["processos"], [])
        painel = self.client.get("/api/dashboard/").data
        self.assertNotIn("SEGREDO-1", str(painel["processos_recentes"]))

    def test_responsavel_e_administrador_veem(self):
        for perfil in ("responsavel", "admin"):
            self._como(perfil)
            self.assertIn("SEGREDO-1", self._numeros())

    def test_relatorio_do_cliente_omite_o_sigiloso_para_quem_nao_pode(self):
        self._como("advogado")
        relatorio = self.client.get(f"/api/configuracoes/relatorio/cliente/{self.cliente.id}/").data
        self.assertNotIn("SEGREDO-1", str(relatorio))
        self.assertIn("COMUM-1", str(relatorio))
