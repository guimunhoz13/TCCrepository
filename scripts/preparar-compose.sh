#!/usr/bin/env bash
# Extrai o contexto de build preservado da atividade anterior no LabEx.
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
contexto="$raiz/.compose-build"
arquivo="$raiz/docker/lexnexo-labex-context.tar.gz"

test -f "$arquivo" || { echo "Contexto do LabEx não encontrado: $arquivo" >&2; exit 1; }
rm -rf "$contexto"
mkdir -p "$contexto"
tar -xzf "$arquivo" -C "$contexto"

echo "Contexto original do LabEx pronto em $contexto"
