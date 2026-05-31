from fastapi import HTTPException
from sqlmodel import Session, select

from models.internal import User, SignUpRequest
from models.external import SignupRequest


def f(
    body: SignupRequest,
    db: Session,

):
    existing_user = db.exec(select(User).where(User.phone == body.phone)).first()
    if existing_user:
        raise HTTPException(
            status_code=409, detail="Пользователь с таким телефоном уже существует"
        )

    existing_request = db.exec(
        select(SignUpRequest).where(SignUpRequest.phone == body.phone)
    ).first()
    if existing_request:
        raise HTTPException(
            status_code=409, detail="Заявка с таким телефоном уже существует"
        )

    signup_req = SignUpRequest(
        phone=body.phone,
        firstname=body.firstname,
        lastname=body.lastname,
        company=body.company,
    )
    db.add(signup_req)
    db.commit()
    return {"message": "Заявка на регистрацию отправлена. Ожидайте подтверждения."}
