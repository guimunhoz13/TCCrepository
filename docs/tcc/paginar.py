"""Segunda passada do sumário: acha em que página do PDF cada título aparece.

    node main.js && soffice --headless --convert-to pdf RT-TDS-2026-39_v1.1.docx
    python3 paginar.py RT-TDS-2026-39_v1.1.pdf && node main.js
"""
import json
import re
import subprocess
import sys

pdf = sys.argv[1]
titulos = json.loads(subprocess.check_output(
    ["node", "-e", "console.log(JSON.stringify(require('./gerar_rt.js').TITULOS_SUMARIO))"]
))
total = int(re.search(r"Pages:\s+(\d+)", subprocess.check_output(["pdfinfo", pdf], text=True)).group(1))
paginas_texto = [
    subprocess.check_output(["pdftotext", "-f", str(n), "-l", str(n), "-layout", pdf, "-"], text=True)
    for n in range(1, total + 1)
]

def normal(t):
    return re.sub(r"\s+", " ", t).strip()

resultado = {}
inicio = 3  # pula capa, resumo e o próprio sumário
for titulo, _ in titulos:
    alvo = normal(titulo)
    for n in range(inicio, total + 1):
        linhas = [normal(l) for l in paginas_texto[n - 1].splitlines()]
        # Linhas do próprio sumário têm pontilhado e número no fim: ignorar.
        if any(
            (l == alvo or l.startswith(alvo))
            and "..." not in l and "…" not in l and not re.search(r"\s(\d+|\?)$", l)
            for l in linhas
        ):
            resultado[titulo] = n
            inicio = n
            break
    else:
        print("não achei:", titulo)
json.dump(resultado, open("paginas.json", "w"), ensure_ascii=False, indent=1)
print(f"{len(resultado)}/{len(titulos)} títulos paginados; {total} páginas")
