"""Gera o plano de gravação e montagem a partir do roteiro do grupo 038.

Usar o runtime de documentos com ReportLab. Não acessa banco nem serviços.
"""
from pathlib import Path
import re
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, PageBreak, KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/tcc/ROTEIRO_VIDEO_PREBANCA_2026.md'
text = SOURCE.read_text()
pat = re.compile(r'^### (\d{2}:\d{2})–(\d{2}:\d{2}) — (.+)$', re.M)
scenes = []
for m in pat.finditer(text):
    rest = text[m.end():]
    end = re.search(r'^##(?:#)? ', rest, re.M)
    body = rest[:end.start()] if end else rest
    def field(label):
        match = re.search(r'\*\*' + label + r':\*\* (.*?)(?=\n\n|\Z)', body, re.S)
        return match.group(1).strip() if match else ''
    scenes.append(dict(start=m[1],end=m[2],who=m[3],screen=field('Tela e cliques'),speech=field('Fala sugerida')))
assert len(scenes) == 30

def seconds(v):
    m,s=map(int,v.split(':'));return m*60+s

def selected(start,end):
    return [s.copy() for s in scenes if seconds(start)<=seconds(s['start'])<seconds(end)]

clips = [
 {'n':'01','person':'Guilherme','start':'00:00','end':'03:00','screen':'Slides 1 e 2','file':'01_gui_abertura.mp4','theme':'Contexto e proposta'},
 {'n':'02','person':'Guilherme','start':'03:00','end':'04:00','screen':'Slide 3','file':'02_gui_frontend.mp4','theme':'Frontend na arquitetura'},
 {'n':'03','person':'João','start':'04:00','end':'06:00','screen':'Slides 3 e 4','file':'03_joao_arquitetura_banco.mp4','theme':'Arquitetura, backend e modelo de dados'},
 {'n':'04','person':'Guilherme','start':'06:00','end':'12:00','screen':'Sistema no navegador','file':'04_gui_demonstracao.mp4','theme':'Fluxo completo no LexNexo'},
 {'n':'05','person':'João','start':'12:00','end':'14:30','screen':'Editor e DER','file':'05_joao_codigo_banco.mp4','theme':'Como a operação é processada'},
 {'n':'06','person':'João narra; Guilherme grava telas de apoio','start':'14:30','end':'17:00','screen':'Sistema, código e testes','file':'06_bloco_tecnico_montado.mp4','theme':'Recursos administrativos, integrações e testes'},
 {'n':'07','person':'Guilherme','start':'17:00','end':'17:40','screen':'Slide 5','file':'07_gui_resultados.mp4','theme':'Resultados e contribuição'},
 {'n':'08','person':'João','start':'17:40','end':'19:45','screen':'Slide 6 e capa final','file':'08_joao_fechamento.mp4','theme':'Limitações, aprendizados e encerramento'},
]
assert all(clips[i]['end']==clips[i+1]['start'] for i in range(7))
assert sum(seconds(c['end'])-seconds(c['start']) for c in clips)==1185

from tema_lexnexo import estilos, moldura, TINTA, PAPEL
styles = estilos()
story=[];md=['# Plano de gravação e montagem do vídeo LexNexo','','Grupo TDS-2026-038 | revisão de 09/11/2026','']
def para(t,style='p'):
    story.append(Paragraph(escape(t).replace('\n','<br/>'),styles[style]));md.extend([t,''])
def heading(t):
    story.append(Paragraph(escape(t),styles['sub']));md.extend(['### '+t,''])
def page(title,subtitle=''):
    if story:story.append(PageBreak())
    story.append(Paragraph(escape(title),styles['title' if not story else 'h']));md.extend(['## '+title,''])
    if subtitle:para(subtitle,'small')
def table(heads,rows,widths):
    cells=[[Paragraph(escape(str(c)),styles['cellhead' if n==0 else 'cell']) for c in row] for n,row in enumerate([heads]+rows)]
    t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),TINTA),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#d9d0bd')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]));story.extend([t,Spacer(1,9)])
    md.extend(['| '+' | '.join(heads)+' |','| '+' | '.join(['---']*len(heads))+' |']+['| '+' | '.join(map(str,row))+' |' for row in rows]+[''])
