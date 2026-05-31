from datetime import date

from pydantic import BaseModel, field_validator


class SignupRequest(BaseModel):
    phone: str
    firstname: str
    lastname: str
    company: str

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, value):
        if isinstance(value, str) and not value.strip():
            raise ValueError("Укажите телефон")
        if isinstance(value, str):
            return value.strip()
        return value


class LoginRequest(BaseModel):
    phone: str
    password: str


class UserRequest(BaseModel):
    nickname: str | None = None
    role: str | None = None
    firstname: str | None = None
    lastname: str | None = None
    points: int | None = None
    company: str | None = None
    phone: str | None = None
    password: str | None = None


class ReportRequest(BaseModel):
    date_from: date
    date_to: date
