import logging
from pathlib import Path

import redis
import uvicorn
from sqlmodel import create_engine

from server.database.database import SqlModelDatabase
from server.report.report import (
    DefaultReportService,
    ExcelReportRenderer,
    SqlModelReportRepository,
)
from server.log_reader.log_reader import FileLogReader
from server.server import create_app
from server.session_storage.redis_session_storage import RedisSessionStorage
from server.settings.settings import Settings

BACKEND_DIR = Path(__file__).resolve().parent


def build_app():
    settings = Settings.from_env(
        env_file=str(BACKEND_DIR / ".env"),
        default_backend_dir=str(BACKEND_DIR),
    )
    engine = create_engine(f"sqlite:///{settings.backend_dir}/hameln.db", echo=False)
    database = SqlModelDatabase(engine, settings)
    redis_client = redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        decode_responses=True,
    )
    session_storage = RedisSessionStorage(redis_client, settings.session_ttl)
    log_reader = FileLogReader(settings)
    report_renderer = ExcelReportRenderer()
    logger = logging.getLogger("uvicorn.error")

    return create_app(
        settings=settings,
        database=database,
        session_storage=session_storage,
        log_reader=log_reader,
        report_service_factory=lambda session: DefaultReportService(
            repository=SqlModelReportRepository(session),
            renderer=report_renderer,
        ),
        logger=logger,
    )


app = build_app()


if __name__ == "__main__":
    settings = app.state.settings
    uvicorn.run(app, host=settings.host, port=settings.port)
