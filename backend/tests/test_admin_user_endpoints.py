from datetime import datetime

import pytest
from fastapi import HTTPException
from sqlmodel import select

from models.external import UserRequest
from models.internal import Attendance, Event, Registration, Role, User, UserSettingsLink
from server.endpoints.admin.search.get import f as search_users
from server.endpoints.admin.users.get import f as get_users
from server.endpoints.admin.users.post import f as create_user
from server.endpoints.admin.users.user_id.delete import f as delete_user
from server.endpoints.admin.users.user_id.patch import f as update_user


def test_admin_users_list_create_update_search_delete(db_session, user_factory):
    admin = user_factory(phone="+79990000001", role=Role.admin)

    created = create_user(
        UserRequest(
            firstname="Иван",
            lastname="Петров",
            phone="+79990000002",
            password="secret",
            role="user",
            points=10,
            company="Create Company",
        ),
        admin,
        db_session,
    )
    updated = update_user(
        created.id,
        UserRequest(firstname="Петр", company="Updated Company", points=20),
        admin,
        db_session,
    )
    search_result = search_users("Пет", admin, db_session)
    users = get_users(admin, db_session)
    delete_result = delete_user(created.id, admin, db_session)

    assert created.company == "Create Company"
    assert updated.firstname == "Петр"
    assert updated.company == "Updated Company"
    assert updated.points == 20
    assert [(user.firstname, user.lastname) for user in search_result] == [("Петр", "Петров")]
    assert {user.phone for user in users} >= {"+79990000001", "+79990000002"}
    assert delete_result == {"message": "Пользователь Петр Петров удалён"}
    assert db_session.get(User, created.id) is None


def test_admin_create_user_defaults_role_and_rejects_missing_required(db_session, user_factory):
    admin = user_factory(phone="+79990000001", role=Role.admin)

    created = create_user(
        UserRequest(
            firstname="Иван",
            lastname="Петров",
            phone="+79990000002",
            password="secret",
        ),
        admin,
        db_session,
    )

    with pytest.raises(HTTPException) as missing_password:
        create_user(
            UserRequest(
                firstname="Иван",
                lastname="Петров",
                phone="+79990000003",
            ),
            admin,
            db_session,
        )

    assert created.role == Role.user
    assert missing_password.value.status_code == 400


def test_admin_user_create_and_update_validation_errors(db_session, user_factory):
    admin = user_factory(phone="+79990000001", role=Role.admin)
    existing = user_factory(phone="+79990000002")
    with pytest.raises(HTTPException) as duplicate_phone:
        create_user(
            UserRequest(
                firstname="Иван",
                lastname="Петров",
                phone="+79990000002",
                password="secret",
            ),
            admin,
            db_session,
        )
    with pytest.raises(HTTPException) as missing_user:
        update_user(999, UserRequest(firstname="Иван"), admin, db_session)
    with pytest.raises(HTTPException) as duplicate_phone_update:
        update_user(admin.id, UserRequest(phone="+79990000002"), admin, db_session)
    with pytest.raises(HTTPException) as none_required:
        update_user(existing.id, UserRequest(firstname=None), admin, db_session)

    assert duplicate_phone.value.status_code == 400
    assert missing_user.value.status_code == 404
    assert duplicate_phone_update.value.status_code == 400
    assert none_required.value.status_code == 400


def test_admin_update_user_role_phone_password_and_ignores_unknown_fields(
    db_session,
    user_factory,
):
    admin = user_factory(phone="+79990000001", role=Role.admin)
    user = user_factory(phone="+79990000002", password="old")

    updated = update_user(
        user.id,
        UserRequest(role="observer", phone="+79990000003", password=""),
        admin,
        db_session,
    )
    stored = db_session.get(User, user.id)

    assert updated.role == Role.observer
    assert updated.phone == "+79990000003"
    assert stored.password == "old"


def test_admin_search_requires_two_characters(db_session, user_factory):
    admin = user_factory(role=Role.admin)
    user_factory(phone="+79990000002")

    assert search_users("", admin, db_session) == []
    assert search_users("t", admin, db_session) == []


def test_delete_user_removes_related_rows(db_session, user_factory):
    admin = user_factory(phone="+79990000001", role=Role.admin)
    user = user_factory(phone="+79990000002")
    event = Event(title="Event", date=datetime(2026, 7, 1, 12, 0))
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)
    db_session.add(Registration(user_id=user.id, event_id=event.id))
    db_session.add(Attendance(user_id=user.id, event_id=event.id))
    db_session.add(UserSettingsLink(user_id=user.id))
    db_session.commit()

    delete_user(user.id, admin, db_session)

    assert db_session.exec(select(Registration)).all() == []
    assert db_session.exec(select(Attendance)).all() == []
    assert db_session.get(UserSettingsLink, user.id) is None


def test_delete_user_missing_returns_404(db_session, user_factory):
    admin = user_factory(role=Role.admin)

    with pytest.raises(HTTPException) as exc:
        delete_user(999, admin, db_session)

    assert exc.value.status_code == 404
