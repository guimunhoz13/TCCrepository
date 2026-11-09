"""Identidade visual dos roteiros do LexNexo, derivada do design-system.css."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parents[1]
PAPEL=colors.HexColor('#f5f2ea');TINTA=colors.HexColor('#1c2333');OURO=colors.HexColor('#a2712e');DOURADO=colors.HexColor('#c99a4b');MUTED=colors.HexColor('#4b5468')
def registrar_fontes():
 pasta=ROOT/'assets/branding/fonts'
 for nome,arquivo in [('Plano','DMSans-Regular'),('PlanoBold','DMSans-SemiBold'),('PlanoItalic','DMSans-Regular'),('LexTitulo','Fraunces-SemiBold')]:
  if nome not in pdfmetrics.getRegisteredFontNames():pdfmetrics.registerFont(TTFont(nome,str(pasta/(arquivo+'.ttf'))))

def estilos():
 registrar_fontes()
 return {
  'title':ParagraphStyle('LexTitle',fontName='LexTitulo',fontSize=22,leading=27,spaceAfter=12,textColor=TINTA),
  'h':ParagraphStyle('LexH',fontName='LexTitulo',fontSize=17,leading=22,spaceAfter=10,textColor=TINTA),
  'sub':ParagraphStyle('LexSub',fontName='PlanoBold',fontSize=10.5,leading=14,spaceBefore=9,spaceAfter=5,keepWithNext=True,textColor=TINTA),
  'p':ParagraphStyle('LexP',fontName='Plano',fontSize=9.5,leading=13,spaceAfter=7,textColor=TINTA),
  'speech':ParagraphStyle('LexSpeech',fontName='Plano',fontSize=9.5,leading=13,spaceAfter=8,leftIndent=10,textColor=MUTED),
  'cell':ParagraphStyle('LexCell',fontName='Plano',fontSize=8.5,leading=11,textColor=TINTA),
  'cellhead':ParagraphStyle('LexCellHead',fontName='PlanoBold',fontSize=8.5,leading=11,textColor=PAPEL),
  'small':ParagraphStyle('LexSmall',fontName='Plano',fontSize=8,leading=11,spaceAfter=6,textColor=MUTED),
 }

def moldura(c,doc,rotulo='Gravação e montagem'):
 w,h=doc.pagesize;c.saveState();c.setFillColor(PAPEL);c.rect(0,0,w,h,stroke=0,fill=1)
 c.setFillColor(TINTA);c.rect(0,h-51,w,51,stroke=0,fill=1)
 c.drawImage(str(ROOT/'frontend/public/icon-192.png'),60,h-40,width=29,height=29,mask='auto')
 c.setFont('LexTitulo',17);c.setFillColor(PAPEL);c.drawString(98,h-32,'LexNexo')
 c.setFont('Plano',8.5);c.setFillColor(DOURADO);c.drawRightString(w-60,h-23,'TDS-2026-038')
 c.setFillColor(PAPEL);c.drawRightString(w-60,h-37,rotulo)
 c.setFont('Plano',8);c.setFillColor(MUTED);c.drawString(60,27,'Pré-banca 2026 - roteiro revisto em 09/11/2026');c.drawRightString(w-60,27,str(doc.page));c.restoreState()
