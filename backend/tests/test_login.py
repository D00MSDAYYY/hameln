import pytest
from fastapi import HTTPException, Response

from models.external import LoginRequest
from server.endpoints.user.login.post import f as login


def test_login_sets_cookie_and_saves_session(db_session, fake_session_storage, user_factory):
    user = user_factory(phone="+79990001122", nickname="+79990001122", password="secret")
    response = Response()

    result = login(
        LoginRequest(phone="9990001122", password="secret"),
        response,
        db_session,
        fake_session_storage,
    )

    assert fake_session_storage.sessions["test-session-id"] == user.id
    assert "session_id=test-session-id" in response.headers["set-cookie"]
    assert result.phone == "+79990001122"


def test_login_rejects_wrong_password(db_session, fake_session_storage, user_factory):
    user_factory(phone="+79990001122", nickname="+79990001122", password="secret")

    with pytest.raises(HTTPException) as exc:
        login(
            LoginRequest(phone="+79990001122", password="wrong"),
            Response(),
            db_session,
            fake_session_storage,
        )

    assert exc.value.status_code == 401
    assert exc.value.detail == "Неверный телефон или пароль"
