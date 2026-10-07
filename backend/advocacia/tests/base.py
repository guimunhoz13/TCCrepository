"""Utilitários compartilhados pelos testes: escritório, usuários, tokens e respostas simuladas."""

from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import (
    Advogado,
    Cliente,
    Escritorio,
    Processo,
    Usuario,
)


def _criar_escritorio(**overrides):
    dados = {
        "nome": "Escritorio Teste & Associados",
        "cnpj": "12345678000199",
        "email": "contato@escritorio.com",
        "telefone": "11999999999",
        "endereco": "Rua Teste, 100",
    }
    dados.update(overrides)
    return Escritorio.objects.create(**dados)


def _criar_usuario(escritorio, **overrides):
    dados = {
        "escritorio": escritorio,
        "nome": "Ana Admin",
        "email": "ana@escritorio.com",
        "senha": make_password("senha12345"),
        "tipo_usuario": "admin",
    }
    dados.update(overrides)
    return Usuario.objects.create(**dados)


def _gerar_token_de_acesso(usuario):
    """Gera um access token JWT com as mesmas claims usadas pelo LoginView."""
    refresh = RefreshToken()
    refresh["user_id"] = usuario.id
    refresh["nome"] = usuario.nome
    refresh["email"] = usuario.email
    refresh["tipo_usuario"] = usuario.tipo_usuario
    refresh["escritorio_id"] = usuario.escritorio_id
    refresh["escritorio_nome"] = usuario.escritorio.nome
    refresh["session_version"] = usuario.session_version
    return str(refresh.access_token)


def _gerar_refresh_token(usuario):
    """Gera o refresh token com as mesmas claims do LoginView."""
    refresh = RefreshToken()
    refresh["user_id"] = usuario.id
    refresh["nome"] = usuario.nome
    refresh["email"] = usuario.email
    refresh["tipo_usuario"] = usuario.tipo_usuario
    refresh["escritorio_id"] = usuario.escritorio_id
    refresh["escritorio_nome"] = usuario.escritorio.nome
    refresh["session_version"] = usuario.session_version
    return str(refresh)


def _gerar_token_master(superadmin):
    """Gera um access token JWT com as mesmas claims usadas pelo MasterLoginView."""
    refresh = RefreshToken()
    refresh["user_id"] = f"master-{superadmin.id}"
    refresh["is_master"] = True
    refresh["superadmin_id"] = superadmin.id
    refresh["nome"] = superadmin.nome
    refresh["email"] = superadmin.email
    return str(refresh.access_token)


def _resposta_datajud(movimentos=None):
    """Resposta do DataJud no formato Elasticsearch, para os testes."""
    return {
        "hits": {
            "hits": [
                {
                    "_source": {
                        "numeroProcesso": "00056789020268260032",
                        "classe": {"codigo": 1116, "nome": "Execução de Título Extrajudicial"},
                        "orgaoJulgador": {"nome": "2ª Vara Cível de Araçatuba"},
                        "tribunal": "TJSP",
                        "grau": "G1",
                        "dataAjuizamento": "2026-03-10T09:00:00.000Z",
                        "dataHoraUltimaAtualizacao": "2026-09-18T14:22:00.000Z",
                        "movimentos": movimentos
                        if movimentos is not None
                        else [
                            {"codigo": 26, "nome": "Distribuição", "dataHora": "2026-03-10T09:00:00.000Z"},
                            {"codigo": 51, "nome": "Conclusão", "dataHora": "2026-04-02T16:30:00.000Z"},
                        ],
                    }
                }
            ]
        }
    }


def _resposta_openai(texto):
    escolha = SimpleNamespace(message=SimpleNamespace(content=texto))
    return SimpleNamespace(choices=[escolha])


class _EscritorioComDados:
    """Monta um escritório com um advogado e um cliente para os testes de
    dashboard e busca."""

    def _montar(self, nome="Escritorio A", cnpj="12345678000199", email="a@a.com", sufixo="a"):
        escritorio = _criar_escritorio(nome=nome, cnpj=cnpj, email=email)
        usuario = _criar_usuario(escritorio, email=f"admin.{sufixo}@teste.com")
        advogado = Advogado.objects.create(
            escritorio=escritorio, usuario=usuario, oab=f"1{sufixo}/SP", especialidade="Civil"
        )
        cliente = Cliente.objects.create(escritorio=escritorio, nome=f"Cliente {sufixo}")
        return escritorio, usuario, advogado, cliente

    def _processo(self, escritorio, cliente, advogado, numero, titulo="Ação de Cobrança"):
        return Processo.objects.create(
            escritorio=escritorio, cliente=cliente, advogado=advogado,
            numero_processo=numero, titulo=titulo,
        )


class _EquipeDoEscritorio(_EscritorioComDados):
    """Escritório com um membro de cada perfil."""

    def _equipe(self):
        # Os e-mails de teste (n@n.com, x@equipe.com) não têm servidor de
        # e-mail de verdade: sem isto, o teste dependeria do DNS da máquina
        # (passava sem rede e falhava no CI, que resolve o domínio).
        self.enterContext(patch("advocacia.validators._dominio_tem_mx", return_value=True))
        self.escritorio, self.admin, self.advogado, self.cliente = self._montar()
        self.membros = {"admin": self.admin}
        for perfil in ("advogado", "estagiario", "financeiro", "secretaria"):
            self.membros[perfil] = _criar_usuario(
                self.escritorio, email=f"{perfil}@equipe.com", nome=perfil.title(), tipo_usuario=perfil
            )

    def _como(self, perfil):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.membros[perfil])}"
        )
