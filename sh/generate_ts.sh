#!/bin/bash
set -euo pipefail

usage() {
    echo "Использование: $0 <входной_файл.py> <выходной_файл.tsx>"
    exit 1
}

[ $# -ne 2 ] && usage

INPUT="$1"
OUTPUT="$2"

[ -f "$INPUT" ] || { echo "Ошибка: входной файл '$INPUT' не найден." >&2; exit 1; }

command -v pydantic2ts >/dev/null 2>&1 || { echo "pydantic2ts не найден." >&2; exit 1; }

PYTHON_BIN=$(head -1 "$(command -v pydantic2ts)" | sed 's/^#!//')
[ -z "$PYTHON_BIN" ] && PYTHON_BIN="python3"

MODELS_DIR="$(dirname "$(realpath "$INPUT")")"
INTERNAL_FILE="$MODELS_DIR/internal.py"

# Корень backend — на уровень выше models
BACKEND_DIR="$(dirname "$MODELS_DIR")"

EXCLUDE_ARGS=""
if [ -f "$INTERNAL_FILE" ]; then
    echo "Обнаружен internal.py: $INTERNAL_FILE" >&2

    # PYTHONPATH позволяет резолвить ..internal при извлечении моделей
    INTERNAL_MODELS=$(PYTHONPATH="$BACKEND_DIR" "$PYTHON_BIN" - "$MODELS_DIR" << 'PYEOF'
import sys, json, importlib.util
from pathlib import Path
from pydantic import BaseModel

models_dir = sys.argv[1]
internal_path = Path(models_dir) / "internal.py"

spec = importlib.util.spec_from_file_location("internal", internal_path)
internal = importlib.util.module_from_spec(spec)
sys.modules["internal"] = internal
spec.loader.exec_module(internal)

models = []
for name, obj in vars(internal).items():
    if isinstance(obj, type) and issubclass(obj, BaseModel) and obj is not BaseModel:
        models.append(name)

print(json.dumps(models))
PYEOF
    )

    if [ $? -eq 0 ] && [ -n "$INTERNAL_MODELS" ]; then
        MODELS_LIST=$(echo "$INTERNAL_MODELS" | python3 -c "import sys,json; print(' '.join(json.load(sys.stdin)))")
        echo "Модели для исключения: $MODELS_LIST" >&2
        for model in $MODELS_LIST; do
            EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude $model"
        done
    else
        echo "Не удалось извлечь модели из internal.py, продолжаем без исключений." >&2
    fi
else
    echo "internal.py не найден, проверялся путь: $INTERNAL_FILE" >&2
fi

JSON2TS_CMD=""
if command -v json2ts >/dev/null 2>&1; then
    JSON2TS_CMD="json2ts"
elif command -v npx >/dev/null 2>&1; then
    JSON2TS_CMD="npx json-schema-to-typescript"
else
    echo "Установите json-schema-to-typescript или npx" >&2
    exit 1
fi

echo "Конвертация '$INPUT' -> '$OUTPUT' ..."
PYTHONPATH="$BACKEND_DIR" pydantic2ts \
    --module "$INPUT" \
    --output "$OUTPUT" \
    --json2ts-cmd "$JSON2TS_CMD" \
    $EXCLUDE_ARGS

echo "Готово. Результат записан в '$OUTPUT'."
