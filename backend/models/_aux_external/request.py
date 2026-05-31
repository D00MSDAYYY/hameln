from datetime import date

from pydantic import BaseModel, EmailStr, field_validator, model_validator


class SignupRequest(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None
    firstname: str
    lastname: str
    middlename: str
    company: str

    @field_validator("email", "phone", mode="before")
    @classmethod
    def empty_contact_to_none(cls, value):
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @model_validator(mode="after")
    def validate_contact(self):
        if not self.email and not self.phone:
            raise ValueError("Укажите email или телефон")
        return self


class LoginRequest(BaseModel):
    contact: str
    password: str


class UserRequest(BaseModel):
    nickname: str | None = None
    role: str | None = None
    firstname: str | None = None
    middlename: str | None = None
    lastname: str | None = None
    points: int | None = None
    company: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    password: str | None = None


class ReportRequest(BaseModel):
    date_from: date
    date_to: date
