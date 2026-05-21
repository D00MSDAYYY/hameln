from sqlmodel import select
from fastapi import HTTPException
from pydantic_visible_fields import visible_fields_response


from models.internal import User


def f(user_data, admin, session):
    existing = session.exec(
        select(User).where(User.nickname == user_data.nickname)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Пользователь с таким никнеймом уже существует"
        )

    new_user = User(
        **user_data.model_dump(
            exclude_unset=True,
            exclude={"id", "role", "created_at"},
        )
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return visible_fields_response(new_user, role=admin.role)
