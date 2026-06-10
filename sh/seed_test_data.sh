#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"

cd "$BACKEND_DIR"

if [ ! -x ".venv/bin/python" ]; then
    echo "backend/.venv не найден. Сначала запустите ./run.sh"
    exit 1
fi

.venv/bin/python seed_test_data.py