def clip_page(n):
    c=next(c for c in clips if c['n']==n)
    page('Clipe '+n+' '+c['theme'],c['person']+' | '+c['start']+' a '+c['end']+' no vídeo final | arquivo: '+c['file'])
    return c

def render_scenes(items):
    for s in items:
        inicio = len(story)
        heading(s['start']+' a '+s['end'])
        para('Na tela: '+s['screen'])
        para('Fala-base: '+s['speech'],'speech')
        bloco = story[inicio:]
        story[inicio:] = [KeepTogether(bloco)]

page('Plano de gravação e montagem do vídeo LexNexo','Guilherme Rossato Munhoz e João Henrique Souza Sabino | TDS-2026-038')
para('Preparem oito clipes e montem um único vídeo de até 20 minutos. A ordem abaixo preserva os cinco blocos do professor: 3 minutos de contexto, 3 de arquitetura, 6 de demonstração, 5 de implementação e 3 de fechamento. A fala termina em 19:45; os 15 segundos restantes são margem, sem conteúdo novo.')
table(['Ordem e tempo final','Quem apresenta','Tela principal'],[[c['n']+' — '+c['start']+' a '+c['end'],c['person'],c['screen']] for c in clips],[125,190,160])
heading('Trocas de tela na montagem')
para('01 para 02: continuar nos slides e trocar para a arquitetura. 02 para 03: manter o mesmo diagrama e trocar a voz para João. 03 para 04: sair dos slides e entrar no navegador. 04 para 05: sair do sistema e abrir o editor. 05 para 06: intercalar as telas de apoio com a explicação técnica. 06 para 07: voltar ao slide de resultados. 07 para 08: trocar para limitações e encerrar na capa.')
para('A gravação pode ser feita em outra ordem. Os números dos arquivos determinam a posição na edição, não obrigam vocês a gravar juntos ou em sequência.','small')

page('Slides prontos e preparação da gravação')
table(['Slide','Conteúdo do slide','Quem usa'],[
 ['1','Capa: LexNexo, grupo 038, integrantes, curso, orientador e coorientador.','Guilherme na abertura; João no fim.'],
 ['2','Problema, objetivo e público-alvo. Um fluxo simples: cliente > processo > prazo > documento > honorários.','Guilherme'],
 ['3','Slide 3, Arquitetura do LexNexo: containers, tecnologias, implantação e comunicação frontend/API/banco.','Guilherme e João'],
 ['4','Slide 4, Modelo de dados e módulos: recorte de Cliente, Processo, Contrato, Parcela, Agenda e Documento.','João'],
 ['5','Resultados: fluxo demonstrado, 885 testes em 09/11 e cobertura de linhas 91,85% backend / 38,03% frontend.','Guilherme; João retoma os números nos testes.'],
 ['6','Limitações, dificuldades, aprendizados e evolução. RF52 adiado e cobertura frontend abaixo da meta.','João'],
],[42,334,99])
heading('Abas prontas antes de apertar Gravar')
para('Deixem abertos os slides, o LexNexo com sessão preparada, uma segunda sessão local de perfil restrito e o editor com os trechos marcados. No sistema, preparem cliente e processo fictícios novos, declaração com variáveis, PDF fictício, calendário de teste e contrato ainda não criado para esse processo. A gravação deve identificar se usa base local ou sistema publicado.')
heading('Gravação e corte')
para('Usem a mesma resolução, preferencialmente 1920 x 1080, e fonte ampliada. Gravem dois segundos de respiro no início e no fim de cada arquivo e removam esses trechos na edição. Façam cortes diretos na troca de falante ou tela, sem acrescentar uma vinheta a cada clipe. A duração final inclui todas as transições, capa e créditos.')
para('Copiem os dados fictícios de uma cola para reduzir digitação. Mantenham visível o resultado após salvar. Não mostrem senhas, tokens, .env, QR de autenticação ou dados de clientes reais. Preservem todos os registros de teste publicados. Anonimização e troca de credenciais ficam em base local separada.')

