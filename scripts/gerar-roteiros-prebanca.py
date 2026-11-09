"""PDFs do roteiro completo e dos roteiros individuais com a identidade LexNexo."""
from pathlib import Path
import re
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate,Paragraph,Table,TableStyle,Spacer,PageBreak,KeepTogether
from reportlab.lib import colors
from tema_lexnexo import estilos,moldura,TINTA,PAPEL
ROOT=Path(__file__).resolve().parents[1];STYLE=estilos()

def gerar(markdown,saida,rotulo,selecionar=None):
 lines=markdown.splitlines();story=[];i=0;ativo=True;paginas=0
 while i<len(lines):
  line=lines[i].strip()
  if line.startswith('## '):
   titulo=line[3:];ativo=True if selecionar is None else selecionar(titulo)
   if ativo:
    if story:story.append(PageBreak())
    story.append(Paragraph(escape(titulo),STYLE['title' if paginas==0 else 'h']));paginas+=1
   i+=1;continue
  if not ativo or not story or not line or line.startswith('# '):i+=1;continue
  if line.startswith('### '):story.append(Paragraph(escape(line[4:]),STYLE['sub']));i+=1;continue
  if line.startswith('|'):
   rows=[]
   while i<len(lines) and lines[i].strip().startswith('|'):
    r=[v.strip() for v in lines[i].strip().strip('|').split('|')]
    if not all(re.fullmatch(r':?-+:?',v) for v in r):rows.append(r)
    i+=1
   assert all(len(row)==len(rows[0]) for row in rows), rows
   cols=len(rows[0]);widths={2:[238,237],3:[145,165,165],4:[100,160,55,160]}.get(cols,[475/cols]*cols)
   # Arquivos longos precisam de mais largura que a coluna de minuto.
   if rows[0][0] in ['Minuto','Arquivo']:widths=[58,245,172] if rows[0][0]=='Minuto' else [165,210,100]
   cells=[[Paragraph(escape(v),STYLE['cellhead' if n==0 else 'cell']) for v in row] for n,row in enumerate(rows)]
   t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),TINTA),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#d9d0bd')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]));story.extend([t,Spacer(1,8)]);continue
  para=[line];i+=1
  while i<len(lines) and lines[i].strip() and not lines[i].lstrip().startswith(('#','|')):para.append(lines[i].strip());i+=1
  raw=' '.join(para);sty='p'
  if raw.startswith('**Fala sugerida:**'):sty='speech'
  elif raw.startswith('**Conferência:**'):sty='small'
  raw=escape(raw);raw=re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',raw)
  story.append(Paragraph(raw,STYLE[sty]))
 # Mantenha a orientação e a fala da mesma cena na mesma página.
 grouped=[];part=[]
 for flow in story:
  boundary=isinstance(flow,PageBreak) or (isinstance(flow,Paragraph) and flow.style.name in ['LexTitle','LexH','LexSub'])
  if boundary and part:
   grouped.append(KeepTogether(part));part=[]
  if isinstance(flow,Paragraph) and flow.style.name=='LexSub':part=[flow]
  elif part:part.append(flow)
  else:grouped.append(flow)
 if part:grouped.append(KeepTogether(part))
 story=grouped
 def frame(c,d):moldura(c,d,rotulo)
 SimpleDocTemplate(str(saida),pagesize=(595.276,841.89),leftMargin=60,rightMargin=60,topMargin=70,bottomMargin=48,title='LexNexo '+rotulo,author='Guilherme Rossato Munhoz e João Henrique Souza Sabino').build(story,onFirstPage=frame,onLaterPages=frame)
 print(saida)

def main():
 detalhe=(ROOT/'docs/tcc/ROTEIRO_VIDEO_PREBANCA_2026.md').read_text()
 gerar(detalhe,ROOT/'docs/tcc/TDS-2026-038_Roteiro_Video_PreBanca_2026.pdf','Roteiro completo')
 plano=(ROOT/'docs/tcc/PLANO_GRAVACAO_E_MONTAGEM.md').read_text()
 sec=[m[1] for m in re.finditer(r'^## (.+)$',plano,re.M)]
 gui=sec[:2]+sec[sec.index('Roteiro de Guilherme e ordem de gravação'):sec.index('Roteiro de João e ordem de gravação')]+[sec[-1]]
 joao=sec[:2]+sec[sec.index('Roteiro de João e ordem de gravação'):sec.index('Ordem de montagem e conferência final')]+[sec[-1]]
 for nome,rotulo,selecionadas in [('Guilherme','Roteiro Guilherme',gui),('Joao','Roteiro João',joao)]:
  gerar(plano,ROOT/f'docs/tcc/TDS-2026-038_Roteiro_{nome}.pdf',rotulo,lambda t:t in selecionadas)
if __name__=='__main__':main()
