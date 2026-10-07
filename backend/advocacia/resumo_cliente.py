"""Resumo do andamento do processo para mandar ao cliente (WhatsApp).

O cliente quer saber "como está meu processo?" e não entende "Conclusos
para despacho". Aqui o andamento recente vira uma mensagem curta, em
linguagem simples, que o advogado revisa antes de enviar.

Com a IA configurada (OPENAI_API_KEY), o texto é redigido por ela. Sem a
IA, ou se ela falhar, um modelo automático traduz os andamentos mais
comuns — o botão nunca deixa o advogado sem resposta.

Só vai para a IA o mínimo: primeiro nome do cliente, título, situação,
andamentos e próximos compromissos. Nada de CPF, endereço ou contato.
"""

import logging

from django.utils import timezone

from .ia_service import gerar_resposta_ia

logger = logging.getLogger(__name__)

QUANTIDADE_ANDAMENTOS = 5

# Do termo do tribunal para o que o cliente entende. A ordem importa: o
# primeiro trecho encontrado vence ("sentença" antes de "publicação").
TRADUCOES = (
    ("trânsito em julgado", "a decisão ficou definitiva (não cabe mais recurso)"),
    ("transito em julgado", "a decisão ficou definitiva (não cabe mais recurso)"),
    ("sentença", "o juiz deu a sentença do processo"),
    ("acórdão", "o tribunal julgou o recurso"),
    ("acordao", "o tribunal julgou o recurso"),
    ("audiência", "houve movimentação sobre audiência"),
    ("audiencia", "houve movimentação sobre audiência"),
    ("conclus", "o processo foi para o juiz analisar"),
    ("decisão", "o juiz tomou uma decisão no processo"),
    ("decisao", "o juiz tomou uma decisão no processo"),
    ("despacho", "o juiz deu uma orientação para o andamento do processo"),
    ("juntada", "um documento foi incluído no processo"),
    ("petição", "um documento foi incluído no processo"),
    ("peticao", "um documento foi incluído no processo"),
    ("citação", "a outra parte foi chamada para responder"),
    ("citacao", "a outra parte foi chamada para responder"),
    ("intimação", "as partes foram comunicadas de um ato do processo"),
    ("intimacao", "as partes foram comunicadas de um ato do processo"),
    ("publicação", "saiu uma publicação oficial sobre o processo"),
    ("publicacao", "saiu uma publicação oficial sobre o processo"),
    ("perícia", "houve movimentação sobre a perícia"),
    ("pericia", "houve movimentação sobre a perícia"),
    ("recurso", "houve movimentação sobre recurso"),
    ("distribu", "o processo foi registrado no tribunal"),
    ("remessa", "o processo foi enviado a outro setor do tribunal"),
    ("remetidos", "o processo foi enviado a outro setor do tribunal"),
    ("arquiv", "o processo foi arquivado"),
)


def traduzir_andamento(descricao):
    texto = (descricao or "").lower()
    for termo, traducao in TRADUCOES:
        if termo in texto:
            return traducao
    return None


def _primeiro_nome(nome):
    return (nome or "").strip().split(" ")[0] or "tudo bem"


def _dados(processo):
    andamentos = list(processo.movimentacoes.order_by("-data_movimentacao")[:QUANTIDADE_ANDAMENTOS])
    proximos = list(
        processo.eventos_agenda.filter(data_evento__gte=timezone.now(), cumprido=False)
        .order_by("data_evento")[:3]
    )
    return andamentos, proximos


def resumo_por_modelo(processo, andamentos, proximos, assinatura):
    linhas = [
        f"Olá, {_primeiro_nome(processo.cliente.nome)}! Passando para atualizar você sobre o "
        f"processo {processo.numero_processo} ({processo.titulo}).",
        "",
    ]
    if andamentos:
        linhas.append("Últimas novidades:")
        vistas = set()
        for andamento in andamentos:
            traducao = traduzir_andamento(andamento.descricao)
            frase = traducao or andamento.descricao.strip().rstrip(".")
            if frase in vistas:
                continue
            vistas.add(frase)
            data = timezone.localtime(andamento.data_movimentacao).strftime("%d/%m")
            linhas.append(f"• {data}: {frase[0].upper()}{frase[1:]}.")
    else:
        linhas.append("Não houve novidades no processo desde a última atualização.")

    if proximos:
        linhas += ["", "Próximos passos:"]
        for evento in proximos:
            quando = timezone.localtime(evento.data_evento).strftime("%d/%m às %Hh%M")
            linhas.append(f"• {quando}: {evento.titulo}.")

    linhas += [
        "",
        "Qualquer dúvida, estou à disposição.",
        assinatura,
    ]
    return "\n".join(linhas).strip()


def _pedido_para_ia(processo, andamentos, proximos, assinatura):
    descricao_andamentos = "\n".join(
        f"- {timezone.localtime(a.data_movimentacao):%d/%m/%Y}: {a.descricao}" for a in andamentos
    ) or "- (nenhum andamento recente)"
    descricao_proximos = "\n".join(
        f"- {timezone.localtime(e.data_evento):%d/%m/%Y %H:%M}: {e.titulo}" for e in proximos
    ) or "- (nenhum compromisso marcado)"
    contexto = (
        "Você ajuda um escritório de advocacia a escrever mensagens de WhatsApp para clientes. "
        "Escreva em português do Brasil, em linguagem simples, sem termos jurídicos sem explicação, "
        "em tom cordial e profissional. Use só as informações dadas: não invente fatos, datas ou "
        "prazos e não prometa resultado. No máximo 900 caracteres. Pode usar marcadores (•). "
        "Termine se colocando à disposição e assine exatamente como indicado."
    )
    pedido = (
        f"Cliente: {_primeiro_nome(processo.cliente.nome)}\n"
        f"Processo: {processo.numero_processo} — {processo.titulo}\n"
        f"Situação: {processo.get_status_display()}\n"
        f"Andamentos recentes (do tribunal ou do escritório):\n{descricao_andamentos}\n"
        f"Próximos compromissos:\n{descricao_proximos}\n"
        f"Assinatura: {assinatura}\n\n"
        "Escreva a mensagem de atualização para o cliente."
    )
    return contexto, pedido


def gerar_resumo_para_cliente(processo, usuario, usar_ia=True):
    """Devolve {"texto", "fonte", "andamentos"}; fonte é "ia" ou "modelo"."""
    andamentos, proximos = _dados(processo)
    assinatura = f"{usuario.nome} — {processo.escritorio.nome}"

    if usar_ia:
        contexto, pedido = _pedido_para_ia(processo, andamentos, proximos, assinatura)
        try:
            texto = gerar_resposta_ia(pedido, contexto_sistema=contexto)
            return {"texto": texto, "fonte": "ia", "andamentos": len(andamentos)}
        except ValueError:
            pass  # IA não configurada: segue com o modelo, sem alarde.
        except Exception:
            logger.exception("IA falhou ao resumir o processo %s; usando o modelo", processo.pk)

    return {
        "texto": resumo_por_modelo(processo, andamentos, proximos, assinatura),
        "fonte": "modelo",
        "andamentos": len(andamentos),
    }
