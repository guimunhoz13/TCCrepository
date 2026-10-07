"""Processos em segredo de justiça.

Processo marcado como sigiloso só aparece para o administrador do
escritório e para o advogado responsável por ele. Para os demais, ele e
tudo o que pende dele (movimentações, documentos, agenda, contrato,
parcelas, horas, despesas, tarefas) somem de listagens, buscas, relatórios,
dashboard e do contexto da IA — como se não existissem.

Os totais da dashboard continuam contando o processo: revelam que ele
existe, não o que contém, e evitam números que não batem entre colegas.
"""

from .models import Processo


def processos_ocultos(usuario):
    """Sigilosos do escritório que `usuario` não pode ver."""
    if usuario is None:
        return Processo.objects.filter(sigiloso=True)
    sigilosos = Processo.objects.filter(escritorio_id=usuario.escritorio_id, sigiloso=True)
    if usuario.tipo_usuario == "admin":
        return sigilosos.none()
    return sigilosos.exclude(advogado__usuario=usuario)


def esconder_sigilosos(queryset, usuario, campo="processo"):
    """Tira do queryset o que o usuário não pode ver.

    `campo` é o caminho até o processo (ex.: "contrato__processo" para
    parcelas). Registros sem processo (compromisso avulso, tarefa geral)
    continuam aparecendo.
    """
    ocultos = processos_ocultos(usuario).values("pk")
    if queryset.model is Processo:
        return queryset.exclude(pk__in=ocultos)
    return queryset.exclude(**{f"{campo}__in": ocultos})


def caminho_ate_processo(modelo):
    """Caminho do modelo até Processo, ou None se não houver."""
    if modelo is Processo:
        return ""
    if modelo.__name__ == "Parcela":
        return "contrato__processo"
    if any(campo.name == "processo" for campo in modelo._meta.get_fields()):
        return "processo"
    return None
