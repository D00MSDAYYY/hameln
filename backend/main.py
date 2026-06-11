import logging
from pathlib import Path

import redis
import uvicorn
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sqlmodel import create_engine

from app import App
from server.company_suggest.dadata_company_suggest import DadataCompanySuggest
from server.database.database import SqlModelDatabase
from server.log_reader.log_reader import FileLogReader
from server.report.report import (
    DefaultReportService,
    ExcelReportRenderer,
    SqlModelReportRepository,
)
from server.server import configure_router
from server.session_storage.redis_session_storage import RedisSessionStorage
from server.settings.settings import Settings
from tests.test_func import insert_test_data

BACKEND_DIR = Path(__file__).resolve().parent


if __name__ == "__main__":
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
    company_suggest = DadataCompanySuggest(
        token=settings.dadata_token,
    )
    report_renderer = ExcelReportRenderer()
    logger = logging.getLogger("uvicorn.error")
    router = configure_router(APIRouter())

    database.initialize()
    insert_test_data(database)


    async def global_exception_handler(
        request: Request,
        exc: Exception,
    ):
        client = request.client.host if request.client else "unknown"
        logger.error(
            "Unhandled exception: %s %s from %s",
            request.method,
            request.url,
            client,
            exc_info=(type(exc), exc, exc.__traceback__),
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Внутренняя ошибка сервера"},
        )

    app = App(
        settings=settings,
        database=database,
        session_storage=session_storage,
        log_reader=log_reader,
        company_suggest=company_suggest,
        report_service_factory=lambda session: DefaultReportService(
            repository=SqlModelReportRepository(session),
            renderer=report_renderer,
        ),
        router=router,
        exception_handler=global_exception_handler,
    )

    uvicorn.run(app, host=settings.host, port=settings.port)