page('Roteiro de Guilherme e ordem de gravação')
para('Sua ordem de gravação: 01, 02, 04, 06A e 07. Você apresenta o frontend e conduz a demonstração. O 06A contém telas de apoio sem narração final; João explica esse trecho no bloco técnico.')
table(['Arquivo','Preparar e gravar','Destino na edição'],[
 ['01_gui_abertura.mp4','Slides 1 e 2: identificação, problema, objetivo e público.','00:00 a 03:00'],
 ['02_gui_frontend.mp4','Slide 3: frontend, componentes e comunicação com a API.','03:00 a 04:00'],
 ['04_gui_demonstracao.mp4','Navegador: executar um fluxo relacionado ao mesmo caso fictício.','06:00 a 12:00'],
 ['06A_gui_telas_apoio.mp4','105 segundos de telas: LGPD, mestre, IA e notificações, em base preparada.','14:30 a 16:15, com a voz de João.'],
 ['07_gui_resultados.mp4','Slide 5: retomar o problema e os resultados demonstrados.','17:00 a 17:40'],
],[165,210,100])
heading('Como terminar sua demonstração')
para('Ao encerrar o clipe 04, diga: "A seguir, o João vai mostrar como essas operações são tratadas na API e no banco". Deixe o último resultado legível por um instante. A edição corta para o editor do João, sem uma nova apresentação do projeto.')
heading('Guia para a fala')
para('As próximas páginas contêm falas-base. Ensaiem com cronômetro e expliquem com suas palavras. A meta de cada cena inclui cliques e tempo para enxergar o resultado; não leiam correndo para compensar atraso. O momento de falar sobre detalhes de implementação é o bloco do João.')

c=clip_page('01');items=selected(c['start'],c['end'])
for s in items:
    s['screen'] = 'Slide 1 com a identificação completa.' if s['start']=='00:00' else 'Slide 2: problema, objetivo, público-alvo e fluxo das informações.'
render_scenes(items)
heading('Transição para o próximo clipe')
para('Diga: "Agora vamos apresentar a arquitetura e as tecnologias que sustentam esse fluxo". No corte, entre no slide 3. Não abram o sistema ainda: a demonstração começa no clipe 04.')

c=clip_page('02');items=selected(c['start'],c['end']);items[0]['screen']='Slide 3: destacar a interface e sua comunicação com a API. Explicar a organização do frontend. Permanecer nos slides; o editor entra no clipe 05.';render_scenes(items)
heading('Passagem para João')
para('Termine apontando a seta da interface para a API. João começa o clipe 03 com esse mesmo slide na tela e explica o processamento. A edição troca a voz sem repetir a capa.')

c=clip_page('04');render_scenes(selected(c['start'],c['end']))
heading('Conferências para esse clipe')
para('Use um caso principal para manter cliente, processo, agenda, documento e contrato conectados. O número fictício não serve para provar consulta real ao DataJud; prepare outro processo público permitido para essa consulta. Faça um cadastro efetivo e mostre o registro salvo. Para PIX, use Teste e mantenha a parcela pendente. Mostre o efeito do perfil restrito numa segunda sessão local e uma ação real em tela de celular.')
para('Se BrasilAPI ou DataJud não responderem, mostre a mensagem real e explique a contingência manual. Essa gravação registra indisponibilidade; não comprova integração externa bem-sucedida.','small')

