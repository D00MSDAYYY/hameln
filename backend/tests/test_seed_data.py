from sqlmodel import select

from tests.test_func import TEST_EVENTS, TEST_PASSWORD, TEST_USERS, insert_test_data
from server.database.database import SqlModelDatabase
from server.settings.settings import Settings
from models.internal import Company, Event, Registration, User


def test_seed_test_data_creates_marked_users_and_events(db_session):
    database = SqlModelDatabase(db_session.bind, Settings())

    result = insert_test_data(
        database,
        TEST_USERS,
        TEST_EVENTS,
        password=TEST_PASSWORD,
    )

    users = db_session.exec(select(User).where(User.firstname.startswith("[TEST]"))).all()
    events = db_session.exec(select(Event).where(Event.title.startswith("[TEST]"))).all()
    companies = db_session.exec(select(Company)).all()
    registrations = db_session.exec(select(Registration)).all()

    assert result == {"users": 3, "events": 3}
    assert len(users) == 3
    assert len(events) == 3
    assert len(companies) == 3
    assert len(registrations) == 4
    assert all(user.firstname.startswith("[TEST]") for user in users)
    assert all(user.company_id for user in users)
    assert all(event.title.startswith("[TEST]") for event in events)


def test_seed_test_data_is_idempotent(db_session):
    database = SqlModelDatabase(db_session.bind, Settings())

    insert_test_data(
        database,
        TEST_USERS,
        TEST_EVENTS,
        password=TEST_PASSWORD,
    )
    insert_test_data(
        database,
        TEST_USERS,
        TEST_EVENTS,
        password=TEST_PASSWORD,
    )

    users = db_session.exec(select(User).where(User.firstname.startswith("[TEST]"))).all()
    events = db_session.exec(select(Event).where(Event.title.startswith("[TEST]"))).all()
    companies = db_session.exec(select(Company)).all()
    registrations = db_session.exec(select(Registration)).all()

    assert len(users) == 3
    assert len(events) == 3
    assert len(companies) == 3
    assert len(registrations) == 4
