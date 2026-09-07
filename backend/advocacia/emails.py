from django.conf import settings
from django.core.mail import EmailMultiAlternatives


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
