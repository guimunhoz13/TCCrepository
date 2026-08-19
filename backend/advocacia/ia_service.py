import os

from django.conf import settings

from .models import Cliente, Processo, Movimentacao, Agenda, Documento


def montar_contexto_sistema(usuario, cliente_id=None, processo_id=None):
    """
    Monta o contexto autorizado do escritório para enviar à OpenAI.
    Apenas dados pertencentes ao escritório do usuário autenticado.
    """
    escritorio = usuario.escritorio
    partes = [
        f"Você é um assistente jurídico do escritório {escritorio.nome}.",
        f"Usuário logado: {usuario.nome} ({usuario.tipo_usuario}).",
        "Responda em português do Brasil, de forma clara e profissional.",
        "Baseie-se apenas nas informações fornecidas abaixo.",
        "Se não houver dados suficientes, informe isso ao usuário.",
    ]

    if cliente_id:
        try:
            cliente = Cliente.objects.get(
                id=cliente_id,
                escritorio=escritorio,
            )
            partes.append(
                f"\n--- Cliente selecionado ---\n"
                f"Nome: {cliente.nome}\n"
                f"CPF: {cliente.cpf}\n"
                f"E-mail: {cliente.email}\n"
                f"Telefone: {cliente.telefone}\n"
                f"Endereço: {cliente.endereco}"
            )
        except Cliente.DoesNotExist:
            partes.append("\n(Cliente selecionado não encontrado ou sem acesso.)")

    if processo_id:
        try:
            processo = (
                Processo.objects.select_related("cliente", "advogado__usuario")
                .prefetch_related("movimentacoes", "eventos_agenda", "documentos")
                .get(id=processo_id, escritorio=escritorio)
            )

            movimentacoes = processo.movimentacoes.order_by("-data_movimentacao")[:10]
            eventos = processo.eventos_agenda.order_by("data_evento")[:5]
            docs = processo.documentos.count()

            linhas_mov = "\n".join(
                f"  - {m.data_movimentacao:%d/%m/%Y %H:%M}: {m.descricao}"
                for m in movimentacoes
            ) or "  (nenhuma)"

            linhas_agenda = "\n".join(
                f"  - {e.data_evento:%d/%m/%Y %H:%M} — {e.titulo} ({e.local_evento})"
                for e in eventos
            ) or "  (nenhum)"

            partes.append(
                f"\n--- Processo selecionado ---\n"
                f"Número: {processo.numero_processo}\n"
                f"Título: {processo.titulo}\n"
                f"Status: {processo.status}\n"
                f"Descrição: {processo.descricao}\n"
                f"Cliente: {processo.cliente.nome}\n"
                f"Advogado responsável: {processo.advogado.usuario.nome}\n"
                f"Data início: {processo.data_inicio or 'não informada'}\n"
                f"Documentos anexados: {docs}\n"
                f"Movimentações recentes:\n{linhas_mov}\n"
                f"Próximos eventos na agenda:\n{linhas_agenda}"
            )
        except Processo.DoesNotExist:
            partes.append("\n(Processo selecionado não encontrado ou sem acesso.)")

    if not cliente_id and not processo_id:
        total_clientes = Cliente.objects.filter(escritorio=escritorio).count()
        total_processos = Processo.objects.filter(escritorio=escritorio).count()
        partes.append(
            f"\nResumo do escritório: {total_clientes} clientes, "
            f"{total_processos} processos cadastrados."
        )

    return "\n".join(partes)


def _normalizar_historico(historico):
    """Valida e limita o histórico enviado pelo frontend."""
    if not historico:
        return []

    mensagens = []
    for item in historico[-20:]:
        role = item.get("role")
        content = (item.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            mensagens.append({"role": role, "content": content})

    return mensagens


def gerar_resposta_ia(mensagem, historico=None, contexto_sistema=""):
    """
    Envia a mensagem e o histórico para a OpenAI e retorna a resposta.
    A chave da API fica exclusivamente no backend.
    """
    api_key = getattr(settings, "OPENAI_API_KEY", "") or os.environ.get("OPENAI_API_KEY", "")

    if not api_key:
        raise ValueError(
            "Serviço de IA não configurado. Defina OPENAI_API_KEY no servidor."
        )

    from openai import OpenAI

    client = OpenAI(api_key=api_key)
    model = getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")

    mensagens = [
        {"role": "system", "content": contexto_sistema},
        *_normalizar_historico(historico),
        {"role": "user", "content": mensagem.strip()},
    ]

    response = client.chat.completions.create(
        model=model,
        messages=mensagens,
        temperature=0.4,
        max_tokens=1500,
    )

    return response.choices[0].message.content.strip()
