import uuid
from fastapi import Response, HTTPException
from sqlmodel import Session, select

from pydantic_visible_fields import visible_fields_response

from models.internal import User, UserSettingsLink, Role
from models.external import SignupRequest, UserInfoResponse
from server.user_session_storage import UserSessionStorage


def f(
    body: SignupRequest,
    response: Response,
    db: Session,
    user_sessions_storage: UserSessionStorage,
) -> UserInfoResponse:
    existing = db.exec(select(User).where(User.nickname == body.email)).first()
    if existing:
        raise HTTPException(
            status_code=409, detail="Пользователь с таким email уже существует"
        )

    user = User(
        nickname=body.firstname,
        firstname=body.firstname,
        lastname=body.lastname,
        middlename=body.middlename,
        company=body.company,
        email=body.email,
        role=Role.user,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    settings = UserSettingsLink(user_id=user.id)  # type: ignore
    db.add(settings)
    db.commit()

    session_id = user_sessions_storage.generate_uid()
    user_sessions_storage.save_session(session_id, user.id)

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
