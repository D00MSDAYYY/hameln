# backend/main.py
import uuid
from typing import List
from contextlib import asynccontextmanager

import uvicorn
from sqlmodel import Session, select
from pydantic_visible_fields import visible_fields_response
from fastapi import FastAPI, HTTPException, Response, Request, Depends
from fastapi.middleware.cors import CORSMiddleware

from dbs import init_db, get_session
from models.internal import *
from models.external import *


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Event Manager API", version="0.4.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Словарь сессий (пока в памяти, потом можно в БД или Redis)
sessions_db: dict[str, int] = {}


# ---------------------------------------------------------------------------
# Зависимости
# ---------------------------------------------------------------------------
def get_current_user(request: Request, session: Session = Depends(get_session)) -> User:
    session_id = request.cookies.get("session_id")
    if not session_id or session_id not in sessions_db:
        raise HTTPException(status_code=401, detail="Не авторизован")
    user_id = sessions_db[session_id]
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    return user


def ensure_admin(user: User = Depends(get_current_user)):
    if user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Требуются права администратора")
    return user


def get_current_role(user: User = Depends(get_current_user)) -> Role:
    return user.role


# ---------------------------------------------------------------------------
# Аутентификация
# ---------------------------------------------------------------------------
@app.post("/login", response_model=UserInfoResponse)
async def login(
    login_data: LoginRequest,
    response: Response,
    session: Session = Depends(get_session),
):
    # Ищем пользователя по паролю (временно, потом будет хеш)
    statement = select(User).where(User.password == login_data.password)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(status_code=401, detail="Неверный пароль")

    session_id = uuid.uuid4().hex
    sessions_db[session_id] = user.id  # type: ignore

    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24,
    )
    return visible_fields_response(user, role=user.role)


@app.post("/logout")
async def logout(request: Request, response: Response):
    session_id = request.cookies.get("session_id")
    if session_id and session_id in sessions_db:
        del sessions_db[session_id]
    response.delete_cookie("session_id")
    return {"message": "Вы вышли"}


# ---------------------------------------------------------------------------
# Профиль
# ---------------------------------------------------------------------------
@app.get("/profile", response_model=UserInfoResponse)
async def get_profile(
    user: User = Depends(get_current_user),
    role: Role = Depends(get_current_role),
):
    return visible_fields_response(user, role=role)


@app.patch("/profile", response_model=UserInfoResponse)
async def update_profile(
    profile_data: UserInfoResponse,
    user: User = Depends(get_current_user),
    role: Role = Depends(get_current_role),
    session: Session = Depends(get_session),
):
    data = profile_data.model_dump(
        exclude_unset=True,
        exclude={"id", "role", "created_at"},
    )
    for field, value in data.items():
        if hasattr(user, field):
            setattr(user, field, value)

    session.add(user)
    session.commit()
    session.refresh(user)

    return visible_fields_response(user, role=role)


# ---------------------------------------------------------------------------
# События (пользовательская часть)
# ---------------------------------------------------------------------------
def event_to_response(
    event: Event,
    role: Role,
    user_id: int | None = None,
    session: Session | None = None,
) -> EventInfoResponse:
    """Формирует EventInfoResponse с тегами и флагом регистрации."""
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


@app.get("/events", response_model=List[EventInfoResponse])
async def get_events(
    user: User = Depends(get_current_user),
    role: Role = Depends(get_current_role),
    session: Session = Depends(get_session),
):
    statement = select(Event).where(Event.is_archived == False)
    events = session.exec(statement).all()

    return [event_to_response(e, role, user.id, session) for e in events]


