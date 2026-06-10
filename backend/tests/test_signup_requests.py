from sqlmodel import select

from models.internal import SignUpRequest, User, UserSettingsLink
from server.endpoints.admin.signup_requests.request_id.approve.post import f as approve_signup_request


def test_approve_signup_request_creates_user_and_deletes_request(db_session, monkeypatch):
    signup_request = SignUpRequest(
        nickname="ivan",
        phone="+79990001122",
        firstname="Иван",
        lastname="Иванов",
        company="Test",
    )
    db_session.add(signup_request)
    db_session.commit()
    db_session.refresh(signup_request)

    monkeypatch.setattr(
        "server.endpoints.admin.signup_requests.request_id.approve.post.secrets.token_urlsafe",
        lambda length: "generated-password",
    )

    result = approve_signup_request(signup_request.id, db_session)

    user = db_session.exec(select(User).where(User.phone == "+79990001122")).one()
    settings = db_session.get(UserSettingsLink, user.id)

    assert result["message"] == "Пользователь ivan создан. Пароль: generated-password"
    assert user.nickname == "ivan"
    assert user.password == "generated-password"
    assert db_session.get(SignUpRequest, signup_request.id) is None
    assert settings is not None
