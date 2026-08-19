import os

from django.conf import settings

from .models import Cliente, Processo


def montar_contexto_sistema(usuario, cliente_id=None, processo_id=None):
    """
    Monta o contexto autorizado do escritório para enviar à IA.

    Apenas dados pertencentes ao escritório do usuário autenticado
    são incluídos no contexto.
    """
    escritorio = usuario.escritorio

    partes = [
        f"Você é um assistente jurídico do escritório {escritorio.nome}.",
        f"Usuário logado: {usuario.nome} ({usuario.tipo_usuario}).",
        "Responda sempre em português do Brasil, de forma clara e profissional.",
        "Baseie-se exclusivamente nas informações fornecidas no contexto.",
        "Não invente informações, dados, clientes, processos ou acontecimentos.",
        "Se não houver informações suficientes para responder, informe isso claramente ao usuário.",
    ]

    # ============================================================
    # CLIENTE SELECIONADO
    # ============================================================
    if cliente_id:
        try:
            cliente = Cliente.objects.get(
                id=cliente_id,
                escritorio=escritorio,
            )

            partes.append(
                "\n--- Cliente selecionado ---\n"
                f"Nome: {cliente.nome}\n"
                f"CPF: {cliente.cpf or 'não informado'}\n"
                f"E-mail: {cliente.email or 'não informado'}\n"
                f"Telefone: {cliente.telefone or 'não informado'}\n"
                f"Endereço: {cliente.endereco or 'não informado'}"
            )

        except Cliente.DoesNotExist:
            partes.append(
                "\n(Cliente selecionado não encontrado ou o usuário não possui acesso.)"
            )

    # ============================================================
    # PROCESSO SELECIONADO
    # ============================================================
    if processo_id:
        try:
            processo = (
                Processo.objects
                .select_related("cliente", "advogado__usuario")
                .prefetch_related(
                    "movimentacoes",
                    "eventos_agenda",
                    "documentos",
                )
                .get(
                    id=processo_id,
                    escritorio=escritorio,
                )
            )

            movimentacoes = (
                processo.movimentacoes
                .order_by("-data_movimentacao")[:10]
            )

            eventos = (
                processo.eventos_agenda
                .order_by("data_evento")[:5]
            )

            total_documentos = processo.documentos.count()

            linhas_movimentacoes = "\n".join(
                (
                    f"  - {movimentacao.data_movimentacao:%d/%m/%Y %H:%M}: "
                    f"{movimentacao.descricao}"
                )
                for movimentacao in movimentacoes
            )

            if not linhas_movimentacoes:
                linhas_movimentacoes = "  (nenhuma movimentação encontrada)"

            linhas_agenda = "\n".join(
                (
                    f"  - {evento.data_evento:%d/%m/%Y %H:%M} — "
                    f"{evento.titulo} "
                    f"({evento.local_evento or 'local não informado'})"
                )
                for evento in eventos
            )

            if not linhas_agenda:
                linhas_agenda = "  (nenhum evento encontrado)"

            partes.append(
                "\n--- Processo selecionado ---\n"
                f"Número: {processo.numero_processo}\n"
                f"Título: {processo.titulo}\n"
                f"Status: {processo.status}\n"
                f"Descrição: {processo.descricao or 'não informada'}\n"
                f"Cliente: {processo.cliente.nome}\n"
                f"Advogado responsável: {processo.advogado.usuario.nome}\n"
                f"Data de início: {processo.data_inicio or 'não informada'}\n"
                f"Documentos anexados: {total_documentos}\n"
                f"Movimentações recentes:\n{linhas_movimentacoes}\n"
                f"Próximos eventos na agenda:\n{linhas_agenda}"
            )

        except Processo.DoesNotExist:
            partes.append(
                "\n(Processo selecionado não encontrado ou o usuário não possui acesso.)"
            )

    # ============================================================
    # CONTEXTO GERAL DO ESCRITÓRIO
    # ============================================================
    if not cliente_id and not processo_id:
        total_clientes = Cliente.objects.filter(
            escritorio=escritorio
        ).count()

        total_processos = Processo.objects.filter(
            escritorio=escritorio
        ).count()

        partes.append(
            "\n--- Resumo do escritório ---\n"
            f"Clientes cadastrados: {total_clientes}\n"
            f"Processos cadastrados: {total_processos}"
        )

    return "\n".join(partes)


def _normalizar_historico(historico):
    """
    Valida e limita o histórico enviado pelo frontend.
    Mantém no máximo as últimas 20 mensagens.
    """
    if not historico or not isinstance(historico, list):
        return []

    mensagens = []

    for item in historico[-20:]:
        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = str(item.get("content") or "").strip()

        if role in ("user", "assistant") and content:
            mensagens.append({
                "role": role,
                "content": content,
            })

    return mensagens


def gerar_resposta_ia(mensagem, historico=None, contexto_sistema=""):
    """
    Envia a mensagem e o histórico para a OpenAI.

    A OPENAI_API_KEY permanece exclusivamente no backend e nunca deve
    ser enviada ao frontend.
    """

    # Primeiro tenta obter a chave definida no settings.py.
    # Caso não exista, tenta obter diretamente das variáveis do sistema.
    api_key = (
        getattr(settings, "OPENAI_API_KEY", None)
        or os.environ.get("OPENAI_API_KEY")
        or ""
    ).strip()

    if not api_key:
        raise ValueError(
            "Serviço de IA não configurado. "
            "Defina OPENAI_API_KEY no servidor."
        )

    mensagem = (mensagem or "").strip()

    if not mensagem:
        raise ValueError("A mensagem não pode estar vazia.")

    from openai import OpenAI

    client = OpenAI(api_key=api_key)

    model = getattr(
        settings,
        "OPENAI_MODEL",
        "gpt-4o-mini",
    )

    mensagens = []

    # Só adiciona o contexto do sistema se existir.
    if contexto_sistema:
        mensagens.append({
            "role": "system",
            "content": contexto_sistema,
        })

    # Adiciona histórico validado.
    mensagens.extend(
        _normalizar_historico(historico)
    )

    # Adiciona a nova mensagem do usuário.
    mensagens.append({
        "role": "user",
        "content": mensagem,
    })

    try:
        response = client.chat.completions.create(
            model=model,
            messages=mensagens,
            temperature=0.4,
            max_tokens=1500,
        )

    except Exception as error:
        raise RuntimeError(
            f"Erro ao comunicar com o serviço de IA: {str(error)}"
        ) from error

    resposta = response.choices[0].message.content

    if not resposta:
        return "Não foi possível gerar uma resposta no momento."

    return resposta.strip()