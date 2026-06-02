import logging
from pathlib import Path

import uvicorn

from server.database import create_db_engine
from server.server import create_app
from server.session import create_session_storage
from server.settings import Settings


BACKEND_DIR = Path(__file__).resolve().parent

settings = Settings.from_env(
    env_file=str(BACKEND_DIR / ".env"),
    default_backend_dir=str(BACKEND_DIR),
)
engine = create_db_engine(settings)
session_storage = create_session_storage(settings)
logger = logging.getLogger("uvicorn.error")

app = create_app(
    settings=settings,
    engine=engine,
    session_storage=session_storage,
    logger=logger,
)

if __name__ == "__main__":
    uvicorn.run(app, host=settings.host, port=settings.port)
