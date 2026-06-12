from collections.abc import Iterator

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, select

from models.internal import Company, Role, User
from models._aux_external.aux import normalize_russian_phone
from ._database import Database
from server.settings.settings import Settings


class SqlModelDatabase(Database):
    def __init__(self, engine, settings: Settings) -> None:
        self._engine = engine
        self._settings = settings

    def initialize(self) -> None:
        SQLModel.metadata.create_all(self._engine)
        self._migrate_companies()
        self._migrate_remove_nickname_columns()
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
                admin.firstname = "Admin"
                admin.lastname = "User"
                admin.role = Role.admin
                admin.password = self._settings.admin_password
            else:
                admin = User(
                    firstname="Admin",
                    lastname="User",
                    company_id=None,
                    phone=admin_phone,
                    password=self._settings.admin_password,
                    role=Role.admin,
                )
                session.add(admin)

            session.commit()

    def _migrate_remove_nickname_columns(self) -> None:
        inspector = inspect(self._engine)
        table_names = set(inspector.get_table_names())

        for table_name in ("user", "signuprequest"):
            if table_name not in table_names:
                continue

            columns = {column["name"] for column in inspector.get_columns(table_name)}
            if "nickname" not in columns:
                continue

            self._rebuild_table_without_column(table_name, "nickname")

    def _rebuild_table_without_column(self, table_name: str, removed_column: str) -> None:
        table = SQLModel.metadata.tables[table_name]
        old_table_name = f"{table_name}_old"

        with self._engine.begin() as connection:
            connection.execute(text("PRAGMA foreign_keys=OFF"))
            connection.execute(text(f"DROP TABLE IF EXISTS {old_table_name}"))
            connection.execute(text(f"ALTER TABLE {table_name} RENAME TO {old_table_name}"))
            table.create(bind=connection)

            current_columns = [column.name for column in table.columns]
            copied_columns = [
                column
                for column in current_columns
                if column != removed_column
            ]
            columns_sql = ", ".join(copied_columns)

            connection.execute(
                text(
                    f"""
                    INSERT INTO {table_name} ({columns_sql})
                    SELECT {columns_sql}
                    FROM {old_table_name}
                    """
                )
            )
            connection.execute(text(f"DROP TABLE {old_table_name}"))
            connection.execute(text("PRAGMA foreign_keys=ON"))

    def _migrate_companies(self) -> None:
        inspector = inspect(self._engine)
        table_names = set(inspector.get_table_names())
        if "company" not in table_names:
            return

        for table_name in ("user", "signuprequest"):
            if table_name not in table_names:
                continue

            columns = {column["name"] for column in inspector.get_columns(table_name)}
            if "company_id" not in columns:
                with self._engine.begin() as connection:
                    connection.execute(
                        text(f"ALTER TABLE {table_name} ADD COLUMN company_id INTEGER")
                    )

            if "company" in columns:
                self._migrate_company_values(table_name)

    def _migrate_company_values(self, table_name: str) -> None:
        with Session(self._engine) as session:
            rows = session.exec(
                text(
                    f"""
                    SELECT id, company
                    FROM {table_name}
                    WHERE company IS NOT NULL
                      AND trim(company) != ''
                      AND company_id IS NULL
                    """
                )
            ).all()

            for row in rows:
                row_id = row[0]
                company_name = " ".join(str(row[1]).split()).strip()
                if not company_name:
                    continue

                company = session.exec(
                    select(Company).where(Company.name == company_name)
                ).first()
                if not company:
                    company = Company(name=company_name)
                    session.add(company)
                    session.flush()

                session.exec(
                    text(
                        f"""
                        UPDATE {table_name}
                        SET company_id = :company_id
                        WHERE id = :row_id
                        """
                    ).bindparams(company_id=company.id, row_id=row_id)
                )

            session.commit()
