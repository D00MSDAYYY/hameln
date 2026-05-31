from sqlmodel import select
from fastapi import HTTPException
from server.aux import user_to_response


from models.internal import Role, User


REQUIRED_STRING_FIELDS = {"nickname", "firstname", "middlename", "lastname", "password"}


def normalize_create_dict(user_data):
    data = user_data.model_dump(
        exclude_unset=True,
        exclude={"id", "role", "created_at"},
    )

    for field in REQUIRED_STRING_FIELDS:
        value = data.get(field)

        if value is None:
            value = ""
            data[field] = value

        if field != "middlename" and not str(value).strip():
            raise HTTPException(status_code=400, detail="Заполните обязательные поля")

    return data


def f(user_data, admin, session):
    existing = session.exec(
        select(User).where(User.nickname == user_data.nickname)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Пользователь с таким никнеймом уже существует"
        )

    create_dict = normalize_create_dict(user_data)

    new_user = User(
        **create_dict,
        role=Role(user_data.role) if user_data.role else Role.user,
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return user_to_response(new_user, role=admin.role)
