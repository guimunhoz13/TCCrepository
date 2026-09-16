"""Avisos por e-mail disparados no momento em que algo acontece.

Diferente dos lembretes de agenda (que são agendados pelo comando
`enviar_lembretes`), estes saem durante a própria requisição. Sem uma fila
de tarefas no projeto, o envio é síncrono: por isso toda falha é registrada
no log e engolida, para que um problema de SMTP nunca derrube a operação
que o usuário acabou de fazer.
"""

import logging

from .emails import enviar_email, montar_email_aviso

logger = logging.getLogger(__name__)


def notificar_escritorio(escritorio, preferencia, titulo, resumo, linhas, autor=None):
    """Avisa quem, no escritório, optou por receber este tipo de aviso.

    `preferencia` é o nome do campo booleano em PreferenciasUsuario. O autor
    da ação não recebe o próprio aviso.
    """

    from .models import Usuario

    destinatarios = (
        Usuario.objects.filter(ativo=True, escritorio=escritorio)
        .filter(**{f"preferencias__{preferencia}": True})
        .exclude(email="")
    )

    if autor is not None:
        destinatarios = destinatarios.exclude(pk=autor.pk)

    for usuario in destinatarios:
        assunto, corpo_html, corpo_texto = montar_email_aviso(
            usuario.nome, escritorio.nome, titulo, resumo, linhas
        )
        try:
            enviar_email(usuario.email, assunto, corpo_html, corpo_texto)
        except Exception:
            logger.exception("Falha ao avisar %s sobre '%s'", usuario.email, titulo)