@app.get("/events/{event_id}", response_model=EventInfoResponse)
async def get_event_detail(
    event_id: int,
    user: User = Depends(get_current_user),
    role: Role = Depends(get_current_role),
    session: Session = Depends(get_session),
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")

    return event_to_response(event, role, user.id, session)


@app.post("/events/{event_id}/register")
async def register_for_event(
    event_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    if event.is_archived:
        raise HTTPException(
            status_code=400, detail="Нельзя зарегистрироваться на прошедшее событие"
        )

    # Проверяем существующую регистрацию
    existing = session.exec(
        select(Registration).where(
            Registration.user_id == user.id,
            Registration.event_id == event_id,
        )
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="Вы уже зарегистрированы")

    registration = Registration(user_id=user.id, event_id=event_id)  # type: ignore
    session.add(registration)
    session.commit()

    return {"message": f"Вы зарегистрированы на событие '{event.title}'"}


@app.delete("/events/{event_id}/register")
async def unregister_from_event(
    event_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")

    registration = session.exec(
        select(Registration).where(
            Registration.user_id == user.id,
            Registration.event_id == event_id,
        )
    ).first()

    if not registration:
        raise HTTPException(status_code=404, detail="Регистрация не найдена")

    session.delete(registration)
    session.commit()

    return {"message": f"Регистрация на '{event.title}' отменена"}


# ---------------------------------------------------------------------------
# Теги
# ---------------------------------------------------------------------------
@app.get("/tags", response_model=List[TagInfoResponse])
async def get_tags(
    role: Role = Depends(get_current_role),
    session: Session = Depends(get_session),
):
    tags = session.exec(select(Tag)).all()
    return [visible_fields_response(t, role=role) for t in tags]


# ---------------------------------------------------------------------------
# Уведомления
# ---------------------------------------------------------------------------
@app.get("/notifications", response_model=List[NotificationInfoResponse])
async def get_notifications(
    role: Role = Depends(get_current_role),
    session: Session = Depends(get_session),
):
    notifications = session.exec(select(Notification)).all()
    return [visible_fields_response(n, role=role) for n in notifications]


# ----------------------------------------------
# Настройки
# ----------------------------------------------
@app.get("/settings", response_model=SettingsResponse)
def get_settings(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if not (user_settings := session.get(UserSettingsLink, user.id)):
        user_settings = UserSettingsLink(user_id=user.id)
        session.add(user_settings)
        session.commit()
        session.refresh(user_settings)

    # Защита от незаполненного JSON
    if not user_settings.settings:
        user_settings.settings = Settings().model_dump(mode="json")
        session.add(user_settings)
        session.commit()
        session.refresh(user_settings)

    settings_obj = Settings(**user_settings.settings)
    return visible_fields_response(settings_obj, role=user.role).model_dump()


@app.patch("/settings", response_model=SettingsResponse)
def update_settings(
    new_settings: SettingsResponse,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if not (user_settings := session.get(UserSettingsLink, user.id)):
        user_settings = UserSettingsLink(user_id=user.id)
        session.add(user_settings)
        session.commit()
        session.refresh(user_settings)

    if not user_settings.settings:
        user_settings.settings = Settings().model_dump(mode="json")

    # Явное обновление словаря
    updated_dict = {
        **user_settings.settings,
        **new_settings.model_dump(exclude_unset=True),
    }
    validated = Settings(**updated_dict)
    user_settings.settings = validated.model_dump(
        mode="json"
    )  # присвоение, а не .update()

    session.add(user_settings)
    session.commit()
    session.refresh(user_settings)

    final_settings = Settings(**user_settings.settings)
    return visible_fields_response(final_settings, role=user.role).model_dump()


# ---------------------------------------------------------------------------
# Административные эндпоинты
# ---------------------------------------------------------------------------
@app.get("/admin/events", response_model=List[EventInfoResponse])
async def get_admin_events(
    admin: User = Depends(ensure_admin),
    session: Session = Depends(get_session),
):
    events = session.exec(select(Event)).all()
    return [event_to_response(e, Role.admin, session=session) for e in events]


@app.post("/admin/events", response_model=EventInfoResponse)
async def create_event(
    event_data: EventInfoResponse,
    admin: User = Depends(ensure_admin),
    session: Session = Depends(get_session),
):
    # Создаём событие
    event_dict = event_data.model_dump(exclude={"tags"})
    event = Event(**event_dict)
    session.add(event)
    session.flush()

    # Обрабатываем теги
    for tag_response in event_data.tags:  # type: ignore
        tag_name = tag_response.name
        # Ищем существующий тег или создаём новый
        tag = session.exec(select(Tag).where(tag.title == tag_name)).first()

        if not tag:
            tag = Tag(name=tag_name)
            session.add(tag)
            session.flush()

        # Создаём связь
        event_tag = EventTagLink(event_id=event.id, tag_id=tag.id)  # type: ignore
        session.add(event_tag)

    session.commit()
    session.refresh(event)

    return event_to_response(event, Role.admin, session=session)


@app.patch("/admin/events/{event_id}", response_model=EventInfoResponse)
async def update_event(
    event_id: int,
    event_data: EventInfoResponse,
    admin: User = Depends(ensure_admin),
    session: Session = Depends(get_session),
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")

    update_dict = event_data.model_dump(exclude_unset=True, exclude={"tags"})

    for field, value in update_dict.items():
        if hasattr(event, field):
            setattr(event, field, value)

    # Обновляем теги, если переданы
    if event_data.tags is not None:
        # Удаляем старые связи
        old_links = session.exec(
            select(EventTagLink).where(EventTagLink.event_id == event_id)
        ).all()
        for link in old_links:
            session.delete(link)

        # Добавляем новые
        for tag_response in event_data.tags:
            tag_name = tag_response.name
            tag = session.exec(select(Tag).where(tag.title == tag_name)).first()

            if not tag:
                tag = Tag(name=tag_name)
                session.add(tag)
                session.flush()

            event_tag = EventTagLink(event_id=event.id, tag_id=tag.id)  # type: ignore
            session.add(event_tag)

    session.add(event)
    session.commit()
    session.refresh(event)

    return event_to_response(event, Role.admin, session=session)


@app.delete("/admin/events/{event_id}")
async def delete_event(
    event_id: int,
    admin: User = Depends(ensure_admin),
    session: Session = Depends(get_session),
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")

    # Удаляем связанные записи
    # Регистрации
    registrations = session.exec(
        select(Registration).where(Registration.event_id == event_id)
    ).all()
    for reg in registrations:
        session.delete(reg)

    # Посещения
    attendances = session.exec(
        select(Attendance).where(Attendance.event_id == event_id)
    ).all()
    for att in attendances:
        session.delete(att)

    # Связи с тегами
    links = session.exec(
        select(EventTagLink).where(EventTagLink.event_id == event_id)
    ).all()
    for link in links:
        session.delete(link)

    # Удаляем само событие
    session.delete(event)
    session.commit()

    return {"message": f"Событие удалено"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
