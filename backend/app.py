from collections.abc import Awaitable, Callable
from typing import AsyncContextManager

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from starlette.responses import Response

from server.database._database import Database
from server.log_reader._log_reader import LogReader
from server.report._report import ReportService
from server.session_storage._session_storage import SessionStorage
from server.settings.settings import Settings


ReportServiceFactory = Callable[[Session], ReportService]
Lifespan = Callable[[FastAPI], AsyncContextManager[None]]
ExceptionHandler = Callable[[Request, Exception], Awaitable[Response]]


class App(FastAPI):
    def __init__(
        self,
        *,
        settings: Settings,
        database: Database,
        session_storage: SessionStorage,
        log_reader: LogReader,
        report_service_factory: ReportServiceFactory,
        router: APIRouter,
        exception_handler: ExceptionHandler,
    ):
        super().__init__(
            title="Event Manager API",
            version="0.4.0",
        )

        self.state.settings = settings
        self.state.database = database
        self.state.session_storage = session_storage
        self.state.log_reader = log_reader
        self.state.report_service_factory = report_service_factory

        self.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
            allow_credentials=True,
        )
        self.add_exception_handler(Exception, exception_handler)
        self.include_router(router)
