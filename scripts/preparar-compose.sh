#!/usr/bin/env bash
# Recria no Codespaces o contexto da mesma imagem estática usada no LabEx.
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

(
  cd "$raiz/frontend"
  npm ci --no-audit --no-fund
  NEXT_OUTPUT=export npm run build
)

contexto="$raiz/.compose-build"
rm -rf "$contexto"
mkdir -p "$contexto"
cp "$raiz/frontend/Dockerfile.labex" "$contexto/Dockerfile"
cp "$raiz/frontend/nginx.labex.conf" "$contexto/nginx.labex.conf"
cp -a "$raiz/frontend/out" "$contexto/out"

echo "Contexto da imagem pronto em $contexto"
