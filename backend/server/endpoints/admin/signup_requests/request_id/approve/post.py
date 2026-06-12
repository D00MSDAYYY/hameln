import secrets

from models.internal import SignUpRequest
from sqlmodel import Session, select
from fastapi import HTTPException
from models.internal import User, Role, UserSettingsLink
from server.aux import user_display_name


def f(
    request_id: int,
    db: Session,
):
    signup_req = db.get(SignUpRequest, request_id)
    if not signup_req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    existing_user = db.exec(select(User).where(User.phone == signup_req.phone)).first()
    if existing_user:
        raise HTTPException(
            status_code=400, detail="Пользователь с таким телефоном уже существует"
        )

    display_name = user_display_name(signup_req)
    password = secrets.token_urlsafe(9)

    new_user = User(
        **signup_req.model_dump(exclude={"id", "created_at"}),
        password=password,
        role=Role.user,
    )
    db.add(new_user)
    db.flush()

    user_settings = UserSettingsLink(user_id=new_user.id)  # type: ignore
    db.add(user_settings)

    db.delete(signup_req)
    db.commit()
    return {"message": f"Пользователь {display_name} создан. Пароль: {password}"}
