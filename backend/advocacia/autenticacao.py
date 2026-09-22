"""Autenticação que confere, a cada requisição, se a conta ainda vale.

O sistema é stateless: o access token carrega a identidade e ninguém
consulta o banco para validá-lo. Isso deixava um buraco — desativar um
usuário, ou o escritório inteiro, não tirava do ar o token já emitido.
Quem tivesse o token continuava lendo e escrevendo até ele expirar
naturalmente, e o refresh seguia emitindo novos acessos.

A checagem entra aqui, na camada de autenticação, e não em cada view: são
mais de trinta endpoints autenticados, e proteger um a um deixaria o
próximo a ser escrito de fora.
"""

from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


def conta_ativa(token):
    """Devolve o Usuario/SuperAdmin do token, se a conta ainda estiver ativa.

    Levanta AuthenticationFailed quando a conta foi desativada. Devolve
    None quando o token não identifica ninguém — caso em que a view
    decide o que fazer, como já fazia antes.
    """

    from .models import SuperAdmin, Usuario

    if token.get("is_master"):
        superadmin_id = token.get("superadmin_id")
        if not superadmin_id:
            return None
        try:
            return SuperAdmin.objects.get(id=superadmin_id, ativo=True)
        except SuperAdmin.DoesNotExist:
            raise AuthenticationFailed("Conta de administrador do sistema inativa ou inexistente.")

    user_id = token.get("user_id")
    if not user_id:
        return None

    try:
        return (
            Usuario.objects
            .select_related("escritorio")
            .get(id=user_id, ativo=True, escritorio__ativo=True)
        )
    except Usuario.DoesNotExist:
        # Mesma resposta para usuário desativado, escritório desativado e
        # usuário removido: quem perdeu o acesso não precisa saber por quê.
        raise AuthenticationFailed("Conta ou escritório inativo. Faça login novamente.")


class AutenticacaoContaAtiva(JWTStatelessUserAuthentication):
    """JWT stateless, mas recusando token de conta desativada."""

    def authenticate(self, request):
        resultado = super().authenticate(request)

        if resultado is None:
            return None

        usuario_token, token = resultado
        conta = conta_ativa(token)

        # A conta carregada fica na requisição para que
        # get_usuario_from_request a reaproveite: sem isso, a verificação
        # aqui dobraria a consulta ao banco em toda requisição.
        if conta is not None:
            request._conta_autenticada = conta

        return resultado
