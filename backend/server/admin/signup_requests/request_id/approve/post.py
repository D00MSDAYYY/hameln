import secrets

from models.internal import SignUpRequest
from sqlmodel import Session, select
from fastapi import HTTPException
from models.internal import User, Role, UserSettingsLink


def f(
    request_id: int,
    db: Session,
):
    signup_req = db.get(SignUpRequest, request_id)
    if not signup_req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    existing_by_email = None
    if signup_req.email:
        existing_by_email = db.exec(
            select(User).where(User.email == signup_req.email)
        ).first()

    if existing_by_email:
        raise HTTPException(
            status_code=400, detail="Пользователь с таким email уже существует"
        )

    existing_by_phone = None
    if signup_req.phone:
        existing_by_phone = db.exec(
            select(User).where(User.phone == signup_req.phone)
        ).first()

    if existing_by_phone:
        raise HTTPException(
            status_code=400, detail="Пользователь с таким телефоном уже существует"
        )

    nickname = signup_req.email or signup_req.phone
    password = secrets.token_urlsafe(9)

    new_user = User(
        **signup_req.model_dump(exclude={"id", "created_at"}),
        nickname=nickname,
        password=password,
        role=Role.user,
    )
    db.add(new_user)
    db.flush()

    user_settings = UserSettingsLink(user_id=new_user.id)  # type: ignore
    db.add(user_settings)

    db.delete(signup_req)
    db.commit()
    return {"message": f"Пользователь {nickname} создан. Пароль: {password}"}
