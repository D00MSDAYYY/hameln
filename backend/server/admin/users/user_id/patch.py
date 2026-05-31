from sqlmodel import select
from fastapi import HTTPException
from server.aux import user_to_response


from models.internal import User, Role


REQUIRED_STRING_FIELDS = {"nickname", "firstname", "middlename", "lastname"}


def normalize_update_dict(update_dict):
    normalized = {}

    for field, value in update_dict.items():
        if field in REQUIRED_STRING_FIELDS:
            if value is None:
                value = ""
            if field != "middlename" and not str(value).strip():
                raise HTTPException(status_code=400, detail="Заполните обязательные поля")

        normalized[field] = value

    return normalized


def f(user_id, user_data, admin, session):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Обновляем только переданные поля
    update_dict = normalize_update_dict(
        user_data.model_dump(exclude_unset=True, exclude={"id", "created_at"})
    )

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

    return user_to_response(user, role=admin.role)
