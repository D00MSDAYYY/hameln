from collections import deque
from pathlib import Path

from fastapi import HTTPException

from server.settings.settings import Settings
from ._log_reader import LogReader


MAX_LOG_LINES = 2000


class FileLogReader(LogReader):
    def __init__(self, settings: Settings) -> None:
        self._backend_dir = self._resolve_backend_dir(settings.backend_dir)

    def read(self, log_source: str, lines: int) -> str:
        lines = max(1, min(lines, MAX_LOG_LINES))
        return self._read_last_lines(self._log_path(log_source), lines)

    @staticmethod
    def _resolve_backend_dir(backend_dir_value: str) -> Path:
        backend_dir = Path(backend_dir_value).expanduser()
        if not backend_dir.is_absolute():
            backend_dir = Path.cwd() / backend_dir
        return backend_dir.resolve()

    def _log_path(self, log_source: str) -> Path:
        project_dir = self._backend_dir.parent
        paths = {
            "backend": self._backend_dir / "backend.log",
            "frontend": project_dir / "frontend" / "frontend.log",
        }

        if log_source not in paths:
            raise HTTPException(status_code=404, detail="Неизвестный лог")

        return paths[log_source]

    @staticmethod
    def _read_last_lines(path: Path, lines: int) -> str:
        if not path.exists():
            return f"Файл лога не найден: {path}"

        with path.open("r", encoding="utf-8", errors="replace") as file:
            return "".join(deque(file, maxlen=lines)) or "Лог пуст"
