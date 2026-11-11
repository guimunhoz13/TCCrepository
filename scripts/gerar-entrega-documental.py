"""Confere o relatório técnico independente e a consistência com o manual separado.

Execute com o runtime de documentos: python scripts/gerar-entrega-documental.py.
Não junta o guia ao relatório, não executa testes e não acessa produção.
"""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import re
from zipfile import ZipFile
import xml.etree.ElementTree as ET

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--versao', default='1.14')
args = parser.parse_args()
rt = ROOT / f'docs/tcc/TDS-2026-038_Relatorio_Tecnico_v{args.versao}.pdf'
word = rt.with_suffix('.docx')
manual = ROOT / 'docs/Guia-de-Funcionalidades-LexNexo.pdf'
metricas = json.loads((ROOT / 'docs/testes/evidencias/metricas-atuais.json').read_text())
ultima = metricas['rodadas'][-1]
assert sum(ultima[k] for k in ['django', 'jest', 'playwright']) == ultima['total']
assert sum(metricas['escopo_playwright_atual'][k] for k in ['navegador', 'integracao_http_proxy_sem_ui']) == ultima['playwright']
execucoes = json.loads((ROOT / 'docs/testes/evidencias' / metricas['fonte_atual']).read_text())
assert execucoes['backend']['testes'] == ultima['django']
assert execucoes['jest']['numPassedTests'] == ultima['jest'] and execucoes['jest']['numFailedTests'] == 0
assert execucoes['playwright']['expected'] == ultima['playwright'] and execucoes['playwright']['unexpected'] == 0
assert all(c['exit_code'] == 0 for c in execucoes['comandos'])

leitores = [PdfReader(rt), PdfReader(manual)]
paginas = [[p.extract_text() or '' for p in r.pages] for r in leitores]
normal = lambda t: re.sub(r'\s+', ' ', t).strip()
textos = [normal(' '.join(ps)) for ps in paginas]
for texto in textos:
    termos = ['TDS-2026-038', *[str(ultima[k]) for k in ['total', 'django', 'jest']],
              metricas['cobertura']['backend_linhas'], metricas['cobertura']['frontend_linhas'],
              'OpenAI', 'RF52', '11/11/2026', '44 cenários de navegador']
    for termo in termos:
        assert termo in texto, termo
    assert 'LexOffice' not in texto
assert '38 cenários de navegador' not in textos[0]
assert len(leitores[0].pages) < 90, 'O relatório deve estar separado do guia.'
assert 'Apêndice D Revisão prática' not in textos[0], 'Guia indevidamente incorporado.'
localizacoes = {}
for nome, termo in {
    'contexto_c1': 'Figura 42',
    'containers_c2': 'Figura 43',
    'componentes_c3': 'Figura 44',
    'implantacao': 'Figura 45',
    'autenticacao_totp': 'Figura 4 – Sequência de autenticação',
    'calculo_cadastro_prazo': 'Figura 5 – Sequência de cálculo',
    'metricas_consolidadas': '2026-11-11 local',
    'ampliacao_frontend': 'A ampliação de 11/11 acrescentou 66 casos',
}.items():
    achadas = [i + 1 for i, p in enumerate(paginas[0]) if termo in normal(p)]
    assert achadas, nome
    localizacoes[nome] = achadas

ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(word) as z:
    xml = ET.fromstring(z.read('word/document.xml'))
    texto_word = normal(' '.join(t.text or '' for t in xml.findall('.//w:t', ns)))
    for termo in ['44 cenários de navegador', '951', '356', '72,22%', '3339 de 4623', 'meta de 70%']:
        assert termo in texto_word, termo
    cores = set()
    for par in xml.findall('.//w:p', ns):
        estilo = par.find('w:pPr/w:pStyle', ns)
        if estilo is not None and estilo.get('{' + ns['w'] + '}val', '') in ['Title', 'Heading1', 'Heading2', 'Heading3']:
            cores.update(c.get('{' + ns['w'] + '}val') for c in par.findall('.//w:rPr/w:color', ns))
    assert cores <= {'000000', 'auto'}, cores
    styles = ET.fromstring(z.read('word/styles.xml'))
    for estilo in styles.findall('w:style', ns):
        if estilo.get('{' + ns['w'] + '}styleId') in ['Title', 'Heading1', 'Heading2', 'Heading3']:
            cor = estilo.find('w:rPr/w:color', ns)
            assert cor is not None and cor.get('{' + ns['w'] + '}val') == '000000'
    indice = json.loads((ROOT / 'docs/tcc/paginas.json').read_text())
    paragrafos = [''.join(t.text or '' for t in par.findall('.//w:t', ns)) for par in xml.findall('.//w:p', ns)]
    inicio = paragrafos.index('SUMÁRIO') + 1
    assert len(indice) == 64
    assert all(paragrafos[inicio + i] == titulo + "\t" + str(pagina) for i, (titulo, pagina) in enumerate(indice.items())), 'Sumário do Word desatualizado.'
    hashes = {sha256(z.read(n)).hexdigest() for n in z.namelist() if n.startswith('word/media/')}
    for nome in ['c4_contexto', 'c4_containers', 'componentes', 'implantacao', 'sequencia_autenticacao', 'sequencia_agenda']:
        assert sha256((ROOT / f'docs/tcc/diagramas/{nome}.png').read_bytes()).hexdigest() in hashes, nome

registro = {
    'tipo': 'conferencia_relatorio_independente_com_evidencias_de_testes_executados_separadamente',
    'data_conferencia': '2026-11-11',
    'data_metricas': metricas['atualizado_em'],
    'grupo': 'TDS-2026-038',
    'versao_relatorio': args.versao,
    'testes_referencia': ultima,
    'cobertura_referencia': metricas['cobertura'],
    'paginas_relatorio': localizacoes,
    'titulos_cores_explicitas': sorted(cores),
    'diagramas_no_docx': 'seis PNGs conferidos por SHA-256',
    'sumario': '64/64 entradas do Word correspondem ao mapeamento de páginas do PDF renderizado',
    'guia': 'arquivo independente; métricas sincronizadas; não anexado ao relatório',
    'video': 'gravacao_e_submissao_nao_verificadas',
    'orbita': 'envio_dos_arquivos_atuais_nao_verificado',
    'arquivos': {
        str(p.relative_to(ROOT)): {
            'sha256': sha256(p.read_bytes()).hexdigest(), 'bytes': p.stat().st_size,
            **({'paginas': len(PdfReader(p).pages)} if p.suffix == '.pdf' else {}),
        } for p in [rt, word, manual]
    },
}
destino = ROOT / f'docs/testes/evidencias/2026-11-11/verificacao-relatorio-v{args.versao}.json'
destino.write_text(json.dumps(registro, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'relatorio': str(rt), 'paginas': len(leitores[0].pages), 'conferencias': 'aprovadas', 'registro': str(destino)}, ensure_ascii=False))
