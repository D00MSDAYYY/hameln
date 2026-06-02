from sqlmodel import Session, SQLModel, create_engine, select

from models.internal import Role, User
from models._aux_external.aux import normalize_russian_phone
from server.settings import Settings


def create_db_engine(settings: Settings):
    return create_engine(f"sqlite:///{settings.backend_dir}/hameln.db", echo=False)


def init_admin_user(engine, settings: Settings):
    if not settings.admin_phone or not settings.admin_password:
        return

    admin_phone = normalize_russian_phone(settings.admin_phone)

    with Session(engine) as session:
        admin = session.exec(select(User).where(User.phone == admin_phone)).first()

        if admin:
            admin.role = Role.admin
            admin.password = settings.admin_password
        else:
            admin = User(
                nickname=admin_phone,
                firstname="Admin",
                lastname="User",
                company=None,
                phone=admin_phone,
                password=settings.admin_password,
                role=Role.admin,
            )
            session.add(admin)

        session.commit()


def init_database(engine, settings: Settings):
    SQLModel.metadata.create_all(engine)
    init_admin_user(engine, settings)
