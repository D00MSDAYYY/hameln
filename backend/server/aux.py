from pydantic_visible_fields import visible_fields_response
from fastapi import HTTPException, Cookie, Request
from sqlmodel import Session, select

from server.session_storage._session_storage import SessionStorage
from models.internal import *
from models.external import *


def get_session_id_from_cookie(request: Request):
    return request.cookies.get("session_id")


def get_current_user(
    session_id,
    session,
    user_sessions_storage: SessionStorage,
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


def normalize_company_name(name: str | None) -> str | None:
    if not name:
        return None

    normalized = " ".join(name.split()).strip()
    return normalized or None


def get_or_create_company(session: Session, company_name: str | None) -> Company | None:
    name = normalize_company_name(company_name)
    if not name:
        return None

    company = session.exec(select(Company).where(Company.name == name)).first()
    if company:
        return company

    company = Company(name=name)
    session.add(company)
    session.flush()
    return company


def get_company_name(session: Session | None, company_id: int | None) -> str | None:
    if not session or company_id is None:
        return None

    company = session.get(Company, company_id)
    return company.name if company else None


def user_to_response(user: User, role: Role, session: Session | None = None):
    data = UserInfoResponse.model_validate(user, from_attributes=True)
    response = visible_fields_response(data, role=role)
    if role in (Role.user, Role.admin):
        response.company = get_company_name(session, user.company_id)
    return response


def signup_request_to_response(
    signup_request: SignUpRequest,
    role: Role,
    session: Session | None = None,
):
    data = SignupRequestInfoResponse.model_validate(signup_request, from_attributes=True)
    response = visible_fields_response(data, role=role)
    response.company = get_company_name(session, signup_request.company_id)
    return response


def event_to_response(
    event: Event,
    role: Role,
    user_id: int | None = None,
    session: Session | None = None,
    include_registered_users: bool = False,
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

    if include_registered_users and session:
        registered_users = session.exec(
            select(User)
            .join(Registration, Registration.user_id == User.id)
            .where(Registration.event_id == event.id)
            .order_by(User.lastname, User.firstname)
        ).all()
        update_dict["registered_users"] = [
            EventRegistrantResponse(
                firstname=user.firstname,
                lastname=user.lastname,
                company=get_company_name(session, user.company_id),
            )
            for user in registered_users
        ]

    return EventInfoResponse(**update_dict)
