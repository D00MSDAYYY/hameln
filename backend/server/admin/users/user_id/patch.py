from sqlmodel import select
from fastapi import HTTPException
from pydantic_visible_fields import visible_fields_response


from models.internal import User, Role


def f(user_id, user_data, admin, session):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Обновляем только переданные поля
    update_dict = user_data.model_dump(exclude_unset=True, exclude={"id", "created_at"})

    # Проверяем уникальность никнейма, если он меняется
    if "nickname" in update_dict and update_dict["nickname"] != user.nickname:
        existing = session.exec(
            select(User).where(User.nickname == update_dict["nickname"])
        ).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="Пользователь с таким никнеймом уже существует"
            )

    for field, value in update_dict.items():
        if field == "role" and value:
            setattr(user, field, Role(value))
        elif field == "password" and not value:
            continue  # пустой пароль — не меняем
        elif hasattr(user, field):
            setattr(user, field, value)

    session.add(user)
    session.commit()
    session.refresh(user)

    return visible_fields_response(user, role=admin.role)
