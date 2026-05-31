from fastapi import HTTPException
from sqlmodel import select
from pydantic_visible_fields import visible_fields_response
from server.user_session_storage import UserSessionStorage

from models.internal import User


def f(
    login_data,
    response,
    db_session,
    user_sessions_storage:UserSessionStorage,
):
    user = db_session.exec(
        select(User).where(User.password == login_data.password)
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Неверный пароль")

    session_id = user_sessions_storage.generate_uid()

    user_sessions_storage.save_session(session_id, user.id)  # type: ignore # <-- Redis # TODO

    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=user_sessions_storage.SESSION_TTL,
    )

    return visible_fields_response(user, role=user.role)
