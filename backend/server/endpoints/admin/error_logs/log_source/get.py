from fastapi import Response

from server.log_reader._log_reader import LogReader

DEFAULT_LINES = 500


def f(log_source: str, log_reader: LogReader, lines: int = DEFAULT_LINES):
    content = log_reader.read(log_source, lines)
    return Response(content=content, media_type="text/plain; charset=utf-8")
