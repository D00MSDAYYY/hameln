from sqlmodel import select

from models.internal import Event, Registration, User
from server.test_seed.test_seed import SqlModelTestSeedRepository, seed_test_data


def test_seed_test_data_creates_marked_users_and_events(db_session):
    result = seed_test_data(SqlModelTestSeedRepository(db_session))
    db_session.commit()

    users = db_session.exec(select(User).where(User.nickname.startswith("test_"))).all()
    events = db_session.exec(select(Event).where(Event.title.startswith("[TEST]"))).all()
    registrations = db_session.exec(select(Registration)).all()

    assert result == {"users": 3, "events": 3}
    assert len(users) == 3
    assert len(events) == 3
    assert len(registrations) == 4
    assert all(user.nickname.startswith("test_") for user in users)
    assert all(event.title.startswith("[TEST]") for event in events)


def test_seed_test_data_is_idempotent(db_session):
    repository = SqlModelTestSeedRepository(db_session)

    seed_test_data(repository)
    db_session.commit()
    seed_test_data(repository)
    db_session.commit()

    users = db_session.exec(select(User).where(User.nickname.startswith("test_"))).all()
    events = db_session.exec(select(Event).where(Event.title.startswith("[TEST]"))).all()
    registrations = db_session.exec(select(Registration)).all()

    assert len(users) == 3
    assert len(events) == 3
    assert len(registrations) == 4
