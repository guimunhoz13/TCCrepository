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
 path=raiz/'docs/testes/evidencias/2026-11-09'/nome
 with PILImage.open(path) as im:w,ht=im.size
 escala=min(largura/w,altura_max/ht);return Image(str(path),width=w*escala,height=ht*escala,hAlign='LEFT')

hist=[['Data e ambiente','Django','Jest','Playwright','Total']]+[[r['data']+' '+r['ambiente'],r['django'],r['jest'],r['playwright'],r['total']] for r in metricas['rodadas']]
story=[h('Apêndice C Rotinas automáticas'),p('Comandos existentes no backend. A execução periódica depende de um agendador externo; sua configuração e a entrega efetiva de mensagens não foram comprovadas na auditoria.'),table([
 ['Comando Django','Finalidade'],['enviar_lembretes','Lembretes e resumo semanal por e-mail.'],['sincronizar_datajud','Consulta de andamentos para processos elegíveis.'],['buscar_intimacoes','Importação DJEN e proposta de prazos.'],['popular_demo','Dados fictícios em ambiente exclusivo; não executar na conta publicada.'],['criar_superadmin','Acesso separado ao painel mestre; não altera a conta do escritório.'],['gerar_chaves_vapid','Chaves de push, mantidas em segredo no ambiente.']], [180,295]),Spacer(1,14),sub('Métricas consolidadas por execução'),table(hist,[175,65,65,90,80]),Spacer(1,10),p(f'Fonte única: docs/testes/evidencias/metricas-atuais.json, compartilhada com a seção 7.9 do Relatório Técnico v1.13. Não somar rodadas. O resultado corrente é {metricas["rodadas"][-1]["total"]} casos. Playwright inclui {metricas["escopo_playwright_atual"]["navegador"]} cenários de navegador e um HTTP/proxy sem UI. As contagens antigas de 478/223/11 foram substituídas por esta referência datada.'),p(f'Cobertura de linhas em 09/11/2026: backend {metricas["cobertura"]["backend_linhas"]} (advocacia sem testes e migrations); frontend {metricas["cobertura"]["frontend_linhas"]} (JS/JSX de src inteiro). Meta frontend 70% não atingida. Playwright não foi somado à cobertura Jest. Lint, build, schema e migrations passaram no PostgreSQL exclusivo local.'),PageBreak(),
 h('Apêndice D Revisão prática de 09/11/2026'),p('Grupo TDS-2026-038. As 61 páginas ilustradas originais conservam a data da edição inicial. Este adendo apresenta regras atuais e novas evidências; as capturas antigas não são apresentadas como execuções novas.'),sub('Encontrar e acompanhar o caso Ômega'),p('Na busca global, procure 20261109 ou AUDITORIA-TCC-20261109-01. O cliente Ômega e o processo foram criados pela interface na conta publicada. A ficha reúne agenda, tarefa, movimentação, modelo, documento, horas, despesa e contrato. Os demais vínculos foram incluídos e conferidos por chamadas autenticadas e pela ficha. Todos os registros anteriores e os 15 novos registros principais permanecem no sistema.'),figura('cliente-omega.jpg',475,240),Paragraph('Cliente fictício Ômega no sistema publicado, captura de 09/11/2026. Sem dados de um cliente real.',styles['LegendaAtual']),p('Abra o processo e use sua ficha para conferir os vínculos. A audiência está em 26/11 às 14h30 e o prazo em 17/11 às 18h. Há uma tarefa em andamento, uma movimentação manual fictícia, 90 minutos a R$ 120,00/h (R$ 180,00) e uma despesa de R$ 23,47. O PDF anexado é um arquivo sintético já usado na auditoria de 03/11; não representa documento jurídico real.'),PageBreak(),
 h('Ficha, agenda e cálculo de prazo'),figura('ficha-omega-publicada.jpg',475,285),Paragraph('Ficha integrada do caso Ômega em 09/11. Os lançamentos e as três parcelas permanecem na conta.',styles['LegendaAtual']),p('A página Compromissos manteve o modo compacto antes e depois do carregamento e da expansão do menu na conferência publicada. Ao criar ou editar um evento, confirme data, horário e processo; a regressão local conferiu salvar e reabrir 26/11 às 14h30 em America/Sao_Paulo, sem deslocamento.'),p('O cálculo exige quantidade inteira de 1 a 10.000 dias, limite técnico para impedir entradas sem sentido e estouro de datas. Frações e booleanos são recusados. O feriado sintético de 12/11 foi restrito à comarca AUDITORIA TCC 20261109 e não altera o calendário geral de comarcas reais. O profissional continua responsável por conferir início, suspensão, regra e vencimento do prazo.'),sub('Teclado e mensagens de erro'),p('Em Configurações, Tab percorre o modal, Escape solicita o fechamento e o foco volta ao controle de origem. Alterações não salvas mantêm sua confirmação. Formulários mostram validações; o catálogo registra os estados de carregamento e falha exercitados. A inspeção Axe de 18 estados não equivale a certificação integral de acessibilidade.'),PageBreak(),
 h('Honorários, documentos e operação offline'),p('O contrato Ômega tem R$ 100,01, distribuídos em R$ 33,33, R$ 33,33 e R$ 33,35. As parcelas continuam pendentes. Em contrato com parcelas emitidas, processo, total, forma de pagamento e quantidade de parcelas não podem ser alterados; a API explica a recusa. Observações e demais metadados permitidos continuam editáveis. A regra preserva a relação entre o contrato e o que já foi emitido, sem recalcular contratos antigos.'),p('Ao registrar baixa, o botão fica temporariamente indisponível durante o envio. Uma recusa mostra erro e permite nova tentativa; o sucesso atualiza o painel. O estorno permitido limpa a data de pagamento e registra a mudança na auditoria. Os testes de baixa e estorno foram feitos no banco local; não se quitou parcela real na conta publicada.'),p('Em Cobrar com PIX, mantenha o modo Teste. A simulação não transfere dinheiro nem dá baixa. Geração de BRCode/QR code não comprova integração bancária nem pagamento recebido.'),p('Em Modelos, escolha o processo como origem e confira as variáveis no preview. A API recusa combinar um processo com um cliente diferente. Para anexos, use Abrir ou Baixar; se o navegador impedir a nova aba, utilize o download. Na conta publicada, o navegador integrado impediu inspecionar visualmente a aba blob por política da ferramenta. O conteúdo PDF e a autenticação foram verificados separadamente, sem declarar essa inspeção visual como aprovada.'),p('O PWA pode ser instalado. O teste dedicado no Chromium conferiu a tela Sem conexão e a ausência de respostas de API e páginas autenticadas no Cache Storage do worker. Não há edição offline de processos: recupere a conexão para consultar e salvar dados atuais. A emulação do worker exigiu a opção de rede do Playwright 1.56; a falha inicial da preparação não foi tratada como defeito do produto.'),PageBreak(),
 h('Publicação, preservação e limites'),p('A aplicação corrigida foi publicada em 09/11, versão 98ff6bf, na Vercel e no Render. O CI correspondente aprovou 884 casos; a ampliação posterior do cenário PWA aprovou 885 no CI 42620912216 e possui execução própria na fonte única. Não somar execuções. O registro PUBLICACAO-2026-11-09.md identifica hashes, ambientes e resultados.'),p('O modo S3 foi confirmado no Render sem revelar credenciais. Os cinco anexos privados comparados antes e depois da publicação conservaram bytes e SHA-256, e os IDs anteriores das 13 famílias conferidas continuaram presentes. Isso comprova essa preservação pontual; não valida ACL/RLS completa, recuperação integral em nuvem ou disponibilidade contínua.'),p('O ensaio local de backup/restauração passou: pg_dump custom restaurado em banco vazio e contagens de 39 tabelas públicas idênticas ao snapshot. Os arquivos de storage não fazem parte do dump. Não se afirma recuperação integral em nuvem.'),p('A IA usa OpenAI no backend, com modelo escolhido por OPENAI_MODEL. Não houve chamada paga. No plano Gratuito, o recurso do Profissional permanece bloqueado. Em indisponibilidade de BrasilAPI/ViaCEP, preencha manualmente; para DataJud/DJEN, consulte o canal oficial e registre a origem do lançamento manual. Não confunda cadastro de notificação com entrega de e-mail ou push.'),p('Parecer: APTO COM RESSALVAS. Permanecem pendentes a meta de cobertura frontend, atualização das ferramentas npm com alertas transitivos, entrega externa de mensagens, IA paga em operação, agendador, recuperação em nuvem, Safari real e avaliação com profissionais. RF52 é backlog. O vídeo será gravado pelos integrantes; roteiro, gravação e submissão são etapas distintas.'),p('Preserve todos os dados AUDITORIA TCC. Exclusão, anonimização, bloqueio por tentativas e troca de credenciais foram exercitados somente em base local. Consulte os casos, requisitos, riscos e evidências em docs/testes. Guilherme apresenta frontend/demonstração; João apresenta backend, APIs e banco no roteiro de pré-banca.')]


