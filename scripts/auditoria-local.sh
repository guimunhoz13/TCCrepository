#!/usr/bin/env bash
# Suíte completa em cluster PostgreSQL NOVO. Preserva os dados e logs ao sair.
set -euo pipefail
raiz_auditoria=$(cd "$(dirname "$0")/.." && pwd)
cd "$raiz_auditoria"
python_auditoria=${AUDIT_PYTHON:-$raiz_auditoria/backend/ambiente/bin/python}
pg_bin_auditoria=${PG_BIN:-$(dirname "$(command -v initdb || echo /nao-encontrado/initdb)")}
saida_auditoria=${AUDIT_OUTPUT_DIR:-$(mktemp -d /tmp/lexnexo-auditoria.XXXXXX)}
export AUDIT_DB_PORT=${AUDIT_DB_PORT:-55440}
export AUDIT_FRONTEND_PORT=${AUDIT_FRONTEND_PORT:-13000}
porta_api_auditoria=${AUDIT_API_PORT:-18000}
export NEXT_PUBLIC_API_URL="http://127.0.0.1:${porta_api_auditoria}/api"
export E2E_BASE_URL="http://localhost:${AUDIT_FRONTEND_PORT}"
export DJANGO_SETTINGS_MODULE=core.settings_auditoria
export LEXNEXO_ENV_FILE=/dev/null
export COVERAGE_FILE="$saida_auditoria/.coverage"
mkdir -p "$saida_auditoria"
if [[ ! -x "$pg_bin_auditoria/initdb" || ! -x "$python_auditoria" ]]; then
  echo 'Configure PG_BIN e AUDIT_PYTHON; instale as dependências do backend e coverage.' >&2
  exit 1
fi
api_pid_auditoria=''
front_pid_auditoria=''
pg_iniciado_auditoria=false
encerrar_auditoria() {
  [[ -z "$api_pid_auditoria" ]] || kill "$api_pid_auditoria" 2>/dev/null || true
  if [[ -n "$front_pid_auditoria" ]]; then
    kill "$front_pid_auditoria" 2>/dev/null || true
  fi
  if $pg_iniciado_auditoria; then
    "$pg_bin_auditoria/pg_ctl" -D "$saida_auditoria/pgdata" stop -m fast > "$saida_auditoria/pg-stop.log" 2>&1 || true
  fi
}
trap encerrar_auditoria EXIT
rodar_auditoria() {
  local id_auditoria=$1
  shift
  local inicio_auditoria=$SECONDS
  set +e
  "$@" > "$saida_auditoria/$id_auditoria.log" 2>&1
  local codigo_auditoria=$?
  set -e
  printf '%s\t%s\t%s\n' "$id_auditoria" "$codigo_auditoria" "$((SECONDS-inicio_auditoria))" >> "$saida_auditoria/execucoes.tsv"
  echo "$id_auditoria: exit=$codigo_auditoria, $((SECONDS-inicio_auditoria))s"
  if [[ "$codigo_auditoria" -ne 0 ]]; then
    tail -35 "$saida_auditoria/$id_auditoria.log"
    return "$codigo_auditoria"
  fi
}
args_pg_auditoria=()
[[ -z "${PG_SHARE:-}" ]] || args_pg_auditoria=(-L "$PG_SHARE")
rodar_auditoria initdb "$pg_bin_auditoria/initdb" -D "$saida_auditoria/pgdata" "${args_pg_auditoria[@]}" --auth=trust --encoding=UTF8
"$pg_bin_auditoria/pg_ctl" -D "$saida_auditoria/pgdata" -l "$saida_auditoria/postgres.log" -o "-p $AUDIT_DB_PORT -h 127.0.0.1 -k $saida_auditoria" start
pg_iniciado_auditoria=true
"$pg_bin_auditoria/createdb" -h 127.0.0.1 -p "$AUDIT_DB_PORT" lexnexo_auditoria
cd backend
rodar_auditoria pip-check "$python_auditoria" -m pip check
rodar_auditoria check "$python_auditoria" manage.py check
rodar_auditoria migrations "$python_auditoria" manage.py makemigrations --check --dry-run
rodar_auditoria backend "$python_auditoria" -m coverage run --branch --source=advocacia --omit='*/tests/*,*/migrations/*' manage.py test --verbosity=2
rodar_auditoria cobertura-backend "$python_auditoria" -m coverage json -o "$saida_auditoria/cobertura-backend.json"
rodar_auditoria openapi "$python_auditoria" manage.py spectacular --validate --fail-on-warn --file "$saida_auditoria/openapi.yml"
rodar_auditoria migrate "$python_auditoria" manage.py migrate --noinput
rodar_auditoria seed "$python_auditoria" manage.py popular_demo
"$python_auditoria" manage.py runserver "127.0.0.1:$porta_api_auditoria" --noreload > "$saida_auditoria/api.log" 2>&1 &
api_pid_auditoria=$!
cd ../frontend
rodar_auditoria npm-ci npm ci
rodar_auditoria lint npm run lint -- --max-warnings=0
rodar_auditoria jest npm test -- --runInBand --coverage --collectCoverageFrom='src/**/*.{js,jsx}' --coverageReporters=json-summary --json --outputFile="$saida_auditoria/jest.json"
cp coverage/coverage-summary.json "$saida_auditoria/cobertura-frontend.json"
rodar_auditoria build npm run build
# exec faz o PID corresponder ao servidor que será encerrado no trap.
node node_modules/next/dist/bin/next start -p "$AUDIT_FRONTEND_PORT" > "$saida_auditoria/frontend.log" 2>&1 &
front_pid_auditoria=$!
for tentativa_auditoria in $(seq 1 60); do
  if curl --fail --silent --output /dev/null "$E2E_BASE_URL/login" && curl --fail --silent --output /dev/null "$NEXT_PUBLIC_API_URL/health/"; then
    break
  fi
  sleep 1
done
rodar_auditoria e2e npx playwright test --reporter=json --trace=off
cp "$saida_auditoria/e2e.log" "$saida_auditoria/e2e.json"
echo "Evidências locais: $saida_auditoria (não publicar tokens, logs de servidor nem pgdata)."
