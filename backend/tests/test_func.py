from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlmodel import Session, select

from models.internal import (
    Company,
    Event,
    EventTagLink,
    Registration,
    Role,
    Tag,
    User,
    UserSettingsLink,
)
from server.database._database import Database


TEST_PASSWORD = "test123"


@dataclass(frozen=True)
class UserSeed:
    phone: str
    firstname: str
    lastname: str
    company: str
    points: int = 0


@dataclass(frozen=True)
class EventSeed:
    title: str
    description: str
    points: int
    starts_in_days: int
    tags: tuple[str, ...]


TEST_USERS = (
    UserSeed(
        phone="+79000000001",
        firstname="[TEST] Анна",
        lastname="Смирнова",
        company="Test Lab",
        points=120,
    ),
    UserSeed(
        phone="+79000000002",
        firstname="[TEST] Иван",
        lastname="Петров",
        company="Demo Corp",
        points=80,
    ),
    UserSeed(
        phone="+79000000003",
        firstname="[TEST] Мария",
        lastname="Кузнецова",
        company="Example Team",
        points=45,
    ),
)


TEST_EVENTS = (
    EventSeed(
        title="[TEST] Встреча команды",
        description="Короткая тестовая встреча для проверки регистрации и списка участников.",
        points=10,
        starts_in_days=2,
        tags=("test", "team"),
    ),
    EventSeed(
        title="[TEST] Воркшоп по продукту",
        description="Тестовое мероприятие с описанием, тегами и несколькими участниками.",
        points=25,
        starts_in_days=7,
        tags=("test", "workshop"),
    ),
    EventSeed(
        title="[TEST] Демонстрация функциональности",
        description="Сценарий для быстрой проверки карточек, регистрации и детальной страницы.",
        points=15,
        starts_in_days=14,
        tags=("test", "demo"),
    ),
)


def insert_test_data(
    database: Database,
    users_seed: tuple[UserSeed, ...] = TEST_USERS,
    events_seed: tuple[EventSeed, ...] = TEST_EVENTS,
    *,
    password: str = TEST_PASSWORD,
    base_date: datetime | None = None,
) -> dict[str, int]:
    base_date = base_date or datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)

    session_iterator = database.session()
    session = next(session_iterator)
    try:
        users = [upsert_test_user(session, seed, password) for seed in users_seed]
        events = [upsert_test_event(session, seed, base_date) for seed in events_seed]

        if users and events:
            ensure_registration(session, users[0], events[0])
            ensure_registration(session, users[1], events[0])
            ensure_registration(session, users[1], events[1])
            ensure_registration(session, users[2], events[1])

        session.commit()
    finally:
        session_iterator.close()

    return {
        "users": len(users),
        "events": len(events),
    }


def upsert_test_user(session: Session, seed: UserSeed, password: str) -> User:
    user = session.exec(select(User).where(User.phone == seed.phone)).first()
    company = get_or_create_test_company(session, seed.company)

    if not user:
        user = User(
            phone=seed.phone,
            firstname=seed.firstname,
            lastname=seed.lastname,
            company_id=company.id if company else None,
            password=password,
            points=seed.points,
            role=Role.user,
        )
        session.add(user)
        session.flush()
    else:
        user.phone = seed.phone
        user.firstname = seed.firstname
        user.lastname = seed.lastname
        user.company_id = company.id if company else None
        user.password = password
        user.points = seed.points
        user.role = Role.user
        session.add(user)

    if user.id is not None and not session.get(UserSettingsLink, user.id):
        session.add(UserSettingsLink(user_id=user.id))

    return user


def get_or_create_test_company(session: Session, company_name: str) -> Company | None:
    company_name = " ".join(company_name.split()).strip()
    if not company_name:
        return None

    company = session.exec(select(Company).where(Company.name == company_name)).first()
    if not company:
        company = Company(name=company_name)
        session.add(company)
        session.flush()

    return company


def upsert_test_event(
    session: Session,
    seed: EventSeed,
    base_date: datetime,
) -> Event:
    event = session.exec(select(Event).where(Event.title == seed.title)).first()
    event_date = base_date + timedelta(days=seed.starts_in_days)

    if not event:
        event = Event(
            title=seed.title,
            description=seed.description,
            points=seed.points,
            date=event_date,
        )
        session.add(event)
        session.flush()
    else:
        event.description = seed.description
        event.points = seed.points
        event.date = event_date
        event.is_archived = False
        session.add(event)

    replace_event_tags(session, event, seed.tags)
    return event


def replace_event_tags(session: Session, event: Event, tag_titles: tuple[str, ...]) -> None:
    if event.id is None:
        return

    links = session.exec(
        select(EventTagLink).where(EventTagLink.event_id == event.id)
    ).all()
    for link in links:
        session.delete(link)
    session.flush()

    for title in tag_titles:
        tag = session.exec(select(Tag).where(Tag.title == title)).first()
        if not tag:
            tag = Tag(title=title)
            session.add(tag)
            session.flush()

        if tag.id is not None:
            session.add(EventTagLink(event_id=event.id, tag_id=tag.id))


def ensure_registration(session: Session, user: User, event: Event) -> None:
    if user.id is None or event.id is None:
        return

    registration = session.exec(
        select(Registration).where(
            Registration.user_id == user.id,
            Registration.event_id == event.id,
        )
    ).first()

    if not registration:
        session.add(Registration(user_id=user.id, event_id=event.id))
