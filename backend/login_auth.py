# backend/user/login_auth.py
import uuid
import random
from datetime import timedelta

import redis
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select

from models.internal import User, UserSettingsLink, Role
from models.external import UserInfoResponse, LoginRequest
from pydantic_visible_fields import visible_fields_response
from backend.test_db_setup import get_session
from backend.email import send_email

# Конфигурация
SESSION_TTL = 60 * 60 * 24  # 24 часа
VERIFICATION_CODE_TTL = 300  # 5 минут

# Инициализация Redis (можно вынести в отдельный модуль при необходимости)
redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

router = APIRouter(prefix="/auth", tags=["auth"])


# ----- Вспомогательные функции -----
def save_session(session_id: str, user_id: int):
    redis_client.setex(session_id, SESSION_TTL, user_id)


def load_user_id(session_id: str) -> int | None:
    uid = redis_client.get(session_id)
    return int(uid) if uid is not None else None


def delete_session(session_id: str):
    redis_client.delete(session_id)


# ----- Эндпоинты -----


@router.post("/send-code")
async def send_verification_code(email: str):
    """Генерирует код, сохраняет в Redis и отправляет на email."""
    code = str(random.randint(100000, 999999))
    redis_client.setex(f"code:{email}", VERIFICATION_CODE_TTL, code)
    send_email(
        to_address=email,
        subject="Ваш код подтверждения",
        body=f"Ваш код для входа: {code}",
    )
    return {"message": "Код отправлен на указанный email"}


@router.post("/verify-code")
async def verify_code(
    email: str,
    code: str,
    response: Response,
    session: Session = Depends(get_session),
):
    """Проверяет код, создаёт сессию и возвращает пользователя."""
    stored_code = redis_client.get(f"code:{email}")
    if not stored_code or stored_code != code:
        raise HTTPException(status_code=400, detail="Неверный или истекший код")

    # Удаляем код после успешной проверки
    redis_client.delete(f"code:{email}")

    # Ищем пользователя (пока email хранится как nickname)
    user = session.exec(select(User).where(User.nickname == email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Создаём сессию
    session_id = uuid.uuid4().hex
    save_session(session_id, user.id)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=SESSION_TTL,
    )

    return visible_fields_response(user, role=user.role)


@router.post("/register")
async def register_user(
    email: str,
    password: str,
    firstname: str,
    lastname: str,
    response: Response,
    session: Session = Depends(get_session),
):
    """Создаёт пользователя, настройки и сессию."""
    existing = session.exec(select(User).where(User.nickname == email)).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Пользователь с таким email уже существует"
        )

    new_user = User(
        nickname=email,
        firstname=firstname,
        lastname=lastname,
        password=password,
        role=Role.user,
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    # Настройки
    user_settings = UserSettingsLink(user_id=new_user.id)
    session.add(user_settings)
    session.commit()

    # Сессия
    session_id = uuid.uuid4().hex
    save_session(session_id, new_user.id)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=SESSION_TTL,
    )

    return visible_fields_response(new_user, role=new_user.role)


# Если нужно оставить старый login по паролю – оставьте здесь или перенесите
@router.post("/user/login")
async def login_by_password(
    login_data: LoginRequest,
    response: Response,
    session: Session = Depends(get_session),
):
    """Вход по паролю (старый способ, если ещё нужен)."""
    user = session.exec(
        select(User).where(User.password == login_data.password)
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="Неверный пароль")

    session_id = uuid.uuid4().hex
    save_session(session_id, user.id)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=SESSION_TTL,
    )
    return visible_fields_response(user, role=user.role)
