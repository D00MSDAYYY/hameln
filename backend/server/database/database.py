from collections.abc import Iterator

from sqlmodel import Session, SQLModel, select

from models.internal import Role, User
from models._aux_external.aux import normalize_russian_phone
from ._database import Database
from server.settings.settings import Settings


class SqlModelDatabase(Database):
    def __init__(self, engine, settings: Settings) -> None:
        self._engine = engine
        self._settings = settings

    def initialize(self) -> None:
        SQLModel.metadata.create_all(self._engine)
        self._init_admin_user()

    def session(self) -> Iterator[Session]:
        with Session(self._engine) as session:
            yield session

    def _init_admin_user(self) -> None:
        if not self._settings.admin_phone or not self._settings.admin_password:
            return

        admin_phone = normalize_russian_phone(self._settings.admin_phone)

        with Session(self._engine) as session:
            admin = session.exec(select(User).where(User.phone == admin_phone)).first()

            if admin:
                admin.role = Role.admin
                admin.password = self._settings.admin_password
            else:
                admin = User(
                    nickname=admin_phone,
                    firstname="Admin",
                    lastname="User",
                    company=None,
                    phone=admin_phone,
                    password=self._settings.admin_password,
                    role=Role.admin,
                )
                session.add(admin)

            session.commit()
