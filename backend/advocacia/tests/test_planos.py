"""Planos: o Gratuito para qualquer um, os pagos com mais vantagens."""

from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import Escritorio, Processo, Usuario
from ..planos import PLANOS, plano_efetivo
from .base import (
    _criar_escritorio,
    _criar_usuario,
    _EquipeDoEscritorio,
    _gerar_token_de_acesso,
    _resposta_datajud,
)


class PlanosAPITestCase(_EquipeDoEscritorio, APITestCase):

    def setUp(self):
        # _equipe() cria admin + advogado, estagiário, financeiro e secretária
        # (5 usuários); para os limites, o escritório começa no Gratuito com 3.
        self._equipe()
        self.escritorio.plano = "gratuito"
        self.escritorio.save()
        for perfil in ("financeiro", "secretaria"):
            self.membros[perfil].ativo = False
            self.membros[perfil].save()

    def _processos_ativos(self, quantidade):
        for numero in range(quantidade):
            self._processo(self.escritorio, self.cliente, self.advogado, f"PROC-{numero}")

    # --- catálogo e situação ---

    def test_catalogo_e_publico_e_o_primeiro_plano_e_gratuito(self):
        self.client.credentials()
        resposta = self.client.get("/api/planos/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        planos = resposta.data["planos"]
        self.assertEqual([p["id"] for p in planos], ["gratuito", "basico", "profissional"])
        self.assertEqual(planos[0]["preco_mensal"], 0)
        self.assertTrue(all(p["preco_mensal"] > 0 for p in planos[1:]))

    def test_catalogo_funciona_mesmo_com_token_vencido_no_navegador(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer token-invalido")
        self.assertEqual(self.client.get("/api/planos/").status_code, status.HTTP_200_OK)

    def test_escritorio_novo_comeca_no_gratuito_sem_pagar(self):
        resposta = self.client.post(
            "/api/escritorios/registrar/",
            {
                "nome_escritorio": "Novo Escritório", "cnpj": "11.444.777/0001-61",
                "email_escritorio": "contato@novo.com", "telefone_escritorio": "(11) 3333-4444",
                "endereco_escritorio": "Rua Nova, 1", "nome_admin": "Nova Admin",
                "email_admin": "admin@novo.com", "senha_admin": "Senha@Forte123",
            },
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)
        self.assertEqual(Escritorio.objects.get(email="contato@novo.com").plano, "gratuito")

    def test_situacao_mostra_plano_uso_e_limites(self):
        self._processos_ativos(2)
        self._como("admin")
        resposta = self.client.get("/api/plano/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["plano"], "gratuito")
        self.assertEqual(resposta.data["uso"], {"usuarios": 3, "processos_ativos": 2})
        self.assertEqual(resposta.data["limites"], PLANOS["gratuito"]["limites"])
        self.assertEqual(resposta.data["recursos"], [])

    def test_plano_pago_vencido_vale_como_gratuito(self):
        self.escritorio.plano = "profissional"
        self.escritorio.plano_validade = timezone.localdate() - timedelta(days=1)
        self.escritorio.save()
        self.assertEqual(plano_efetivo(self.escritorio), "gratuito")
        self._como("admin")
        resposta = self.client.get("/api/plano/")
        self.assertTrue(resposta.data["vencido"])
        self.assertEqual(resposta.data["plano_contratado"], "profissional")

    def test_plano_pago_dentro_da_validade_vale(self):
        self.escritorio.plano = "basico"
        self.escritorio.plano_validade = timezone.localdate()
        self.escritorio.save()
        self.assertEqual(plano_efetivo(self.escritorio), "basico")

    # --- limite de usuários ---

    def test_gratuito_recusa_o_quarto_usuario_sem_apagar_ninguem(self):
        self._como("admin")
        resposta = self.client.post(
            "/api/equipe/registrar/",
            {"nome": "Bia", "email": "bia@equipe.com", "senha": "Senha@Forte123", "tipo_usuario": "secretaria"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resposta.data["detail"].code, "limite_do_plano")
        self.assertIn("até 3 usuários", str(resposta.data["detail"]))
        self.assertFalse(Usuario.objects.filter(email="bia@equipe.com").exists())
        self.assertEqual(Usuario.objects.filter(escritorio=self.escritorio).count(), 5)

    def test_gratuito_recusa_novo_advogado_acima_do_limite(self):
        self._como("admin")
        resposta = self.client.post(
            "/api/advogados/registrar/",
            {"nome": "Dr. Novo", "email": "novo@equipe.com", "senha": "Senha@Forte123",
             "oab": "999999/SP", "especialidade": "Cível"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN, resposta.data)

    def test_reativar_usuario_respeita_o_limite_mas_desativar_sempre_pode(self):
        self._como("admin")
        url = f"/api/usuarios/{self.membros['financeiro'].id}/alternar-ativo/"
        self.assertEqual(self.client.post(url).status_code, status.HTTP_403_FORBIDDEN)

        desativar = self.client.post(f"/api/usuarios/{self.membros['estagiario'].id}/alternar-ativo/")
        self.assertEqual(desativar.status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.post(url).status_code, status.HTTP_200_OK)

    def test_plano_pago_libera_mais_usuarios(self):
        self.escritorio.plano = "basico"
        self.escritorio.save()
        self._como("admin")
        resposta = self.client.post(
            "/api/equipe/registrar/",
            {"nome": "Bia", "email": "bia@equipe.com", "senha": "Senha@Forte123", "tipo_usuario": "secretaria"},
            format="json",
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)

    # --- limite de processos ---

    def _novo_processo(self, numero, **extra):
        return self.client.post(
            "/api/processos/",
            {"numero_processo": numero, "titulo": "Novo", "descricao": "x",
             "cliente": self.cliente.id, "advogado": self.advogado.id, **extra},
            format="json",
        )

    def test_gratuito_recusa_processo_acima_de_30_ativos(self):
        self._processos_ativos(30)
        self._como("admin")
        resposta = self._novo_processo("PROC-NOVO")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN, resposta.data)
        self.assertIn("até 30 processos ativos", str(resposta.data["detail"]))

    def test_processo_arquivado_nao_conta_no_limite(self):
        self._processos_ativos(30)
        Processo.objects.filter(numero_processo="PROC-0").update(status="Arquivado")
        self._como("admin")
        self.assertEqual(self._novo_processo("PROC-NOVO").status_code, status.HTTP_201_CREATED)

    def test_cadastrar_processo_ja_arquivado_nao_esbarra_no_limite(self):
        self._processos_ativos(30)
        self._como("admin")
        resposta = self._novo_processo("PROC-ANTIGO", status="Arquivado")
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED, resposta.data)

    def test_desarquivar_acima_do_limite_e_recusado(self):
        self._processos_ativos(30)
        arquivado = self._processo(self.escritorio, self.cliente, self.advogado, "PROC-ARQ")
        arquivado.status = "Arquivado"
        arquivado.save()
        self._como("admin")
        resposta = self.client.patch(f"/api/processos/{arquivado.id}/", {"status": "Em andamento"}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)
        arquivado.refresh_from_db()
        self.assertEqual(arquivado.status, "Arquivado")

    def test_profissional_nao_tem_limite_de_processos(self):
        self.escritorio.plano = "profissional"
        self.escritorio.save()
        self._processos_ativos(301)
        self._como("admin")
        self.assertEqual(self._novo_processo("PROC-NOVO").status_code, status.HTTP_201_CREATED)

    # --- recursos dos planos pagos ---

    @override_settings(OPENAI_API_KEY="chave-de-teste")
    @patch("openai.OpenAI")
    def test_ia_fica_no_profissional_e_nao_chama_a_openai_no_gratuito(self, openai):
        self._como("admin")
        resposta = self.client.post("/api/assistente-ia/", {"mensagem": "Oi"}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Profissional", str(resposta.data["detail"]))
        openai.assert_not_called()

    @override_settings(OPENAI_API_KEY="chave-de-teste")
    @patch("openai.OpenAI")
    def test_resumo_ao_cliente_no_gratuito_usa_o_modelo_sem_ia(self, openai):
        processo = self._processo(self.escritorio, self.cliente, self.advogado, "PROC-R")
        self._como("advogado")
        resposta = self.client.post(f"/api/processos/{processo.id}/resumo-cliente/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["fonte"], "modelo")
        openai.assert_not_called()

    @patch("advocacia.djen._chamar_api")
    def test_intimacoes_do_djen_ficam_nos_planos_pagos(self, api):
        self._como("advogado")
        resposta = self.client.post("/api/intimacoes/buscar/")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)
        api.assert_not_called()

        self.escritorio.plano = "basico"
        self.escritorio.save()
        api.return_value = {"items": []}
        self.assertEqual(self.client.post("/api/intimacoes/buscar/").status_code, status.HTTP_200_OK)

    @patch("advocacia.djen._chamar_api", return_value={"items": []})
    def test_rotina_do_djen_pula_escritorio_gratuito(self, api):
        self.advogado.oab = "123456/SP"
        self.advogado.save()
        saida = StringIO()
        call_command("buscar_intimacoes", stdout=saida)
        api.assert_not_called()

        self.escritorio.plano = "basico"
        self.escritorio.save()
        call_command("buscar_intimacoes", stdout=saida)
        api.assert_called()

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_sincronizacao_automatica_do_datajud_pula_escritorio_gratuito(self):
        self._processo(self.escritorio, self.cliente, self.advogado, "0001234-56.2026.8.26.0100")
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()) as api:
            call_command("sincronizar_datajud", stdout=StringIO())
            api.assert_not_called()

            self.escritorio.plano = "basico"
            self.escritorio.save()
            call_command("sincronizar_datajud", stdout=StringIO())
            api.assert_called()

    @override_settings(DATAJUD_API_KEY="chave-de-teste")
    def test_consulta_manual_ao_datajud_continua_no_gratuito(self):
        processo = self._processo(self.escritorio, self.cliente, self.advogado, "0001234-56.2026.8.26.0100")
        self._como("admin")
        with patch("advocacia.datajud._chamar_api", return_value=_resposta_datajud()):
            resposta = self.client.post(f"/api/processos/{processo.id}/consultar-datajud/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK, resposta.data)

    def test_usuario_de_outro_escritorio_ve_so_o_proprio_plano(self):
        outro = _criar_escritorio(nome="Outro", cnpj="99888777000166", email="o@o.com", plano="basico")
        usuario = _criar_usuario(outro, email="dono@outro.com")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(usuario)}")
        resposta = self.client.get("/api/plano/")
        self.assertEqual(resposta.data["plano"], "basico")
        self.assertEqual(resposta.data["uso"]["usuarios"], 1)
