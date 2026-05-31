from datetime import date

from pydantic import BaseModel


class SignupRequest(BaseModel):
    email: str
    firstname: str
    lastname: str
    middlename: str
    company: str


class LoginCodeRequest(BaseModel):
    email: str


class VerifyCodeRequest(BaseModel):
    email: str
    code: str


class ReportRequest(BaseModel):
    date_from: date
    date_to: date
