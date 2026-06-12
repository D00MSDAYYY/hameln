from fastapi import HTTPException
from sqlmodel import Session, select

from server.aux import get_or_create_company
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

    company = get_or_create_company(db, body.company)

    signup_req = SignUpRequest(
        phone=body.phone,
        firstname=body.firstname,
        lastname=body.lastname,
        company_id=company.id if company else None,
    )
    db.add(signup_req)
    db.commit()
    return {"message": "Заявка на регистрацию отправлена. Ожидайте подтверждения."}
