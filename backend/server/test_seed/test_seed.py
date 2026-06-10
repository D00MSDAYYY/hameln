from datetime import datetime, timedelta

from sqlmodel import Session, select

from ._test_seed import TestEventSeed, TestSeedRepository, TestUserSeed
from models.internal import (
    Event,
    EventTagLink,
    Registration,
    Role,
    Tag,
    User,
    UserSettingsLink,
)


TEST_PASSWORD = "test123"


class SqlModelTestSeedRepository(TestSeedRepository):
    def __init__(self, session: Session) -> None:
        self._session = session

    def upsert_user(self, seed: TestUserSeed) -> User:
        user = self._session.exec(
            select(User).where(User.nickname == seed.nickname)
        ).first()

        if not user:
            user = User(
                nickname=seed.nickname,
                phone=seed.phone,
                firstname=seed.firstname,
                lastname=seed.lastname,
                company=seed.company,
                password=TEST_PASSWORD,
                points=seed.points,
                role=Role.user,
            )
            self._session.add(user)
            self._session.flush()
        else:
            user.phone = seed.phone
            user.firstname = seed.firstname
            user.lastname = seed.lastname
            user.company = seed.company
            user.password = TEST_PASSWORD
            user.points = seed.points
            user.role = Role.user
            self._session.add(user)

        if user.id is not None and not self._session.get(UserSettingsLink, user.id):
            self._session.add(UserSettingsLink(user_id=user.id))

        return user

    def upsert_event(self, seed: TestEventSeed, base_date: datetime) -> Event:
        event = self._session.exec(
            select(Event).where(Event.title == seed.title)
        ).first()
        event_date = base_date + timedelta(days=seed.starts_in_days)

        if not event:
            event = Event(
                title=seed.title,
                description=seed.description,
                points=seed.points,
                date=event_date,
            )
            self._session.add(event)
            self._session.flush()
        else:
            event.description = seed.description
            event.points = seed.points
            event.date = event_date
            event.is_archived = False
            self._session.add(event)

        self._replace_tags(event, seed.tags)
        return event

    def ensure_registration(self, user: User, event: Event) -> None:
        if user.id is None or event.id is None:
            return

        registration = self._session.exec(
            select(Registration).where(
                Registration.user_id == user.id,
                Registration.event_id == event.id,
            )
        ).first()

        if not registration:
            self._session.add(Registration(user_id=user.id, event_id=event.id))

    def _replace_tags(self, event: Event, tag_titles: tuple[str, ...]) -> None:
        if event.id is None:
            return

        links = self._session.exec(
            select(EventTagLink).where(EventTagLink.event_id == event.id)
        ).all()
        for link in links:
            self._session.delete(link)
        self._session.flush()

        for title in tag_titles:
            tag = self._session.exec(select(Tag).where(Tag.title == title)).first()
            if not tag:
                tag = Tag(title=title)
                self._session.add(tag)
                self._session.flush()

            if tag.id is not None:
                self._session.add(EventTagLink(event_id=event.id, tag_id=tag.id))


TEST_USERS = (
    TestUserSeed(
        nickname="test_anna",
        phone="+79000000001",
        firstname="Анна",
        lastname="Смирнова",
        company="Test Lab",
        points=120,
    ),
    TestUserSeed(
        nickname="test_ivan",
        phone="+79000000002",
        firstname="Иван",
        lastname="Петров",
        company="Demo Corp",
        points=80,
    ),
    TestUserSeed(
        nickname="test_maria",
        phone="+79000000003",
        firstname="Мария",
        lastname="Кузнецова",
        company="Example Team",
        points=45,
    ),
)

TEST_EVENTS = (
    TestEventSeed(
        title="[TEST] Встреча команды",
        description="Короткая тестовая встреча для проверки регистрации и списка участников.",
        points=10,
        starts_in_days=2,
        tags=("test", "team"),
    ),
    TestEventSeed(
        title="[TEST] Воркшоп по продукту",
        description="Тестовое мероприятие с описанием, тегами и несколькими участниками.",
        points=25,
        starts_in_days=7,
        tags=("test", "workshop"),
    ),
    TestEventSeed(
        title="[TEST] Демонстрация функциональности",
        description="Сценарий для быстрой проверки карточек, регистрации и детальной страницы.",
        points=15,
        starts_in_days=14,
        tags=("test", "demo"),
    ),
)


def seed_test_data(
    repository: TestSeedRepository,
    *,
    base_date: datetime | None = None,
) -> dict[str, int]:
    base_date = base_date or datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)

    users = [repository.upsert_user(seed) for seed in TEST_USERS]
    events = [repository.upsert_event(seed, base_date) for seed in TEST_EVENTS]

    if users and events:
        repository.ensure_registration(users[0], events[0])
        repository.ensure_registration(users[1], events[0])
        repository.ensure_registration(users[1], events[1])
        repository.ensure_registration(users[2], events[1])

    return {
        "users": len(users),
        "events": len(events),
    }
