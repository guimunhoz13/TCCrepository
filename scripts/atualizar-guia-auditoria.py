"""Atualiza o guia preservando as páginas ilustradas e usando métricas datadas.

Execute com o runtime de documentos (reportlab, pypdf e pdfplumber).
A versão original vem do commit documental de 28/10; não lê ambiente/segredos.
"""
from pathlib import Path
from io import BytesIO
from xml.sax.saxutils import escape
import json
import subprocess

from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter
from PIL import Image as PILImage

raiz = Path(__file__).resolve().parents[1]
metricas = json.loads((raiz/'docs/testes/evidencias/metricas-atuais.json').read_text())
original = subprocess.check_output(['git','show','0702332fa4c86c14aab6c679d51ec7f054b11870:docs/Guia-de-Funcionalidades-LexNexo.pdf'],cwd=raiz)
leitor = PdfReader(BytesIO(original))
assert len(leitor.pages) == 62, 'Conferir origem e índice do apêndice antes de atualizar.'
pdfmetrics.registerFont(TTFont('GuiaSans','/usr/share/fonts/TTF/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('GuiaSansBold','/usr/share/fonts/TTF/DejaVuSans-Bold.ttf'))
styles = getSampleStyleSheet()
for n in ['Title','Heading1','Heading2','Heading3']:styles[n].textColor=colors.black;styles[n].fontName='GuiaSansBold'
styles['BodyText'].fontName='GuiaSans';styles['BodyText'].fontSize=10;styles['BodyText'].leading=14;styles['BodyText'].spaceAfter=9
styles.add(ParagraphStyle(name='LegendaAtual',fontName='GuiaSans',fontSize=9,leading=12,textColor=colors.HexColor('#444444'),spaceAfter=12))
styles.add(ParagraphStyle(name='TabelaAtual',fontName='GuiaSans',fontSize=9,leading=12))
def p(t):return Paragraph(escape(t),styles['BodyText'])
def h(t):return Paragraph(escape(t),styles['Heading1'])
def sub(t):return Paragraph(escape(t),styles['Heading2'])
def table(rows,widths):
 t=Table([[Paragraph(escape(str(c)),styles['TabelaAtual']) for c in r] for r in rows],colWidths=widths,repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e7e7e7')),('GRID',(0,0),(-1,-1),.5,colors.HexColor('#d9d9d9')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]));return t

def figura(nome,largura=475,altura_max=290):
 path=raiz/'docs/testes/evidencias/2026-11-03'/nome
 with PILImage.open(path) as im:w,ht=im.size
 escala=min(largura/w,altura_max/ht);return Image(str(path),width=w*escala,height=ht*escala,hAlign='LEFT')

hist=[['Data e ambiente','Django','Jest','Playwright','Total']]+[[r['data']+' '+r['ambiente'],r['django'],r['jest'],r['playwright'],r['total']] for r in metricas['rodadas']]
story=[h('Apêndice C Rotinas automáticas'),p('Comandos existentes no backend. A execução periódica depende de um agendador externo; sua configuração e a entrega efetiva de mensagens não foram comprovadas na auditoria.'),table([
 ['Comando Django','Finalidade'],['enviar_lembretes','Lembretes e resumo semanal por e-mail.'],['sincronizar_datajud','Consulta de andamentos para processos elegíveis.'],['buscar_intimacoes','Importação DJEN e proposta de prazos.'],['popular_demo','Dados fictícios em ambiente exclusivo; não executar na conta publicada.'],['criar_superadmin','Acesso separado ao painel mestre; não altera a conta do escritório.'],['gerar_chaves_vapid','Chaves de push, mantidas em segredo no ambiente.']], [180,295]),Spacer(1,14),sub('Métricas consolidadas por execução'),table(hist,[175,65,65,90,80]),Spacer(1,10),p('Fonte única: docs/testes/evidencias/metricas-atuais.json, compartilhada com a seção 7.9 do Relatório Técnico v1.11. Não somar rodadas. O resultado corrente é 863 casos. Playwright inclui 38 cenários de navegador e um HTTP/proxy sem UI. As contagens antigas de 478/223/11 foram substituídas por esta referência datada.'),p('Cobertura de linhas em 05/11/2026: backend 91,49% (advocacia sem testes e migrations); frontend 36,93% (JS/JSX de src inteiro). Meta frontend 70% não atingida. Playwright não foi somado à cobertura Jest. Lint, build, schema e migrations passaram no PostgreSQL exclusivo local.'),PageBreak(),
 h('Apêndice D Uso prático e revisão de novembro'),p('Revisão consolidada em 05/11/2026 para o grupo TDS-2026-038. As páginas ilustradas anteriores conservam o conteúdo e as capturas de sua edição original. Este adendo registra comportamentos e limites conferidos na nova auditoria; não transforma telas antigas em evidência de uma execução nova.'),sub('Localizar os registros preservados'),p('Na busca global, procure 20261103. Abra AUDITORIA-TCC-20261103-01, vinculado ao cliente Gama fictício. A ficha reúne contrato, parcelas, agenda, tarefa, horas, despesa, documento e movimentação. O processo Delta foi criado com sigilo. Não apagar, inativar ou anonimizar esses registros.'),p('Permanecem 18 registros de negócio desta rodada e uma foto sintética, além dos registros anteriores. O feriado fictício de 13/11 tem abrangência específica AUDITORIA TCC 20261103, sem efeito global sobre comarcas reais.'),figura('ficha-gama.jpg'),Paragraph('Ficha do Gama na conta publicada, captura de 03/11. Contrato R$ 100,01, horas R$ 150,00 e despesa R$ 23,45. Parcelas continuam pendentes.',styles['LegendaAtual']),p('Agenda: audiências em 16/11 às 14h30 e 25/11 às 9h; prazos em 10/11 às 18h e 24/11 às 16h. O cálculo de cinco dias úteis excluiu a referência 03/11 e retornou 10/11. O profissional deve conferir a regra jurídica. O apontamento de 75 minutos conserva 27/10, data restaurada do rascunho; não se afirma que foi lançado para 03/11.'),PageBreak(),
 h('Modelos e PIX de teste'),p('Em Modelos de documento, selecione a Declaração Gama, escolha origem Processo e indique o Gama. Gere e revise o preview antes de imprimir. A substituição usa apenas variáveis permitidas.'),figura('modelo-preenchido.jpg',475,245),Paragraph('Preview do modelo fictício em 03/11, sem validade jurídica.',styles['LegendaAtual']),p('Em Contratos, expanda o contrato Gama e abra Cobrar com PIX. Mantenha Tipo de operação em Teste. Simular pagamento aprovado mostra a confirmação, mas não quita a parcela nem movimenta dinheiro. A simulação não é um sandbox bancário.'),p('Na conferência de 04/11, a mensagem foi: Pagamento simulado. Nenhum dinheiro foi movimentado e a parcela real continua pendente. A observação foi registrada no caso PR26-14. Não é apresentado comprovante bancário.'),PageBreak(),
 h('Plano e limites de operação'),p('No plano Gratuito, o Assistente IA informa que o recurso é do Profissional e não oferece o chat. Em erro ao consultar o plano, há uma tentativa de recuperação sem liberar o recurso indevidamente.'),figura('assistente-depois.jpg',475,210),Paragraph('Bloqueio visual do recurso no plano Gratuito, conferido após a publicação de 03/11.',styles['LegendaAtual']),sub('Arquivos e navegação'),p('O PDF fictício anexado ao Gama foi baixado autenticadamente e comparado byte a byte com o original. Em 03–04/11, a abertura em nova aba ficou bloqueada no navegador integrado. A correção de 05/11 reserva a aba no clique; se o navegador impedir a abertura, o documento é baixado e o relatório é salvo como HTML. Abra o HTML e use Imprimir / Salvar como PDF. Os fluxos de documento e relatório passaram em Chromium e Firefox; o fallback com popup bloqueado tem testes Jest. O reteste publicado depende do deploy. A foto persistida passou a responder 200 pelo proxy e pela API após a correção de 04/11; acesso anônimo retorna 401.'),sub('Serviços e contingência'),p('A IA usa OpenAI no backend, com modelo escolhido por OPENAI_MODEL; não houve chamada paga nesta auditoria. Em falha de BrasilAPI ou ViaCEP, preencha manualmente. Em falha de DataJud/DJEN, confira a informação no canal oficial e registre movimento ou prazo manual com sua origem. Não presumir entrega de e-mail/push apenas porque o cadastro foi salvo.'),p('A publicação das novas correções depende da reconexão ao Render e da conferência do armazenamento dos documentos antes de um push que possa acionar deploy. Não se atribui a correção financeira local à API antiga. Consulte docs/testes/PUBLICACAO-2026-11-05.md para a situação exata.'),p('Parecer: APTO COM RESSALVAS. Cobertura frontend, vídeo, backup/restauração, ACL/bucket, agendador, serviços externos, WebKit/Safari e avaliação com profissionais permanecem limitados. Fonte dos casos e evidências: docs/testes. O roteiro de vídeo está em docs/tcc/RESPOSTA_AO_PARECER-2026-11-04.md; não foi apresentado como gravação concluída.')]

buf=BytesIO()
def footer(c,doc):
 c.setFillColor(colors.black);c.setFont('GuiaSans',8);c.drawString(60,28,'LexNexo Guia de Funcionalidades - TDS-2026-038 - revisão de 05/11/2026');c.drawRightString(535,28,str(doc.page+60))
SimpleDocTemplate(buf,pagesize=(595.276,841.89),rightMargin=60,leftMargin=60,topMargin=48,bottomMargin=48).build(story,onFirstPage=footer,onLaterPages=footer)
novo=PdfWriter()
for pagina in leitor.pages[:61]:novo.add_page(pagina)
# Nota de revisão em área livre da capa, sem alterar o design original.
nota=BytesIO();cv=canvas.Canvas(nota,pagesize=(595.276,841.89));cv.setFillColor(colors.HexColor('#e7e5df'));cv.setFont('GuiaSans',9);cv.drawString(85,175,'Grupo TDS-2026-038 - revisão de 05/11/2026');cv.drawString(85,161,'Capturas originais preservadas; novas evidências no Apêndice D.');cv.save();nota_reader=PdfReader(nota);novo.pages[0].merge_page(nota_reader.pages[0])
complemento_reader=PdfReader(buf)
for pagina in complemento_reader.pages:novo.add_page(pagina)
novo.add_metadata({'/Title':'LexNexo Guia de Funcionalidades revisão de novembro de 2026','/Author':'João Henrique Souza Sabino e Guilherme Rossato Munhoz','/Subject':'Manual ilustrado com métricas e limites atualizados em 05/11/2026'})
saida=raiz/'docs/Guia-de-Funcionalidades-LexNexo.pdf'
with saida.open('wb') as f:novo.write(f)
print(json.dumps({'arquivo':str(saida),'paginas':len(novo.pages),'metricas':metricas['fonte_atual']},ensure_ascii=False))
