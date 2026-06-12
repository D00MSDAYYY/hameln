from datetime import datetime

from models.internal import Event, Registration
from server.aux import event_to_response


def test_event_detail_includes_registered_users_without_phone(db_session, user_factory):
    current_user = user_factory(
        phone="+79990000001",
        firstname="Анна",
        lastname="Сидорова",
        company="Alpha",
    )
    registered_user = user_factory(
        phone="+79990000002",
        firstname="Иван",
        lastname="Петров",
        company="Beta",
    )
    event = Event(
        title="Test event",
        date=datetime(2026, 7, 1, 12, 0),
        description="Description",
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)

    db_session.add(Registration(user_id=registered_user.id, event_id=event.id))
    db_session.commit()

    response = event_to_response(
        event,
        current_user.role,
        current_user.id,
        db_session,
        include_registered_users=True,
    )

    assert response.registered_users is not None
    assert len(response.registered_users) == 1
    assert response.registered_users[0].firstname == "Иван"
    assert response.registered_users[0].lastname == "Петров"
    assert response.registered_users[0].company == "Beta"
    assert not hasattr(response.registered_users[0], "phone")
