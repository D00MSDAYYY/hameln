from pydantic_visible_fields import visible_fields_response
from fastapi import HTTPException, Cookie
from sqlmodel import Session, select

from models.internal import *
from models.external import *


def get_session_id_from_cookie():
    return Cookie(None, alias="session_id")


def get_current_user(
    session_id,
    session,
    user_sessions_storage,
) -> User:
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = user_sessions_storage.get(session_id)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def ensure_admin(user):
    if user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Требуются права администратора")
    return user


def event_to_response(
    event: Event,
    role: Role,
    user_id: int | None = None,
    session: Session | None = None,
):
    data = visible_fields_response(event, role=role)

    # Получаем теги через связи
    tags = []
    if session:
        statement = (
            select(Tag).join(EventTagLink).where(EventTagLink.event_id == event.id)
        )
        tags = session.exec(statement).all()

    tag_responses = [
        TagInfoResponse(**visible_fields_response(t, role=role).model_dump())
        for t in tags
    ]

    update_dict = data.model_dump()
    update_dict["tags"] = tag_responses

    # Проверяем регистрацию
    if user_id and session:
        registration = session.exec(
            select(Registration).where(
                Registration.user_id == user_id,
                Registration.event_id == event.id,
            )
        ).first()
        update_dict["is_registered"] = registration is not None

    return EventInfoResponse(**update_dict)
