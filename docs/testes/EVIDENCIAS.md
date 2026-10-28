# Evidências e reprodução

Auditoria executada em **27/10/2026**, America/Sao_Paulo. Commit base
`8b41a295e0d7be677600295eb56537bb2c0f871e`, branch main. Os testes incluem o
diff local desta auditoria; não existe commit novo que identifique essas mudanças.

## Índice de evidências sanitizadas

| Arquivo | Conteúdo e origem |
|---|---|
| [ambiente.json](evidencias/ambiente.json) | Versões, banco e limites do scan heurístico de segredos |
| [execucoes.json](evidencias/execucoes.json) | Exit codes e tempos da rodada integrada; reteste após atualização do ambiente |
| [casos-executados.json](evidencias/casos-executados.json) | 532 casos Django, 275 Jest e 34 Playwright; cada caso identifica seu arquivo |
| [operacoes-api.json](evidencias/operacoes-api.json) | 166 operações canônicas extraídas do schema validado |
| [cobertura-backend.json](evidencias/cobertura-backend.json) | coverage.py: totais, resumo por arquivo e linhas/ramos ausentes; listas de execução foram removidas para reduzir volume |
| [cobertura-frontend.json](evidencias/cobertura-frontend.json) | Istanbul/Jest, incluindo todos os arquivos JS/JSX de src, mesmo sem importação pelos testes |
| [dependencias.json](evidencias/dependencias.json) | Inventário de alertas antes/depois; diferenças entre resolução nova e ambiente instalado |
| [regressoes.txt](evidencias/regressoes.txt) | Resumos reais das falhas anteriores e retestes direcionados |
| [desempenho-local.json](evidencias/desempenho-local.json) | 12 amostras por endpoint com APIClient e captura de SQL, somente local |
| [pratico-prazos.png](evidencias/pratico-prazos.png) | Dois prazos sintéticos na conta autorizada, após novo login |
| [pratico-modelo.png](evidencias/pratico-modelo.png) | Preview de declaração com variáveis substituídas por dados sintéticos |
| [regressao-dashboard-2026-10-28.json](evidencias/regressao-dashboard-2026-10-28.json) | Complemento de 28/10: reprodução da troca de densidade, build/lint/Jest, 36 E2E e hashes dos arquivos da correção A13 |
| [git-estado-final.txt](evidencias/git-estado-final.txt) | Estado final do Git; inclui alterações anteriores do usuário |

Logs HTTP, traces com headers, screenshots de falhas que possam conter
credenciais, conteúdo de `.env`, pgdata e tokens não foram copiados ao Git.
Os logs brutos desta sessão ficaram em `/tmp/tcc-*`, que é armazenamento
temporário da máquina e não uma evidência permanente compartilhável. Os
resumos acima são os artefatos duráveis. O catálogo de todos os casos fica em
[INVENTARIO_E_CASOS.md](INVENTARIO_E_CASOS.md).

## Baseline e estados anteriores

Antes de corrigir produto: 519 testes Django aprovados em 35,102 s; 268 Jest
aprovados em 12,980 s; lint sem avisos; build Next concluído; 26 cenários
Playwright aprovados em 70,241 s. O banco foi criado especificamente para
esta execução e a configuração auditável foi adicionada antes dos testes.

O baseline de linhas era 91,48% no backend e 34,43% no frontend. A cobertura
final não deve ser comparada apenas pela diferença percentual: testes novos
e código novo também alteraram o denominador.

Uma rodada intermediária E2E apresentou três falhas: expectativa incorreta
de URL após logout e dois problemas de isolamento/sincronização dos próprios
testes (preferências e rascunho prévio). Foram corrigidos sem remover as
asserções de proteção, persistência e validação. Uma execução isolada durante
troca de build apontou indisponibilidade de infraestrutura; não foi usada
como prova de defeito de data. As regressões reproduzidas e corrigidas estão
documentadas em DEFEITOS_E_RISCOS.md.

## Ambiente

Linux x86_64, Python 3.14.7, Django 6.0.8, DRF 3.18.2, PostgreSQL 18.6,
Node 22.23.2, npm 10.9.8, Next 16.4.2, React 19.2.4, coverage 7.17.0.
Chromium do Playwright, projetos computador e celular Pixel 7, locale pt-BR e
timezone America/Sao_Paulo. Docker não estava ativo; foram usados binários
PostgreSQL já disponíveis na máquina. CI declara Python 3.12/PostgreSQL 16,
portanto essa combinação exata do CI não foi executada localmente.

Na descoberta, `.github/workflows/ci.yml` já estava modificado, e existiam
arquivos não rastreados de slides, atividades Docker, segurança, imagens e
o próprio prompt. Essas mudanças não foram removidas. O workflow não foi
editado nesta auditoria. Relatórios históricos de segurança receberam apenas
nota de contexto e link para a validação atual.

## Rodada integrada reproduzível

