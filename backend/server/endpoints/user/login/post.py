from fastapi import HTTPException
from sqlmodel import select
from server.aux import user_to_response
from server.session_storage._session_storage import SessionStorage

from models.internal import User


def f(
    login_data,
    response,
    db_session,
    user_sessions_storage: SessionStorage,
):
    phone = login_data.phone.strip()
    user = db_session.exec(
        select(User).where(
            User.phone == phone,
            User.password == login_data.password,
        )
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Неверный телефон или пароль")

    session_id = user_sessions_storage.generate_uid()

    user_sessions_storage.save_session(session_id, user.id)  # type: ignore # <-- Redis # TODO

    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=user_sessions_storage.session_ttl,
    )

    return user_to_response(user, role=user.role, session=db_session)
