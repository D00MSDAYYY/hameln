from pathlib import Path

from sqlmodel import Session, create_engine

from server.database.database import SqlModelDatabase
from server.settings.settings import Settings
from server.test_seed.test_seed import (
    TEST_PASSWORD,
    SqlModelTestSeedRepository,
    seed_test_data,
)


BACKEND_DIR = Path(__file__).resolve().parent


def main() -> None:
    settings = Settings.from_env(
        env_file=str(BACKEND_DIR / ".env"),
        default_backend_dir=str(BACKEND_DIR),
    )
    Path(settings.backend_dir).mkdir(parents=True, exist_ok=True)
    engine = create_engine(f"sqlite:///{settings.backend_dir}/hameln.db", echo=False)
    database = SqlModelDatabase(engine, settings)
    database.initialize()

    with Session(engine) as session:
        result = seed_test_data(SqlModelTestSeedRepository(session))
        session.commit()

    print(
        "Тестовые данные добавлены: "
        f"пользователи={result['users']}, мероприятия={result['events']}. "
        f"Пароль тестовых пользователей: {TEST_PASSWORD}"
    )


if __name__ == "__main__":
    main()