Instale dependências em ambiente Python compatível e use os binários
PostgreSQL da sua instalação. coverage e Chromium são ferramentas de teste.
O script cria **cluster novo**, banco exclusivo, dados fictícios, servidores
de teste e encerra os próprios processos ao terminar. Não apaga o cluster ou
os registros da conta publicada. Não o aponte para serviços de produção.

```bash
backend/ambiente/bin/python -m pip install -r backend/requirements.txt coverage pip-audit
cd frontend
npm ci
npx playwright install chromium
cd ..
PG_BIN=/caminho/postgresql/bin \
AUDIT_PYTHON="$PWD/backend/ambiente/bin/python" \
bash scripts/auditoria-local.sh
```

Se PostgreSQL estiver extraído fora dos diretórios do sistema, informe também
PG_SHARE e, quando necessário, LD_LIBRARY_PATH. O script falha sem substituir
arquivos existentes caso o diretório pgdata já exista. Prefira o diretório
temporário novo criado automaticamente. Portas padrão: PostgreSQL 55440,
API 18000, frontend 13000. Personalize AUDIT_DB_PORT, AUDIT_API_PORT e
AUDIT_FRONTEND_PORT antes de iniciar, garantindo que estão livres.

Nesta máquina foi usado PG_BIN em
`/tmp/lexnexo-postgres.l5tGP7/runtime/usr/bin` e PG_SHARE em
`/tmp/lexnexo-postgres.l5tGP7/runtime/usr/share/postgresql`, com a biblioteca
extraída correspondente. São caminhos temporários desta execução, não
dependências do repositório. A rodada durável foi resumida a partir de
`/tmp/tcc-auditoria-entrega`.

## Comandos individuais efetivamente usados

Com PostgreSQL local exclusivo preparado na porta 55439:

```bash
cd backend
ambiente/bin/python -m pip check
ambiente/bin/python manage.py check --settings=core.settings_auditoria
ambiente/bin/python manage.py makemigrations --check --dry-run --settings=core.settings_auditoria
COVERAGE_FILE=/tmp/lexnexo.coverage ambiente/bin/python -m coverage run \
  --branch --source=advocacia --omit='*/tests/*,*/migrations/*' \
  manage.py test --settings=core.settings_auditoria --verbosity=2
COVERAGE_FILE=/tmp/lexnexo.coverage ambiente/bin/python -m coverage json -o /tmp/cobertura-backend.json
ambiente/bin/python manage.py spectacular --validate --fail-on-warn \
  --settings=core.settings_auditoria --file /tmp/openapi.yml
```

Deploy check foi executado com `LEXNEXO_ENV_FILE=/dev/null DEBUG=False`, uma
SECRET_KEY descartável longa e ALLOWED_HOSTS de exemplo, usando core.settings.
Comando: `python manage.py check --deploy --fail-level WARNING`. Resultado:
nenhum aviso não silenciado; security.W021 (preload HSTS) é silenciado pelo
projeto deliberadamente. Isso não verifica a configuração real de Render/Vercel.

```bash
cd frontend
npm ci
npm run lint -- --max-warnings=0
npm test -- --runInBand --coverage --collectCoverageFrom='src/**/*.{js,jsx}'
npm run build
npx playwright test --reporter=json --trace=off
npm audit --omit=dev --json
npm audit --json
npm audit --audit-level=high
cd ..
backend/ambiente/bin/python -m pip_audit -r backend/requirements.txt
backend/ambiente/bin/python -m pip_audit --local
backend/ambiente/bin/python scripts/medir-api-auditoria.py
backend/ambiente/bin/python scripts/documentar-auditoria.py /tmp/diretorio-da-rodada
```

O script de medição cria 20 processos sintéticos apenas no banco local
lexnexo_auditoria e não apaga os dados. APIClient mede o processo Django;
essas latências não incluem rede/SSL/navegador e não representam produção.

## Retomar o que está bloqueado

- Entrega externa: staging com SMTP capturado, dispositivo push e logs de
  entrega; confirmar destinatários/custos antes de ativar provedores reais.
- IA/CNJ/storage: usar credenciais de teste, dados fictícios e limites; não
  reutilizar documentos jurídicos reais. Testes locais de falha/mocks já passam.
- Supabase e recuperação: revisão administrativa autorizada de grants/RLS,
  buckets, backups e restauração em clone; nenhuma alteração remota de SQL foi feita.
- Abertura de anexo: repetir PR14 em Chrome/Firefox com popups permitidos e
  observar o arquivo, não apenas o clique. Nenhum download foi inventado.
- Firefox/WebKit: instalar navegadores/dependências e adicionar projetos ao
  Playwright; não há resultado desses browsers nesta rodada.
- Usabilidade: aplicar `docs/TESTE-DE-USABILIDADE.md` com participantes e
  consentimento; registrar tarefas, falhas, tempos e SUS reais.
- Produção: revisar/publicar correções sob autorização própria e repetir
  smoke tests; os registros AUDITORIA TCC devem continuar preservados.
