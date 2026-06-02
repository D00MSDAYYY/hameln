import os
from collections import deque
from pathlib import Path

from fastapi import HTTPException, Response


MAX_LINES = 2000
DEFAULT_LINES = 500


def _backend_dir() -> Path:
    backend_dir = Path(os.getenv("BACKEND_DIR", ".")).expanduser()
    if not backend_dir.is_absolute():
        backend_dir = Path.cwd() / backend_dir
    return backend_dir.resolve()


def _log_path(log_source: str) -> Path:
    backend_dir = _backend_dir()
    project_dir = backend_dir.parent

    paths = {
        "backend": backend_dir / "backend.log",
        "frontend": project_dir / "frontend" / "frontend.log",
    }

    if log_source not in paths:
        raise HTTPException(status_code=404, detail="Неизвестный лог")

    return paths[log_source]


def _read_last_lines(path: Path, lines: int) -> str:
    if not path.exists():
        return f"Файл лога не найден: {path}"

    with path.open("r", encoding="utf-8", errors="replace") as file:
        return "".join(deque(file, maxlen=lines)) or "Лог пуст"


def f(log_source: str, lines: int = DEFAULT_LINES):
    lines = max(1, min(lines, MAX_LINES))
    content = _read_last_lines(_log_path(log_source), lines)

    return Response(content=content, media_type="text/plain; charset=utf-8")
