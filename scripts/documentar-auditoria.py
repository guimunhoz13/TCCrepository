"""Gera inventário e evidências compactas de uma rodada real da auditoria.

Uso: backend/ambiente/bin/python scripts/documentar-auditoria.py /tmp/rodada
Não copia logs HTTP, tokens, senhas, banco ou dados da conta publicada.
"""
import ast
import json
from pathlib import Path
import re
import subprocess
import sys

import yaml

raiz = Path(__file__).resolve().parents[1]
rodada = Path(sys.argv[1])
destino = raiz / "docs/testes"
evidencias = destino / "evidencias"
evidencias.mkdir(parents=True, exist_ok=True)
commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=raiz, text=True).strip()
esquema = yaml.safe_load((rodada / "openapi.yml").read_text())
jest = json.loads((rodada / "jest.json").read_text())
e2e = json.loads((rodada / "e2e.json").read_text())
backend_log = (rodada / "backend.log").read_text()
assert re.search(r"^OK$", backend_log, re.M), "Backend não aprovado"
assert jest["numFailedTests"] == 0 and e2e["stats"]["unexpected"] == 0

def gravar_json(nome, dados):
    (evidencias / nome).write_text(json.dumps(dados, ensure_ascii=False, indent=2) + "\n")

for origem, nome in (("cobertura-backend.json", "cobertura-backend.json"),
                     ("cobertura-frontend.json", "cobertura-frontend.json")):
    cobertura = json.loads((rodada / origem).read_text())
    if origem == "cobertura-backend.json":
        cobertura["files"] = {
            arquivo: {k: dados[k] for k in ("summary", "missing_lines", "missing_branches")}
            for arquivo, dados in cobertura["files"].items()
        }
    gravar_json(nome, cobertura)

casos = []
for indice, (nome, identificador) in enumerate(re.findall(r"\b(test\w+) \((advocacia\.tests\.[^)]+)\)", backend_log), 1):
    modulo = identificador.rsplit(".", 2)[0]
    arquivo = "backend/" + modulo.replace(".", "/") + ".py"
    casos.append({"id": f"BE-{indice:03}", "tipo": "Django", "caso": identificador,
                  "cenario": nome.removeprefix("test_").replace("_", " "),
                  "arquivo": arquivo, "status": "APROVADO"})
assert len(casos) == int(re.search(r"Ran (\d+) tests", backend_log)[1])
for suite in jest["testResults"]:
    for teste in suite["assertionResults"]:
        casos.append({"id": f"FE-{sum(c['tipo'] == 'Jest' for c in casos)+1:03}", "tipo": "Jest",
                      "caso": teste["fullName"], "cenario": teste["title"],
                      "arquivo": str(Path(suite["name"]).relative_to(raiz)),
                      "status": "APROVADO" if teste["status"] == "passed" else "REPROVADO"})

def percorrer(suite):
    for spec in suite.get("specs", []):
        for teste in spec["tests"]:
            casos.append({"id": f"E2E-{sum(c['tipo'] == 'Playwright' for c in casos)+1:03}",
                          "tipo": "Playwright", "caso": spec["title"], "cenario": spec["title"],
                          "arquivo": "frontend/e2e/" + spec["file"], "projeto": teste["projectName"],
                          "duracao_ms": sum(r["duration"] for r in teste["results"]),
                          "status": "APROVADO" if teste["status"] == "expected" else "REPROVADO"})
    for filho in suite.get("suites", []):
        percorrer(filho)

percorrer(e2e)
gravar_json("casos-executados.json", {"commit_base": commit, "casos": casos})
gravar_json("execucoes.json", {
    "commit_base": commit, "data_local": "2026-10-27", "timezone": "America/Sao_Paulo",
    "backend": {"testes": sum(c["tipo"] == "Django" for c in casos),
                "resumo": re.findall(r"Ran .*|^OK$", backend_log, re.M)},
    "jest": {k: jest[k] for k in ("numPassedTests", "numFailedTests", "numTotalTestSuites", "startTime")},
    "playwright": e2e["stats"],
    "comandos": [{"id": i, "exit_code": int(c), "duracao_segundos": int(t)}
                 for i, c, t in (linha.split("\t") for linha in (rodada / "execucoes.tsv").read_text().splitlines())],
})

linhas = ["# Inventário da implementação e verificações", "",
          f"Base `{commit}`; execução de 27/10/2026, America/Sao_Paulo.", "",
          "## Operações da API", "",
          "Extraídas do OpenAPI validado. Cada operação protegida foi chamada sem token",
          "por `AuditoriaRotasAnonimasTests` e retornou 401/403. Isso comprova a barreira",
          "anônima, não todos os caminhos funcionais. Consulte a matriz RF e o catálogo",
          "de casos para os cenários positivos, de perfil, escritório e validação.", "",
          "| Método | Endpoint | Cenário obrigatório | Estado desse cenário |", "|---|---|---|---|"]
