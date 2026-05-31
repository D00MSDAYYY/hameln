from fastapi import HTTPException
from sqlmodel import Session, select

from models.external import SignupRequest
from models.internal import SignUpRequest, User


def f(
    request_id: int,
    body: SignupRequest,
    db: Session,
):
    signup_req = db.get(SignUpRequest, request_id)
    if not signup_req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if body.email:
        existing_user = db.exec(select(User).where(User.email == body.email)).first()
        if existing_user:
            raise HTTPException(
                status_code=409, detail="Пользователь с таким email уже существует"
            )

        existing_request = db.exec(
            select(SignUpRequest).where(
                SignUpRequest.email == body.email,
                SignUpRequest.id != request_id,
            )
        ).first()
        if existing_request:
            raise HTTPException(
                status_code=409, detail="Заявка с таким email уже существует"
            )

    if body.phone:
        existing_user = db.exec(select(User).where(User.phone == body.phone)).first()
        if existing_user:
            raise HTTPException(
                status_code=409, detail="Пользователь с таким телефоном уже существует"
            )

        existing_request = db.exec(
            select(SignUpRequest).where(
                SignUpRequest.phone == body.phone,
                SignUpRequest.id != request_id,
            )
        ).first()
        if existing_request:
            raise HTTPException(
                status_code=409, detail="Заявка с таким телефоном уже существует"
            )

    signup_req.email = body.email
    signup_req.phone = body.phone
    signup_req.firstname = body.firstname
    signup_req.lastname = body.lastname
    signup_req.middlename = body.middlename
    signup_req.company = body.company

    db.add(signup_req)
    db.commit()
    db.refresh(signup_req)

    return signup_req