buf=BytesIO()
def footer(c,doc):
 c.setFillColor(colors.black);c.setFont('GuiaSans',8);c.drawString(60,28,'LexNexo Guia de Funcionalidades - TDS-2026-038 - revisão documental de 11/11/2026');c.drawRightString(535,28,str(doc.page+60))
SimpleDocTemplate(buf,pagesize=(595.276,841.89),rightMargin=60,leftMargin=60,topMargin=48,bottomMargin=48).build(story,onFirstPage=footer,onLaterPages=footer)
novo=PdfWriter()
for pagina in leitor.pages[:61]:novo.add_page(pagina)
# Nota de revisão em área livre da capa, sem alterar o design original.
nota=BytesIO();cv=canvas.Canvas(nota,pagesize=(595.276,841.89));cv.setFillColor(colors.HexColor('#e7e5df'));cv.setFont('GuiaSans',9);cv.drawString(85,175,'Grupo TDS-2026-038 - revisão documental de 11/11/2026');cv.drawString(85,161,'Capturas originais preservadas; novas evidências no Apêndice D.');cv.save();nota_reader=PdfReader(nota);novo.pages[0].merge_page(nota_reader.pages[0])
# Atualiza o índice no espaço livre abaixo da última entrada original.
indice=BytesIO();ci=canvas.Canvas(indice,pagesize=(595.276,841.89));ci.setFillColor(colors.black);ci.setFont('GuiaSansBold',10.5);ci.drawString(48,285,'Apêndice D — Revisão prática de 09/11/2026');ci.drawRightString(547,285,'62');ci.save();novo.pages[2].merge_page(PdfReader(indice).pages[0])
complemento_reader=PdfReader(buf)
for pagina in complemento_reader.pages:novo.add_page(pagina)
novo.add_metadata({'/Title':'LexNexo Guia de Funcionalidades revisão de novembro de 2026','/Author':'João Henrique Souza Sabino e Guilherme Rossato Munhoz','/Subject':'Manual ilustrado com métricas e limites da auditoria de 09/11/2026; conferência documental em 11/11/2026'})
saida=raiz/'docs/Guia-de-Funcionalidades-LexNexo.pdf'
with saida.open('wb') as f:novo.write(f)
print(json.dumps({'arquivo':str(saida),'paginas':len(novo.pages),'metricas':metricas['fonte_atual']},ensure_ascii=False))