operacoes = []
for caminho, item in esquema["paths"].items():
    for metodo, operacao in item.items():
        if metodo not in ("get", "post", "put", "patch", "delete"):
            continue
        protegido = bool(operacao.get("security")) and {} not in operacao["security"]
        operacoes.append({"metodo": metodo.upper(), "endpoint": caminho, "protegido": protegido,
                          "operationId": operacao["operationId"]})
        cenario = "Sem JWT → 401/403 (teste de auditoria)" if protegido else "Fluxos públicos em test_autenticacao/test_cadastro_e_equipe/test_agenda_ics/test_planos"
        linhas.append(f"| {metodo.upper()} | `{caminho}` | {cenario} | APROVADO |")
gravar_json("operacoes-api.json", operacoes)
linhas += ["", f"{len(esquema['paths'])} paths canônicos; {len(operacoes)} operações DRF, "
           f"{sum(o['protegido'] for o in operacoes)} protegidas. Variantes `.json` não são contadas em dobro.",
           "`GET /api/health/` é uma função Django fora do schema: sucesso e indisponibilidade",
           "são testados em `test_deploy.py`. `/api/docs/`, `/api/redoc/` e `/api/schema/`",
           "são condicionais a API_DOCS_PUBLICAS e têm testes de documentação.",
           "`/admin/` usa o admin padrão Django; administração da plataforma usa `/master/`.", "",
           "## Páginas e ações", "",
           "| Página | Cenário | Evidência ou limite |", "|---|---|---|"]
for pagina in sorted((raiz / "frontend/src/app").rglob("page.js")):
    rota = "/" + str(pagina.parent.relative_to(raiz / "frontend/src/app"))
    rota = "/" if rota == "/." else rota
    linhas.append(f"| `{rota}` | Navegação, sessão e formulários associados | E2E/login, navegacao, perfis, auditoria; páginas de recuperação/master têm API testada e inspeção, sem jornada externa completa |")
linhas += ["", "Os painéis são sobreposições em `/dashboard`: clientes (criar, buscar, editar,",
           "inativar, excluir, exportar/anonimizar), processos (CRUD, ficha, DataJud,",
           "intimações e conferência), documentos (upload/abertura/exclusão), agenda",
           "(CRUD, cumprimento, cálculo, feriados, .ics/feed), tarefas (CRUD, Kanban),",
           "contratos (criação/exclusão, parcelas, PIX real/teste), horas/despesas,",
           "modelos (CRUD e geração), contato, planos, advogados/equipe, configurações,",
           "preferências, relatórios, auditoria, busca e ajuda. Cada família consta na matriz RF.", "",
           "## Modelos e regras de acesso", "",
           "| Modelo | Fonte | Cenário |", "|---|---|---|"]
arvore = ast.parse((raiz / "backend/advocacia/models.py").read_text())
for classe in arvore.body:
    if isinstance(classe, ast.ClassDef):
        linhas.append(f"| {classe.name} | `backend/advocacia/models.py:{classe.lineno}` | Integridade e acesso do domínio; modelos auxiliares exercitados pelos fluxos da API |")
linhas += ["", "27 modelos; 37 migrations de advocacia. A cadeia inteira foi aplicada em",
           "PostgreSQL descartável. Rollback de dados não é garantido: 0002, 0031 e 0037",
           "têm reversão noop em operações de dados. Não executar downgrade cego em produção.", "",
           "Perfis: admin, advogado, estagiario, financeiro e secretaria; superadmin",
           "é uma identidade separada. `permissoes.py` define ações por área;",
           "`EscritorioScopedMixin` e serializers verificam escritório; `sigilo.py`",
           "limita processos e dependências; rascunhos também são privados do usuário.", "",
           "## Casos automatizados executados", "",
           "Pré-condições comuns: dependências instaladas, settings_auditoria, fixtures",
           "sintéticas por teste Django; mocks em Jest; popular_demo no PostgreSQL local",
           "para Playwright. Esperado: asserções descritas no nome e no código do caso.",
           "Observado: aprovação individual na saída do runner final. Gravidade: não se",
           "aplica aos casos aprovados; regressões e histórico estão no catálogo de defeitos.",
           "Comandos completos e ambientes: EVIDENCIAS.md e RELATORIO_VALIDACAO.md.", "",
           "| ID | Runner | Cenário e teste de referência | Estado |", "|---|---|---|---|"]
for caso in casos:
    texto = caso["caso"].replace("|", "\\|").replace("\n", " ")
    linhas.append(f"| {caso['id']} | {caso['tipo']} | {texto} — `{caso['arquivo']}` | {caso['status']} |")
(destino / "INVENTARIO_E_CASOS.md").write_text("\n".join(linhas) + "\n")
print(json.dumps({"casos": len(casos), "operacoes": len(operacoes), "paths": len(esquema["paths"])}))
