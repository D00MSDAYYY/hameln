import pytest
from pydantic import ValidationError

from models.external import LoginRequest, SignupRequest
from models._aux_external.aux import normalize_russian_phone


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("9990001122", "+79990001122"),
        ("79990001122", "+79990001122"),
        ("89990001122", "+79990001122"),
        ("+7 (999) 000-11-22", "+79990001122"),
    ],
)
def test_normalize_russian_phone(raw, expected):
    assert normalize_russian_phone(raw) == expected


@pytest.mark.parametrize("raw", ["", "123", "+1 999 000 11 22"])
def test_normalize_russian_phone_rejects_invalid_values(raw):
    with pytest.raises(ValueError):
        normalize_russian_phone(raw)


def test_signup_request_normalizes_phone_and_accepts_valid_names():
    request = SignupRequest(
        phone="8 (999) 000-11-22",
        firstname="Анна-Мария",
        lastname="Иванова",
        company="Test",
    )

    assert request.phone == "+79990001122"
    assert request.firstname == "Анна-Мария"


@pytest.mark.parametrize("firstname", ["Иван1", "Иван_Петров", ""])
def test_signup_request_rejects_invalid_firstname(firstname):
    with pytest.raises(ValidationError):
        SignupRequest(
            phone="+79990001122",
            firstname=firstname,
            lastname="Иванов",
            company="Test",
        )


def test_login_request_normalizes_phone():
    request = LoginRequest(phone="9990001122", password="secret")

    assert request.phone == "+79990001122"
