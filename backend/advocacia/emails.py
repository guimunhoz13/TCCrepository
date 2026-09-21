from datetime import datetime

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone


def enviar_email(destinatario, assunto, corpo_html, corpo_texto=None):
    """Envia um e-mail HTML (com alternativa em texto puro) usando o backend
    configurado em EMAIL_BACKEND. Em desenvolvimento sem credenciais SMTP,
    o backend padrão apenas imprime o e-mail no console."""

    mensagem = EmailMultiAlternatives(
        subject=assunto,
        body=corpo_texto or "Este e-mail requer um cliente compatível com HTML.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[destinatario],
    )
    mensagem.attach_alternative(corpo_html, "text/html")
    mensagem.send(fail_silently=False)


def _status_label(status):
    return "Concluído" if status == "Concluido" else status


def _formatar_data(valor, com_hora=False):
    if not valor:
        return "—"
    # Datas/horas são gravadas em UTC; quem lê o e-mail espera o fuso local.
    if isinstance(valor, datetime) and timezone.is_aware(valor):
        valor = timezone.localtime(valor)
    return valor.strftime("%d/%m/%Y %H:%M" if com_hora else "%d/%m/%Y")


def _casca_html(escritorio_nome, titulo, subtitulo, corpo_html):
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f2ea; padding: 32px 16px;">
      <div style="max-width: 640px; margin: 0 auto; background: #fffefb; border: 1px solid #e5decf; border-radius: 14px; overflow: hidden;">
        <div style="background: #1c2333; color: #f2eee2; padding: 22px 28px;">
          <div style="font-size: 0.78rem; letter-spacing: 0.04em; text-transform: uppercase; color: #c99a4b; margin-bottom: 4px;">{escritorio_nome}</div>
          <div style="font-size: 1.25rem; font-weight: 600;">{titulo}</div>
        </div>
        <div style="padding: 26px 28px;">
          <p style="color: #4b5468; font-size: 0.92rem; margin-top: 0;">{subtitulo}</p>
          {corpo_html}
          <p style="color: #80869a; font-size: 0.76rem; margin-top: 28px; border-top: 1px solid #e5decf; padding-top: 14px;">
            Este e-mail foi enviado automaticamente pelo sistema {escritorio_nome} — LexOffice.
          </p>
        </div>
      </div>
    </div>
    """


def _tabela_html(colunas, linhas, vazio):
    if not linhas:
        return f'<p style="color:#80869a; font-size:0.86rem;">{vazio}</p>'

    cabecalho = "".join(
        f'<th style="text-align:left; padding:8px 10px; font-size:0.72rem; text-transform:uppercase; color:#80869a; border-bottom:2px solid #1c233355;">{c}</th>'
        for c in colunas
    )
    corpo = ""
    for linha in linhas:
        celulas = "".join(
            f'<td style="padding:8px 10px; font-size:0.86rem; border-bottom:1px solid #e5decf;">{valor}</td>'
            for valor in linha
        )
        corpo += f"<tr>{celulas}</tr>"

    return f'<table style="width:100%; border-collapse:collapse; margin: 10px 0 20px;"><thead><tr>{cabecalho}</tr></thead><tbody>{corpo}</tbody></table>'


def montar_email_verificacao(nome, link, escritorio_nome):
    corpo_html = f"""
      <p style="font-size:0.9rem; color:#1c2333; line-height:1.7;">
        Olá, {nome}. Falta só um passo para começar a usar o {escritorio_nome} no LexOffice:
        confirme seu e-mail clicando no botão abaixo. O link expira em 24 horas.
      </p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="{link}" style="background:#c99a4b; color:#1c2333; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:0.9rem;">
          Confirmar meu e-mail
        </a>
      </p>
      <p style="font-size:0.78rem; color:#80869a;">
        Se você não fez esse cadastro, ignore este e-mail.
      </p>
    """
    assunto = f"Confirme seu e-mail — {escritorio_nome}"
    corpo_texto = f"Acesse {link} para confirmar seu e-mail e liberar o acesso ao sistema. O link expira em 24 horas."
    return assunto, _casca_html(escritorio_nome, "Confirme seu e-mail", "Falta pouco para começar.", corpo_html), corpo_texto


def montar_email_redefinicao_senha(nome, link, escritorio_nome):
    corpo_html = f"""
      <p style="font-size:0.9rem; color:#1c2333; line-height:1.7;">
        Olá, {nome}. Recebemos uma solicitação para redefinir sua senha.
        Clique no botão abaixo para escolher uma nova senha. Este link expira em 1 hora.
      </p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="{link}" style="background:#c99a4b; color:#1c2333; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:0.9rem;">
          Redefinir minha senha
        </a>
      </p>
      <p style="font-size:0.78rem; color:#80869a;">
        Se você não solicitou essa alteração, ignore este e-mail — sua senha permanecerá a mesma.
      </p>
    """
    assunto = f"Redefinição de senha — {escritorio_nome}"
    corpo_texto = f"Acesse {link} para redefinir sua senha. O link expira em 1 hora."
    return assunto, _casca_html(escritorio_nome, "Redefinição de senha", "Solicitação de nova senha.", corpo_html), corpo_texto


def montar_email_relatorio_cliente(dados):
    cliente = dados["cliente"]
    processos = dados.get("processos", [])
    documentos = dados.get("documentos", [])
    agenda = dados.get("agenda", [])
    escritorio_nome = dados["escritorio"]["nome"]

    corpo_html = f"""
      <h3 style="font-size:0.98rem; margin-bottom:8px;">Dados do cliente</h3>
      <p style="font-size:0.88rem; color:#1c2333; line-height:1.7; margin-top:0;">
        <strong>{cliente['nome']}</strong><br/>
        CPF: {cliente.get('cpf') or '—'} · E-mail: {cliente.get('email') or '—'}<br/>
        Telefone: {cliente.get('telefone') or '—'}
      </p>

      <h3 style="font-size:0.98rem; margin-bottom:4px;">Processos ({len(processos)})</h3>
      {_tabela_html(
          ["Número", "Título", "Status"],
          [[p['numero_processo'], p['titulo'], _status_label(p['status'])] for p in processos],
          "Nenhum processo vinculado a este cliente.",
      )}

      <h3 style="font-size:0.98rem; margin-bottom:4px;">Documentos ({len(documentos)})</h3>
      {_tabela_html(
          ["Arquivo", "Processo"],
          [[d['nome_arquivo'], d['numero_processo']] for d in documentos],
          "Nenhum documento anexado.",
      )}
    """

    assunto = f"Relatório do cliente {cliente['nome']} — {escritorio_nome}"
    corpo_texto = (
        f"Relatório do cliente {cliente['nome']}\n"
        f"{len(processos)} processo(s), {len(documentos)} documento(s), {len(agenda)} evento(s) de agenda.\n"
        f"Consulte o sistema {escritorio_nome} para o relatório completo."
    )

    return assunto, _casca_html(escritorio_nome, f"Relatório do cliente {cliente['nome']}", "Resumo de processos e documentos vinculados.", corpo_html), corpo_texto


def montar_email_relatorio_processo(dados):
    processo = dados["processo"]
    cliente = dados["cliente"]
    documentos = dados.get("documentos", [])
    movimentacoes = dados.get("movimentacoes", [])
    escritorio_nome = dados["escritorio"]["nome"]

    corpo_html = f"""
      <h3 style="font-size:0.98rem; margin-bottom:8px;">Dados do processo</h3>
      <p style="font-size:0.88rem; color:#1c2333; line-height:1.7; margin-top:0;">
        <strong>{processo['numero_processo']}</strong> — {processo['titulo']}<br/>
        Cliente: {cliente['nome']} · Status: {_status_label(processo['status'])}<br/>
        Advogado responsável: {processo.get('advogado_nome') or '—'}
      </p>

      <h3 style="font-size:0.98rem; margin-bottom:4px;">Movimentações ({len(movimentacoes)})</h3>
      {_tabela_html(
          ["Descrição"],
          [[m['descricao']] for m in movimentacoes],
          "Nenhuma movimentação registrada.",
      )}

      <h3 style="font-size:0.98rem; margin-bottom:4px;">Documentos ({len(documentos)})</h3>
      {_tabela_html(
          ["Arquivo"],
          [[d['nome_arquivo']] for d in documentos],
          "Nenhum documento anexado a este processo.",
      )}
    """

    assunto = f"Relatório do processo {processo['numero_processo']} — {escritorio_nome}"
    corpo_texto = (
        f"Relatório do processo {processo['numero_processo']} ({processo['titulo']})\n"
        f"Cliente: {cliente['nome']} · Status: {_status_label(processo['status'])}\n"
        f"Consulte o sistema {escritorio_nome} para o relatório completo."
    )

    return assunto, _casca_html(escritorio_nome, f"Relatório do processo {processo['numero_processo']}", processo["titulo"], corpo_html), corpo_texto


def _rotulo_antecedencia(dias):
    if dias < 0:
        return "em atraso"
    if dias == 0:
        return "hoje"
    if dias == 1:
        return "amanhã"
    return f"em {dias} dias"


def montar_email_lembrete_evento(nome, evento, escritorio_nome, dias_restantes):
    """Aviso de um compromisso ou prazo que está se aproximando."""

    eh_prazo = evento.tipo == "prazo"
    rotulo = "Prazo" if eh_prazo else "Compromisso"
    quando = _rotulo_antecedencia(dias_restantes)

    linhas = [
        ("Quando", _formatar_data(evento.data_evento, com_hora=True)),
        ("Tipo", evento.get_tipo_display()),
    ]
    if evento.processo_id:
        linhas.append(("Processo", evento.processo.numero_processo))
    if evento.local_evento:
        linhas.append(("Local", evento.local_evento))
    if eh_prazo and evento.prioridade == "fatal":
        linhas.append(("Prioridade", "PRAZO FATAL"))

    detalhes = "".join(
        f'<tr><td style="padding:6px 10px; font-size:0.8rem; color:#80869a; white-space:nowrap;">{r}</td>'
        f'<td style="padding:6px 10px; font-size:0.88rem; color:#1c2333;"><strong>{v}</strong></td></tr>'
        for r, v in linhas
    )

    corpo_html = f"""
      <p style="font-size:0.95rem; color:#1c2333; margin-top:0;">
        Olá, {nome}. O {rotulo.lower()} abaixo vence <strong>{quando}</strong>.
      </p>
      <div style="border:1px solid #e5decf; border-left:3px solid #a2712e; border-radius:10px; padding:14px 16px; margin:16px 0;">
        <div style="font-size:1.02rem; font-weight:600; color:#1c2333; margin-bottom:8px;">{evento.titulo}</div>
        <table style="border-collapse:collapse;">{detalhes}</table>
      </div>
      {f'<p style="font-size:0.86rem; color:#4b5468;">{evento.descricao}</p>' if evento.descricao else ""}
    """

    assunto = f"[{rotulo} {quando}] {evento.titulo} — {escritorio_nome}"
    corpo_texto = (
        f"{rotulo}: {evento.titulo}\n"
        f"Quando: {_formatar_data(evento.data_evento, com_hora=True)} ({quando})\n"
        f"Acesse o sistema {escritorio_nome} para ver os detalhes."
    )

    return assunto, _casca_html(escritorio_nome, f"{rotulo} {quando}", "Lembrete automático da sua agenda.", corpo_html), corpo_texto


def montar_email_resumo_semanal(nome, escritorio_nome, eventos, processos_novos, parcelas_vencendo):
    """Resumo do que vem pela frente na semana."""

    corpo_html = f"""
      <p style="font-size:0.95rem; color:#1c2333; margin-top:0;">
        Olá, {nome}. Este é o resumo da sua semana no {escritorio_nome}.
      </p>

      <h3 style="font-size:0.98rem; margin-bottom:4px;">Compromissos e prazos dos próximos 7 dias ({len(eventos)})</h3>
      {_tabela_html(
          ["Quando", "Título", "Tipo"],
          [[_formatar_data(e.data_evento, com_hora=True), e.titulo, e.get_tipo_display()] for e in eventos],
          "Nada agendado para os próximos 7 dias.",
      )}

      <h3 style="font-size:0.98rem; margin-bottom:4px;">Processos abertos na última semana ({len(processos_novos)})</h3>
      {_tabela_html(
          ["Número", "Título", "Status"],
          [[p.numero_processo, p.titulo, _status_label(p.status)] for p in processos_novos],
          "Nenhum processo novo na última semana.",
      )}

      <h3 style="font-size:0.98rem; margin-bottom:4px;">Parcelas a vencer ({len(parcelas_vencendo)})</h3>
      {_tabela_html(
          ["Vencimento", "Processo", "Valor"],
          [
              [
                  _formatar_data(pc.data_vencimento),
                  pc.contrato.processo.numero_processo,
                  f"R$ {pc.valor:.2f}".replace(".", ","),
              ]
              for pc in parcelas_vencendo
          ],
          "Nenhuma parcela a vencer nos próximos 7 dias.",
      )}
    """

    assunto = f"Resumo da semana — {escritorio_nome}"
    corpo_texto = (
        f"Resumo da semana no {escritorio_nome}\n"
        f"{len(eventos)} compromisso(s)/prazo(s), {len(processos_novos)} processo(s) novo(s), "
        f"{len(parcelas_vencendo)} parcela(s) a vencer."
    )

    return assunto, _casca_html(escritorio_nome, "Resumo da semana", "Enviado automaticamente toda segunda-feira.", corpo_html), corpo_texto


def montar_email_aviso(nome, escritorio_nome, titulo, resumo, linhas):
    """Aviso curto sobre algo que acabou de acontecer no escritório."""

    detalhes = "".join(
        f'<tr><td style="padding:6px 10px; font-size:0.8rem; color:#80869a; white-space:nowrap;">{r}</td>'
        f'<td style="padding:6px 10px; font-size:0.88rem; color:#1c2333;"><strong>{v}</strong></td></tr>'
        for r, v in linhas
    )

    corpo_html = f"""
      <p style="font-size:0.95rem; color:#1c2333; margin-top:0;">Olá, {nome}. {resumo}</p>
      <div style="border:1px solid #e5decf; border-left:3px solid #a2712e; border-radius:10px; padding:14px 16px; margin:16px 0;">
        <table style="border-collapse:collapse;">{detalhes}</table>
      </div>
    """

    assunto = f"{titulo} — {escritorio_nome}"
    corpo_texto = f"{resumo}\n" + "\n".join(f"{r}: {v}" for r, v in linhas)

    return assunto, _casca_html(escritorio_nome, titulo, resumo, corpo_html), corpo_texto


def montar_email_movimentacoes(nome, escritorio_nome, processo, movimentos):
    """Aviso de que o tribunal registrou andamentos novos em um processo."""

    corpo_html = f"""
      <p style="font-size:0.95rem; color:#1c2333; margin-top:0;">
        Olá, {nome}. A consulta automática encontrou
        <strong>{len(movimentos)} andamento(s) novo(s)</strong> no processo abaixo.
      </p>
      <div style="border:1px solid #e5decf; border-left:3px solid #a2712e; border-radius:10px; padding:14px 16px; margin:16px 0;">
        <div style="font-size:1.02rem; font-weight:600; color:#1c2333;">{processo.numero_processo}</div>
        <div style="font-size:0.86rem; color:#4b5468; margin-top:4px;">{processo.titulo}</div>
      </div>
      {_tabela_html(
          ["Data", "Andamento"],
          [[_formatar_data(m.data_movimentacao, com_hora=True), m.descricao] for m in movimentos],
          "Nenhum andamento novo.",
      )}
      <p style="font-size:0.78rem; color:#80869a;">
        Os andamentos vêm da base pública do CNJ (DataJud) e não substituem a
        consulta ao diário oficial.
      </p>
    """

    assunto = f"Andamento novo — {processo.numero_processo} — {escritorio_nome}"
    corpo_texto = (
        f"{len(movimentos)} andamento(s) novo(s) no processo {processo.numero_processo}.\n"
        + "\n".join(f"- {m.descricao}" for m in movimentos)
    )

    return assunto, _casca_html(escritorio_nome, "Andamento novo no processo", "Encontrado pela consulta automática ao DataJud.", corpo_html), corpo_texto
