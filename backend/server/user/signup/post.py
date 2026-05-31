from fastapi import HTTPException
from sqlmodel import Session, select

from pydantic_visible_fields import visible_fields_response

from models.internal import User, SignUpRequest
from models.external import SignupRequest


def f(
    body: SignupRequest,
    db: Session,

):
    existing = db.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(
            status_code=409, detail="Пользователь с таким email уже существует"
        )

    signup_req = SignUpRequest(
        email=body.email,
        firstname=body.firstname,
        lastname=body.lastname,
        middlename=body.middlename,
        company=body.company,
    )
    db.add(signup_req)
    db.commit()
    return {"message": "Заявка на регистрацию отправлена. Ожидайте подтверждения."}
