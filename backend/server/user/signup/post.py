from fastapi import HTTPException
from sqlmodel import Session, select

from pydantic_visible_fields import visible_fields_response

from models.internal import User, SignUpRequest
from models.external import SignupRequest


def f(
    body: SignupRequest,
    db: Session,

):
    existing_by_email = None
    if body.email:
        existing_by_email = db.exec(
            select(User).where(User.email == body.email)
        ).first()

    if existing_by_email:
        raise HTTPException(
            status_code=409, detail="Пользователь с таким email уже существует"
        )

    existing_by_phone = None
    if body.phone:
        existing_by_phone = db.exec(
            select(User).where(User.phone == body.phone)
        ).first()

    if existing_by_phone:
        raise HTTPException(
            status_code=409, detail="Пользователь с таким телефоном уже существует"
        )

    signup_req = SignUpRequest(
        email=body.email,
        phone=body.phone,
        firstname=body.firstname,
        lastname=body.lastname,
        middlename=body.middlename,
        company=body.company,
    )
    db.add(signup_req)
    db.commit()
    return {"message": "Заявка на регистрацию отправлена. Ожидайте подтверждения."}
