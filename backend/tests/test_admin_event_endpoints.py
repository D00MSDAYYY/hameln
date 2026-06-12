from datetime import datetime

import pytest
from fastapi import HTTPException
from sqlmodel import select

from models.external import EventInfoResponse, TagInfoResponse
from models.internal import Attendance, Event, EventTagLink, Registration, Role, Tag
from server.endpoints.admin.events.event_id.attendants.get import f as get_attendants
from server.endpoints.admin.events.event_id.attendants.patch import f as update_attendants
from server.endpoints.admin.events.event_id.delete import f as delete_event
from server.endpoints.admin.events.event_id.patch import f as update_event
from server.endpoints.admin.events.get import f as get_admin_events
from server.endpoints.admin.events.post import f as create_event


def test_admin_event_crud_and_tags(db_session, user_factory):
    admin = user_factory(role=Role.admin)
    payload = EventInfoResponse(
        title="Admin event",
        description="Description",
        points=5,
        date=datetime(2026, 7, 1, 12, 0),
        tags=[TagInfoResponse(title="tag-one")],
    )

    created = create_event(payload, admin, db_session)
    listed = get_admin_events(admin, db_session)
    updated = update_event(
        created.id,
        EventInfoResponse(title="Updated", tags=[TagInfoResponse(title="tag-two")]),
        admin,
        db_session,
    )
    delete_result = delete_event(created.id, admin, db_session)

    assert created.title == "Admin event"
    assert listed[0].title == "Admin event"
    assert updated.title == "Updated"
    assert [tag.title for tag in updated.tags] == ["tag-two"]
    assert delete_result == {"message": "Событие удалено"}
    assert db_session.get(Event, created.id) is None


def test_admin_event_missing_errors(db_session, user_factory):
    admin = user_factory(role=Role.admin)

    with pytest.raises(HTTPException) as update_error:
        update_event(999, EventInfoResponse(title="Missing"), admin, db_session)
    with pytest.raises(HTTPException) as delete_error:
        delete_event(999, admin, db_session)
    with pytest.raises(HTTPException) as attendants_error:
        get_attendants(999, admin, db_session)

    assert update_error.value.status_code == 404
    assert delete_error.value.status_code == 404
    assert attendants_error.value.status_code == 404


def test_admin_attendants_replace_list(db_session, user_factory):
    admin = user_factory(phone="+79990000001", role=Role.admin)
    first = user_factory(phone="+79990000002", firstname="First", lastname="User")
    second = user_factory(phone="+79990000003", firstname="Second", lastname="User")
    event = Event(title="Event", date=datetime(2026, 7, 1, 12, 0))
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)

    result = update_attendants(event.id, [first.id, second.id], admin, db_session)
    attendants = get_attendants(event.id, admin, db_session)

    assert result == {"message": "Список посетителей обновлён"}
    assert {(user.firstname, user.lastname) for user in attendants} == {
        ("First", "User"),
        ("Second", "User"),
    }
    assert len(db_session.exec(select(Attendance)).all()) == 2


def test_admin_attendants_empty_replace_and_missing_event(db_session, user_factory):
    admin = user_factory(phone="+79990000001", role=Role.admin)
    first = user_factory(phone="+79990000002")
    event = Event(title="Event", date=datetime(2026, 7, 1, 12, 0))
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)
    db_session.add(Attendance(user_id=first.id, event_id=event.id))
    db_session.commit()

    update_attendants(event.id, [], admin, db_session)
    attendants = get_attendants(event.id, admin, db_session)

    with pytest.raises(HTTPException) as missing_patch:
        update_attendants(999, [first.id], admin, db_session)

    assert attendants == []
    assert missing_patch.value.status_code == 404


def test_admin_event_delete_cascades_links_in_session(db_session, user_factory):
    admin = user_factory(role=Role.admin)
    event = Event(title="Event", date=datetime(2026, 7, 1, 12, 0))
    tag = Tag(title="tag")
    db_session.add(event)
    db_session.add(tag)
    db_session.commit()
    db_session.refresh(event)
    db_session.refresh(tag)
    db_session.add(EventTagLink(event_id=event.id, tag_id=tag.id))
    db_session.add(Registration(user_id=admin.id, event_id=event.id))
    db_session.commit()

    delete_event(event.id, admin, db_session)

    assert db_session.get(Event, event.id) is None
