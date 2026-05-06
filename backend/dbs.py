# backend/dbs.py
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy import Column, JSON
from models.internal import *
from models.external import *
from pathlib import Path

# Создаём движок SQLite
BACKEND_DIR = Path(__file__).resolve().parent
sqlite_url = f"sqlite:///{BACKEND_DIR / 'hameln.db'}"
engine = create_engine(sqlite_url, echo=False)


def init_db():
    """Создаёт все таблицы и наполняет тестовыми данными."""
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # Проверяем, есть ли уже данные
        existing_users = session.query(User).first()
        if existing_users:
            return  # База уже инициализирована

        # ========== Пользователи ==========
        users = [
            User(
                nickname="admin",
                firstname="Админ",
                lastname="Админов",
                points=999,
                company="Администрация",
                password="1",
                role=Role.admin,
            ),
            User(
                nickname="ivanov",
                firstname="Иван",
                lastname="Иванов",
                points=150,
                company="Росагро",
                password="12",
                role=Role.user,
            ),
            User(
                nickname="petrov",
                firstname="Пётр",
                lastname="Петров",
                points=200,
                company="Роскосмос",
                password="123",
                role=Role.user,
            ),
            User(
                nickname="sidorov",
                firstname="Сидор",
                lastname="Сидоров",
                points=22,
                password="1234",
                role=Role.user,
            ),
            User(
                nickname="zaycev",
                firstname="Заяц",
                lastname="Зайцев",
                points=22,
                password="12345",
                role=Role.user,
            ),
            User(
                nickname="demidov",
                firstname="Демид",
                lastname="Демидов",
                points=22,
                company="Росатом",
                password="123456",
                role=Role.user,
            ),
            User(
                nickname="nuriev",
                firstname="Нури",
                lastname="Нуриев",
                points=22,
                company="АМС",
                password="1234567",
                role=Role.user,
            ),
        ]
        session.add_all(users)
        session.flush()

        # ========== Настройки для каждого пользователя (UserSettingsLink) ==========
        for user in users:
            user_settings = UserSettingsLink(user_id=user.id) # type: ignore
            session.add(user_settings)
        session.flush()

        # ========== Теги ==========
        tags = [
            Tag(title="React"),
            Tag(title="Frontend"),
            Tag(title="Python"),
            Tag(title="Backend"),
            Tag(title="API"),
            Tag(title="VK"),
            Tag(title="Mini Apps"),
            Tag(title="Сообщество"),
            Tag(title="iOS"),
            Tag(title="Android"),
            Tag(title="Flutter"),
            Tag(title="Data Science"),
            Tag(title="Аналитика"),
            Tag(title="DevOps"),
            Tag(title="Docker"),
            Tag(title="Kubernetes"),
            Tag(title="Хакатон"),
            Tag(title="Медицина"),
            Tag(title="Алгоритмы"),
            Tag(title="C++"),
        ]
        session.add_all(tags)
        session.flush()

        # ========== События ==========
        events = [
            Event(
                title="Конференция VK Mini Apps",
                description="Ежегодная конференция для разработчиков мини-приложений ВКонтакте.",
                points=150,
                date=datetime(2025, 6, 15, 10, 0),
                link="https://vk.com/dev/events",
                is_archived=False,
            ),
            Event(
                title="React Advanced: Мастер-класс",
                description="Углубленный мастер-класс по продвинутым техникам React.",
                points=200,
                date=datetime(2025, 6, 20, 14, 0),
                is_archived=False,
            ),
            Event(
                title="Python для анализа данных",
                description="Введение в Python с акцентом на анализ данных.",
                points=100,
                date=datetime(2025, 7, 1, 18, 0),
                is_archived=False,
            ),
            Event(
                title="Хакатон «Код здоровья»",
                description="Соревнование по созданию IT-решений для медицины.",
                points=300,
                date=datetime(2025, 7, 10, 9, 0),
                link="https://healthcode.example.com",
                is_archived=False,
            ),
            Event(
                title="Старый Новый Год (архив)",
                description="Давно прошедшее праздничное мероприятие.",
                points=50,
                date=datetime(2023, 1, 14, 20, 0),
                is_archived=True,
            ),
            Event(
                title="Основы Docker (архив)",
                description="Практический воркшоп по контейнеризации.",
                points=120,
                date=datetime(2024, 9, 1, 10, 0),
                is_archived=True,
            ),
        ]
        session.add_all(events)
        session.flush()

        # ========== Связи событие-тег ==========
        event_tags = [
            EventTagLink(event_id=1, tag_id=6),  # VK
            EventTagLink(event_id=1, tag_id=7),  # Mini Apps
            EventTagLink(event_id=2, tag_id=1),  # React
            EventTagLink(event_id=2, tag_id=2),  # Frontend
            EventTagLink(event_id=3, tag_id=3),  # Python
            EventTagLink(event_id=3, tag_id=12),  # Data Science
            EventTagLink(event_id=3, tag_id=13),  # Аналитика
            EventTagLink(event_id=4, tag_id=17),  # Хакатон
            EventTagLink(event_id=4, tag_id=18),  # Медицина
            EventTagLink(event_id=4, tag_id=3),  # Python
            EventTagLink(event_id=5, tag_id=17),  # Хакатон
            EventTagLink(event_id=6, tag_id=15),  # Docker
            EventTagLink(event_id=6, tag_id=14),  # DevOps
        ]
        session.add_all(event_tags)
        session.flush()

        # ========== Уведомления ==========
        notifications = [
            Notification(
                title="Конференция уже завтра!",
                body="Не забудьте посетить конференцию VK Mini Apps завтра в 10:00.",
            ),
            Notification(
                title="Новое событие добавлено",
                body="Открыта регистрация на хакатон «Код здоровья».",
            ),
            Notification(
                title="Изменение в расписании",
                body="React мастер-класс перенесён на 20 июня 14:00.",
            ),
        ]
        session.add_all(notifications)
        session.flush()

        # ========== Регистрации ==========
        registrations = [
            Registration(user_id=2, event_id=1),
            Registration(user_id=2, event_id=2),
            Registration(user_id=3, event_id=3),
            Registration(user_id=3, event_id=4),
            Registration(user_id=1, event_id=1),
        ]
        session.add_all(registrations)

        # ========== Посетители ==========
        attendances = [
            Attendance(user_id=2, event_id=1),
            Attendance(user_id=3, event_id=1),
        ]
        session.add_all(attendances)

        session.commit()


def get_session():
    """Зависимость FastAPI для получения сессии БД."""
    with Session(engine) as session:
        yield session
