from datetime import date

from pydantic import BaseModel, field_validator

from .aux import PersonName, normalize_russian_phone


class SignupRequest(BaseModel):
    phone: str
    firstname: PersonName
    lastname: PersonName
    company: str

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, value):
        return normalize_russian_phone(value)


class LoginRequest(BaseModel):
    phone: str
    password: str

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, value):
        return normalize_russian_phone(value)


class UserRequest(BaseModel):
    role: str | None = None
    firstname: PersonName | None = None
    lastname: PersonName | None = None
    points: int | None = None
    company: str | None = None
    phone: str | None = None
    password: str | None = None

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, value):
        return normalize_russian_phone(value)


class ReportRequest(BaseModel):
    date_from: date
    date_to: date