page('Guilherme telas de apoio e resultados','Clipes 06A e 07 | o 06A será narrado por João')
table(['Tempo final','O que você grava sem narração final','Duração'],[
 ['14:30 a 15:10','Exportar dados de cliente fictício local; abrir o arquivo. Em outro cliente local, anonimizar e mostrar o resultado.','40 s'],
 ['15:10 a 15:35','Painel mestre local: destacar que administra a plataforma e não é a conta comum do escritório.','25 s'],
 ['15:35 a 16:00','Assistente: pergunta contextual e resposta real, se configurado; senão, mostrar a restrição ou indisponibilidade efetiva.','25 s'],
 ['16:00 a 16:15','Notificações: recebimento efetivo se disponível; caso contrário, mostrar configuração e reconhecer que entrega não foi comprovada.','15 s'],
],[90,345,40])
para('Salve essas quatro cenas juntas em 06A_gui_telas_apoio.mp4, com 1:45 de conteúdo útil. Avise João onde cada cena começa. Na edição, silencie o áudio desse arquivo e use a narração dele. Os 45 segundos seguintes, de 16:15 a 17:00, são a tela de testes gravada pelo João.')
heading('Clipe 07 | 17:00 a 17:40 | slide 5')
items=selected('17:00','17:40');items[0]['screen']='Slide 5: resultados da auditoria, com total por suíte, cobertura de linhas e verificações práticas.';render_scenes(items)
para('Mantenha o slide 5 na gravação e relacione os resultados ao fluxo demonstrado. Use a data de referência das métricas e diga apenas os resultados efetivamente observados.','small')

page('Roteiro de João e ordem de gravação')
para('Sua ordem de gravação: 03, 05, 06B e 08. Apresente backend, APIs e banco. Receba primeiro o arquivo 06A de Guilherme para narrar as telas no mesmo ritmo; deixe o 06B por último se essas capturas ainda não estiverem prontas.')
table(['Arquivo','Preparar e gravar','Destino na edição'],[
 ['03_joao_arquitetura_banco.mp4','Slides 3 e 4: API, PostgreSQL, módulos e relações.','04:00 a 06:00'],
 ['05_joao_codigo_banco.mp4','Editor e DER: operação HTTP, validação, modelos, permissões e transação.','12:00 a 14:30'],
 ['06B_joao_narracao_testes.mp4','Narração das telas 06A e, ao final, sua tela de código/testes por 45 segundos.','14:30 a 17:00'],
 ['08_joao_fechamento.mp4','Slide 6 e capa: limites, dificuldades, aprendizados, evolução e agradecimento.','17:40 a 19:45'],
],[165,210,100])
heading('Trechos de código para deixar marcados')
table(['Arquivo','Trecho a destacar'],[
 ['frontend/src/services/api.js','Uma requisição relacionada ao contrato, como entrada do fluxo.'],
 ['backend/advocacia/views/financeiro.py','ContratoViewSet, perform_create, transação e _gerar_parcelas.'],
 ['backend/advocacia/serializers.py','ContratoSerializer e validação dos relacionamentos/valores.'],
 ['backend/advocacia/models.py','Processo, Contrato, Parcela e seus vínculos.'],
 ['backend/advocacia/mixins.py, permissoes.py e sigilo.py','Escopo por escritório, perfil e restrição de processo sigiloso.'],
 ['backend/advocacia/tests/test_financeiro.py','Teste de geração/centavos ou rollback. Resultado e CI já executados.'],
],[245,230])

c=clip_page('03');items=selected(c['start'],c['end']);items[0]['screen']='Slide 3: C2 e implantação, percorrendo navegador, frontend, API e banco com o ponteiro.';items[1]['screen']='Slide 4: recorte dos relacionamentos de Cliente, Processo, Contrato, Parcela, Agenda e Documento. Explicar os módulos e o escopo por escritório.';render_scenes(items)
heading('Transição para a demonstração')
para('Termine com: "Com essa estrutura em mente, o Guilherme vai demonstrar o caminho de um cliente e seu processo pela interface". Deixe o slide 4 visível por um instante e corte diretamente para o navegador do clipe 04.')

c=clip_page('05');render_scenes(selected(c['start'],c['end']))
heading('Como apresentar sem perder tempo no editor')
para('Abra os arquivos já nas funções relevantes, com zoom. Siga uma operação concreta em vez de percorrer pastas sem explicar. Mostre o vínculo no DER ao falar dos modelos; retorne ao trecho de permissão e ao financeiro. Não leia caminhos completos em voz alta nem abra o banco real para procurar dados. A montagem deve manter a sua voz contínua durante essas trocas.')

