from fastapi import HTTPException
from sqlmodel import Session, select

from models.external import SignupRequest
from models.internal import Role, SignUpRequest, User
from server.aux import get_or_create_company, signup_request_to_response


def f(
    request_id: int,
    body: SignupRequest,
    db: Session,
):
    signup_req = db.get(SignUpRequest, request_id)
    if not signup_req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    existing_user = db.exec(select(User).where(User.phone == body.phone)).first()
    if existing_user:
        raise HTTPException(
            status_code=409, detail="Пользователь с таким телефоном уже существует"
        )

    existing_nickname_user = db.exec(
        select(User).where(User.nickname == body.nickname)
    ).first()
    if existing_nickname_user:
        raise HTTPException(
            status_code=409, detail="Пользователь с таким ником уже существует"
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

    existing_nickname_request = db.exec(
        select(SignUpRequest).where(
            SignUpRequest.nickname == body.nickname,
            SignUpRequest.id != request_id,
        )
    ).first()
    if existing_nickname_request:
        raise HTTPException(
            status_code=409, detail="Заявка с таким ником уже существует"
        )

    signup_req.nickname = body.nickname
    signup_req.phone = body.phone
    signup_req.firstname = body.firstname
    signup_req.lastname = body.lastname
    company = get_or_create_company(db, body.company)
    signup_req.company_id = company.id if company else None

    db.add(signup_req)
    db.commit()
    db.refresh(signup_req)

    return signup_request_to_response(signup_req, role=Role.admin, session=db)
