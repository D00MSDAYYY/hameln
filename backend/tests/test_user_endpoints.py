from datetime import datetime
from types import SimpleNamespace

import pytest
from fastapi import HTTPException, Response
from sqlmodel import select

from models.external import SettingsResponse, UserInfoResponse
from models.internal import (
    AppTheme,
    Event,
    Notification,
    Registration,
    Role,
    Settings,
    Tag,
    UserSettingsLink,
)
from server.endpoints.user.events.event_id.get import f as get_event_detail
from server.endpoints.user.events.event_id.register.delete import f as unregister_event
from server.endpoints.user.events.event_id.register.post import f as register_event
from server.endpoints.user.events.get import f as get_events
from server.endpoints.user.leaderboard.get import get_leaderboard
from server.endpoints.user.logout.post import f as logout
from server.endpoints.user.notifications.get import f as get_notifications
from server.endpoints.user.profile.get import f as get_profile
from server.endpoints.user.profile.patch import f as update_profile
from server.endpoints.user.settings.get import f as get_settings
from server.endpoints.user.settings.patch import f as update_settings
from server.endpoints.user.tags.get import f as get_tags


def test_profile_get_and_patch_updates_user_company(db_session, user_factory):
    user = user_factory(company="Old Company")

    response = get_profile(user, db_session)
    assert response.company == "Old Company"

    updated = update_profile(
        UserInfoResponse(firstname="Петр", lastname="Петров", company="New Company"),
        user,
        db_session,
    )

    assert updated.firstname == "Петр"
    assert updated.lastname == "Петров"
    assert updated.company == "New Company"
    assert user.company_id is not None


def test_settings_get_creates_default_settings(db_session, user_factory):
    user = user_factory()

    response = get_settings(user, db_session)
    stored = db_session.get(UserSettingsLink, user.id)

    assert response["app_theme"] == AppTheme.light
    assert response["days_to_notify"] == 3
    assert response["do_notify"] is True
    assert stored is not None


def test_settings_get_repairs_empty_settings(db_session, user_factory):
    user = user_factory()
    db_session.add(UserSettingsLink(user_id=user.id, settings={}))
    db_session.commit()

    response = get_settings(user, db_session)

    assert response["days_to_notify"] == 3
    assert response["do_notify"] is True


def test_settings_patch_merges_and_validates_settings(db_session, user_factory):
    user = user_factory()

    response = update_settings(
        SettingsResponse(days_to_notify=7, do_notify=False),
        user,
        db_session,
    )
    stored = db_session.get(UserSettingsLink, user.id)

    assert response["days_to_notify"] == 7
    assert response["do_notify"] is False
    assert Settings(**stored.settings).days_to_notify == 7


def test_settings_patch_creates_and_repairs_settings(db_session, user_factory):
    user = user_factory()

    created = update_settings(SettingsResponse(days_to_notify=5), user, db_session)
    stored = db_session.get(UserSettingsLink, user.id)
    stored.settings = {}
    db_session.add(stored)
    db_session.commit()

    repaired = update_settings(SettingsResponse(do_notify=False), user, db_session)

    assert created["days_to_notify"] == 5
    assert repaired["do_notify"] is False


def test_tags_and_notifications_are_visible_to_user(db_session, user_factory):
    user = user_factory()
    db_session.add(Tag(title="team"))
    db_session.add(Notification(title="News", body="Body"))
    db_session.commit()

    tags = get_tags(user, db_session)
    notifications = get_notifications(user, db_session)

    assert tags[0].title == "team"
    assert notifications[0].title == "News"
    assert notifications[0].body == "Body"


def test_leaderboard_returns_users_with_positive_points_sorted(db_session, user_factory):
    user_factory(phone="+79990000001", firstname="Current", lastname="User", points=0)
    user_factory(phone="+79990000002", firstname="Middle", lastname="User", points=20, company="Middle Company")
    user_factory(phone="+79990000003", firstname="Top", lastname="User", points=50, company="Top Company")
    user_factory(phone="+79990000004", firstname="Zero", lastname="User", points=0)

    leaderboard = get_leaderboard(db_session)

    assert [(user.firstname, user.lastname, user.points) for user in leaderboard] == [
        ("Top", "User", 50),
        ("Middle", "User", 20),
    ]
    assert [user.company for user in leaderboard] == ["Top Company", "Middle Company"]
    assert all("phone" not in user.model_dump() for user in leaderboard)


def test_events_list_hides_archived_and_marks_registration(db_session, user_factory):
    user = user_factory()
    active = Event(title="Active", date=datetime(2026, 7, 1, 12, 0))
    archived = Event(title="Archived", date=datetime(2026, 7, 2, 12, 0), is_archived=True)
    db_session.add(active)
    db_session.add(archived)
    db_session.commit()
    db_session.refresh(active)
    db_session.add(Registration(user_id=user.id, event_id=active.id))
    db_session.commit()

    events = get_events(user, db_session)

    assert [event.title for event in events] == ["Active"]
    assert events[0].is_registered is True


def test_event_detail_register_and_unregister(db_session, user_factory):
    user = user_factory()
    event = Event(title="Workshop", date=datetime(2026, 7, 1, 12, 0))
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)

    register_result = register_event(event.id, user, db_session)
    detail = get_event_detail(event.id, user, db_session)
    unregister_result = unregister_event(event.id, user, db_session)

    assert register_result["message"] == "Вы зарегистрированы на событие 'Workshop'"
    assert detail.is_registered is True
    assert unregister_result["message"] == "Регистрация на 'Workshop' отменена"
    assert db_session.exec(select(Registration)).first() is None


def test_event_detail_missing_returns_404(db_session, user_factory):
    user = user_factory()

    with pytest.raises(HTTPException) as exc:
        get_event_detail(999, user, db_session)

    assert exc.value.status_code == 404


def test_event_registration_rejects_missing_archived_duplicate_and_missing_unregister(
    db_session,
    user_factory,
):
    user = user_factory()
    archived = Event(
        title="Archived",
        date=datetime(2026, 7, 1, 12, 0),
        is_archived=True,
    )
    active = Event(title="Active", date=datetime(2026, 7, 2, 12, 0))
    db_session.add(archived)
    db_session.add(active)
    db_session.commit()
    db_session.refresh(archived)
    db_session.refresh(active)

    with pytest.raises(HTTPException) as missing_event:
        register_event(999, user, db_session)
    with pytest.raises(HTTPException) as archived_event:
        register_event(archived.id, user, db_session)

    register_event(active.id, user, db_session)
    with pytest.raises(HTTPException) as duplicate:
        register_event(active.id, user, db_session)

    unregister_event(active.id, user, db_session)
    with pytest.raises(HTTPException) as missing_registration:
        unregister_event(active.id, user, db_session)
    with pytest.raises(HTTPException) as missing_unregister_event:
        unregister_event(999, user, db_session)

    assert missing_event.value.status_code == 404
    assert archived_event.value.status_code == 400
    assert duplicate.value.status_code == 409
    assert missing_registration.value.status_code == 404
    assert missing_unregister_event.value.status_code == 404


def test_logout_deletes_session_and_cookie(fake_session_storage):
    request = SimpleNamespace(cookies={"session_id": "abc"})
    response = Response()
    fake_session_storage.sessions["abc"] = 1

    result = logout(request, response, fake_session_storage)

    assert result == {"message": "Вы вышли"}
    assert "abc" not in fake_session_storage.sessions
    assert "session_id" in response.headers["set-cookie"]