c=clip_page('06');render_scenes(selected(c['start'],c['end']))
heading('Montagem desse bloco')
para('Use a voz de 06B durante os 2:30. Nos primeiros 1:45, cubra sua tela com o vídeo 06A do Guilherme. Aos 16:15 do vídeo final, retire essa sobreposição e mostre sua tela de testes. Resultado salvo e CI são evidência de execução anterior datada; não simule que a suíte inteira rodou durante esses 45 segundos.')
para('IA, e-mail e push dependem de configuração e disponibilidade. Sem resposta ou recebimento reais, ajuste a fala para reconhecer o limite. Não use gravação simulada como comprovação externa.','small')

c=clip_page('08');items=selected(c['start'],c['end']);items[0]['screen']='Slide 6: pronto, limitações e backlog. Identificar RF52 e cobertura frontend abaixo da meta.';items[1]['screen']='Continuar no slide 6 e comentar as dificuldades de isolamento por escritório e consistência das parcelas.';items[2]['screen']='Slide 1, usado como tela final: LexNexo, grupo 038, nomes e agradecimento.';render_scenes(items)
heading('Encerrar dentro do limite')
para('Use o slide 6 ao explicar pendências, dificuldades e próximos passos. Na última cena, de 19:15 a 19:45, volte ao slide 1 e agradeça em nome dos dois. Os 15 segundos até 20:00 são margem; não acrescentem conteúdo para preencher esse espaço. A fala sobre dificuldades e aprendizados deve refletir a experiência real de vocês.')

page('Ordem de montagem e conferência final')
para('Na linha do tempo do editor, a sequência é 01 > 02 > 03 > 04 > 05 > 06 > 07 > 08. Os clipes 06A e 06B formam um único bloco 06. Exportem um único vídeo final; os arquivos separados são material de gravação.')
table(['Faixa de vídeo','Faixa de áudio'],[
 ['01 e 02: slides de Guilherme','Voz de Guilherme'],
 ['03: slides de João','Voz de João'],
 ['04: sistema operado por Guilherme','Voz de Guilherme'],
 ['05: editor e DER de João','Voz de João'],
 ['06, primeiros 1:45: telas 06A de Guilherme','Somente voz de João, arquivo 06B'],
 ['06, últimos 45 s: testes de João','Continuação da voz de João'],
 ['07: slide de resultados','Voz de Guilherme'],
 ['08: limitações e capa final','Voz de João'],
],[270,205])
heading('Assistir ao arquivo exportado antes de enviar')
para('Confiram a duração total de no máximo 20 minutos, volume semelhante entre as vozes, ausência de áudio duplicado no bloco 06 e legibilidade do código. Verifiquem se a criação foi seguida de confirmação, se o fluxo usa o mesmo caso fictício e se as limitações foram ditas sem contradizer a demonstração. Os dois devem participar e os cinco blocos do professor devem estar presentes.')
heading('Referência e uso')
para('Este plano organiza o roteiro detalhado do grupo revisto em 09/11/2026. As ações, falas e limites vêm de docs/tcc/ROTEIRO_VIDEO_PREBANCA_2026.md e da orientação do professor fornecida em PDF. A divisão por integrante foi definida pelo proprietário. Use a apresentação editável entregue com estes roteiros. A execução dos recursos deve ser conferida no ensaio.')
para('Este plano conserva a sequência temporal do roteiro existente, com uma mudança operacional: a explicação inicial do frontend fica no slide 3, e o editor entra no bloco de implementação. Os detalhes por cena podem ser adaptados no ensaio mantendo os cinco blocos, a veracidade da demonstração e o teto de 20 minutos.','small')

def footer(c,doc):
    moldura(c,doc,'Plano de gravação')

out=ROOT/'docs/tcc/TDS-2026-038_Plano_Gravacao_e_Montagem.pdf'
SimpleDocTemplate(str(out),pagesize=(595.276,841.89),leftMargin=60,rightMargin=60,topMargin=70,bottomMargin=48,title='LexNexo Plano de gravação e montagem do vídeo',author='Guilherme Rossato Munhoz e João Henrique Souza Sabino').build(story,onFirstPage=footer,onLaterPages=footer)
(ROOT/'docs/tcc/PLANO_GRAVACAO_E_MONTAGEM.md').write_text('\n'.join(md).rstrip()+'\n')
print(out)
