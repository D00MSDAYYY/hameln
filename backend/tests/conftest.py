import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from models.internal import Company, User


class FakeSessionStorage:
    session_ttl = 86400

    def __init__(self):
        self.sessions = {}
        self.next_session_id = "test-session-id"

    def generate_uid(self):
        return self.next_session_id

    def save_session(self, session_id, user_id):
        self.sessions[session_id] = user_id

    def delete_session(self, session_id):
        self.sessions.pop(session_id, None)

    def get(self, session_id):
        return self.sessions.get(session_id)


@pytest.fixture
def engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture
def db_session(engine):
    with Session(engine) as session:
        yield session


@pytest.fixture
def fake_session_storage():
    return FakeSessionStorage()


@pytest.fixture
def user_factory(db_session):
    def create_user(**overrides):
        company_name = overrides.pop("company", "Test")
        company = db_session.exec(
            select(Company).where(Company.name == company_name)
        ).first()
        if not company:
            company = Company(name=company_name)
            db_session.add(company)
            db_session.flush()

        data = {
            "nickname": "+79990000000",
            "firstname": "Иван",
            "lastname": "Иванов",
            "company_id": company.id,
            "phone": "+79990000000",
            "password": "secret",
        }
        data.update(overrides)

        user = User(**data)
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    return create_user
