from fastapi import HTTPException
from sqlmodel import or_, select
from server.aux import user_to_response
from server.user_session_storage import UserSessionStorage

from models.internal import User


def f(
    login_data,
    response,
    db_session,
    user_sessions_storage: UserSessionStorage,
):
    contact = login_data.contact.strip()
    user = db_session.exec(
        select(User).where(
            or_(
                User.email == contact,
                User.phone == contact,
            ),
            User.password == login_data.password,
        )
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Неверный контакт или пароль")

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

    return user_to_response(user, role=user.role)
