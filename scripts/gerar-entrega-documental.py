"""Confere e reúne o relatório técnico e o manual, sem executar testes do sistema.

Execute com o runtime de documentos: python scripts/gerar-entrega-documental.py.
Não acessa contas, serviços, credenciais nem dados de produção.
"""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import re
from zipfile import ZipFile
import xml.etree.ElementTree as ET

from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--versao", default="1.13")
args = parser.parse_args()
rt = ROOT / f"docs/tcc/TDS-2026-038_Relatorio_Tecnico_v{args.versao}.pdf"
word = rt.with_suffix(".docx")
manual = ROOT / "docs/Guia-de-Funcionalidades-LexNexo.pdf"
saida = ROOT / f"docs/tcc/TDS-2026-038_Entrega_Documental_v{args.versao}.pdf"
metricas = json.loads((ROOT / "docs/testes/evidencias/metricas-atuais.json").read_text())
ultima = metricas["rodadas"][-1]
assert sum(ultima[k] for k in ["django", "jest", "playwright"]) == ultima["total"]
assert sum(metricas["escopo_playwright_atual"][k] for k in ["navegador", "integracao_http_proxy_sem_ui"]) == ultima["playwright"]

leitores = [PdfReader(rt), PdfReader(manual)]
paginas = [[p.extract_text() or "" for p in r.pages] for r in leitores]
normal = lambda t: re.sub(r"\s+", " ", t).strip()
textos = [normal(" ".join(ps)) for ps in paginas]
for texto in textos:
    for termo in ["TDS-2026-038", "885", "550", "290", "91,85%", "38,03%", "OpenAI", "RF52", "09/11/2026"]:
        assert termo in texto, termo
    assert "LexOffice" not in texto
    assert "44 cenários de navegador" in texto
assert "38 cenários de navegador" not in textos[0]
localizacoes = {}
for nome, termo in {
    "contexto_c1": "Figura 42",
    "containers_c2": "Figura 43",
    "componentes_c3": "Figura 44",
    "implantacao": "Figura 45",
    "autenticacao_totp": "Figura 4 – Sequência de autenticação",
    "calculo_cadastro_prazo": "Figura 5 – Sequência de cálculo",
    "metricas_consolidadas": "2026-11-09 CI final",
}.items():
    achadas = [i + 1 for i, p in enumerate(paginas[0]) if termo in normal(p)]
    assert achadas, nome
    localizacoes[nome] = achadas

ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
with ZipFile(word) as z:
    xml = ET.fromstring(z.read("word/document.xml"))
    texto_word = normal(" ".join(t.text or "" for t in xml.findall(".//w:t", ns)))
    assert "44 cenários de navegador" in texto_word
    assert "38 cenários de navegador" not in texto_word
    cores = set()
    for par in xml.findall(".//w:p", ns):
        estilo = par.find("w:pPr/w:pStyle", ns)
        if estilo is not None and estilo.get("{" + ns["w"] + "}val", "") in ["Title", "Heading1", "Heading2", "Heading3"]:
            cores.update(c.get("{" + ns["w"] + "}val") for c in par.findall(".//w:rPr/w:color", ns))
    assert cores <= {"000000", "auto"}, cores
    hashes_imagens = {sha256(z.read(n)).hexdigest() for n in z.namelist() if n.startswith("word/media/")}
    for nome in ["c4_contexto", "c4_containers", "componentes", "implantacao", "sequencia_autenticacao", "sequencia_agenda"]:
        assert sha256((ROOT / f"docs/tcc/diagramas/{nome}.png").read_bytes()).hexdigest() in hashes_imagens, nome

writer = PdfWriter()
writer.append(leitores[0], outline_item=f"Relatório técnico v{args.versao}")
writer.append(leitores[1], outline_item="Guia de funcionalidades")
writer.add_metadata({
    "/Title": f"LexNexo TDS-2026-038 Relatório técnico v{args.versao} e Guia de funcionalidades",
    "/Author": "Guilherme Rossato Munhoz e João Henrique Souza Sabino",
    "/Subject": "Conferência documental de 11/11/2026; resultados de testes de 09/11/2026; vídeo separado",
})
with saida.open("wb") as f:
    writer.write(f)
completo = PdfReader(saida)
assert len(completo.pages) == sum(len(r.pages) for r in leitores)
originais = paginas[0] + paginas[1]
assert all(normal(p.extract_text() or "") == normal(t) for p, t in zip(completo.pages, originais))

registro = {
    "tipo": "conferencia_documental_sem_reexecucao_das_suites",
    "data_conferencia": "2026-11-11",
    "data_metricas": metricas["atualizado_em"],
    "grupo": "TDS-2026-038",
    "versao_relatorio": args.versao,
    "testes_referencia": ultima,
    "cobertura_referencia": metricas["cobertura"],
    "paginas_relatorio": localizacoes,
    "titulos_cores_explicitas": sorted(cores),
    "diagramas_no_docx": "seis PNGs conferidos por SHA-256",
    "pdf_conjunto": "todas as páginas preservadas em ordem e com texto idêntico aos PDFs de origem",
    "video": "gravacao_e_submissao_nao_verificadas_nesta_conferencia",
    "orbita": "envio_dos_arquivos_atuais_nao_verificado",
    "arquivos": {
        str(p.relative_to(ROOT)): {
            "sha256": sha256(p.read_bytes()).hexdigest(),
            "bytes": p.stat().st_size,
            **({"paginas": len(PdfReader(p).pages)} if p.suffix == ".pdf" else {}),
        } for p in [rt, word, manual, saida]
    },
}
destino = ROOT / "docs/testes/evidencias/2026-11-11/verificacao-documental.json"
destino.parent.mkdir(parents=True, exist_ok=True)
destino.write_text(json.dumps(registro, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"pdf": str(saida), "paginas": len(completo.pages), "conferencias": "aprovadas", "registro": str(destino)}, ensure_ascii=False))
