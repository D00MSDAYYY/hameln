import pytest
from fastapi import HTTPException
from sqlmodel import select

from models.external import SignupRequest
from models.internal import SignUpRequest, User
from server.endpoints.user.signup.post import f as signup


def make_signup_request(phone="+79990001122"):
    return SignupRequest(
        nickname="ivan",
        phone=phone,
        firstname="Иван",
        lastname="Иванов",
        company="Test",
    )


def test_signup_creates_registration_request(db_session):
    result = signup(make_signup_request(), db_session)

    signup_request = db_session.exec(select(SignUpRequest)).one()

    assert result["message"] == "Заявка на регистрацию отправлена. Ожидайте подтверждения."
    assert signup_request.nickname == "ivan"
    assert signup_request.phone == "+79990001122"
    assert signup_request.firstname == "Иван"


def test_signup_rejects_existing_user(db_session, user_factory):
    user_factory(phone="+79990001122", nickname="+79990001122")

    with pytest.raises(HTTPException) as exc:
        signup(make_signup_request(), db_session)

    assert exc.value.status_code == 409
    assert exc.value.detail == "Пользователь с таким телефоном уже существует"


def test_signup_rejects_existing_request(db_session):
    db_session.add(
        SignUpRequest(
            nickname="ivan",
            phone="+79990001122",
            firstname="Иван",
            lastname="Иванов",
            company="Test",
        )
    )
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        signup(make_signup_request(), db_session)

    assert exc.value.status_code == 409
    assert exc.value.detail == "Заявка с таким телефоном уже существует"
