from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uvicorn
from models import *

app = FastAPI(title="Event Manager API", version="0.1.0")

# Разрешаем запросы с любого источника (для разработки)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

users_db: List[User] = [
    User(id=1, nickname="ivanov", points=150, role="user"),
    User(id=2, nickname="admin", points=999, role="admin"),
]

events_db: List[Event] = [
    Event(id=1, name="Конференция по React", tags=["React", "Frontend"], points=150, date="2025-05-25T10:00", is_archived=False),
    Event(id=2, name="Воркшоп по FastAPI", tags=["Python", "Backend", "API"], points=200, date="2025-05-27T14:00", is_archived=False),
    Event(id=3, name="Встреча сообщества VK Mini Apps", tags=["VK", "Mini Apps", "Сообщество"], points=75, date="2025-05-30T18:30", is_archived=False),
    Event(id=4, name="Прошедший хакатон", tags=["iOS", "Android"], points=300, date="2024-12-01T10:00", is_archived=True),
]

notifications_db: List[Notification] = [
    Notification(id=1, title="Напоминание", body="Не забудьте зарегистрироваться на конференцию"),
]

registrations_db: List[Registration] = []

# Счётчики для новых ID
event_id_counter = max(e.id for e in events_db) + 1
notification_id_counter = max(n.id for n in notifications_db) + 1

# ========== Вспомогательные функции ==========

def get_user_or_404(user_id: int) -> User:
    user = next((u for u in users_db if u.id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

def ensure_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Требуются права администратора")

# ========== Эндпоинты ==========

@app.get("/profile", response_model=User)
async def get_profile(user_id: int = Query(...)):
    """Возвращает профиль пользователя: nickname, points, список зарегистрированных событий."""
    user = get_user_or_404(user_id)
    reg_events = []
    for reg in registrations_db:
        if reg.user_id == user.id:
            event = next((e for e in events_db if e.id == reg.event_id), None)
            if event:
                reg_events.append(event)
    return {
        "nickname": user.nickname,
        "points": user.points,
        "registered_events": reg_events,
    }

@app.get("/events", response_model=List[Event])
async def get_events():
    """Возвращает все активные события (не архивные)."""
    return [e for e in events_db if not e.is_archived]

@app.get("/events/archived", response_model=List[Event])
async def get_archived_events():
    """Возвращает все архивные события."""
    return [e for e in events_db if e.is_archived]

@app.get("/events/{event_id}", response_model=Event)
async def get_event_info(event_id: int):
    """Возвращает информацию о конкретном событии."""
    event = next((e for e in events_db if e.id == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    return event

@app.post("/events/{event_id}/register")
async def register_for_event(event_id: int, user_id: int = Query(...)):
    """Зарегистрировать пользователя на событие."""
    user = get_user_or_404(user_id)
    event = next((e for e in events_db if e.id == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    if event.is_archived:
        raise HTTPException(status_code=400, detail="Нельзя зарегистрироваться на прошедшее событие")
    # Проверим, не зарегистрирован ли уже
    if any(r.user_id == user.id and r.event_id == event_id for r in registrations_db):
        raise HTTPException(status_code=409, detail="Вы уже зарегистрированы")
    registrations_db.append(Registration(user_id=user.id, event_id=event_id))
    return {"message": f"Вы зарегистрированы на событие '{event.name}'"}

@app.delete("/events/{event_id}/register")
async def unregister_from_event(event_id: int, user_id: int = Query(...)):
    """Отменить регистрацию на событие."""
    user = get_user_or_404(user_id)
    event = next((e for e in events_db if e.id == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    reg = next((r for r in registrations_db if r.user_id == user.id and r.event_id == event_id), None)
    if not reg:
        raise HTTPException(status_code=404, detail="Регистрация не найдена")
    registrations_db.remove(reg)
    return {"message": f"Регистрация на событие '{event.name}' отменена"}

@app.get("/notifications", response_model=List[Notification])
async def get_notifications():
    """Возвращает все уведомления (в реальном приложении — для конкретного пользователя)."""
    # Здесь может быть фильтрация по пользователю
    return notifications_db

# ========== Административные эндпоинты ==========

@app.get("/admin/users", response_model=List[User])
async def get_users(user_id: int = Query(...)):
    """Получить список всех пользователей (только для админа)."""
    user = get_user_or_404(user_id)
    ensure_admin(user)
    return users_db

@app.get("/admin/events/{event_id}/attendants", response_model=List[User])
async def get_attendants_of_event(event_id: int, user_id: int = Query(...)):
    """Получить список участников события (только для админа)."""
    user = get_user_or_404(user_id)
    ensure_admin(user)
    event = next((e for e in events_db if e.id == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    attendant_ids = [r.user_id for r in registrations_db if r.event_id == event_id]
    return [u for u in users_db if u.id in attendant_ids]

@app.post("/admin/events", response_model=Event)
async def post_event(user_id: int = Query(...), name: str = "", description: Optional[str] = None, tags: List[str] = [], points: int = 0, date: str = "", is_archived: bool = False):
    """Создать новое событие (только для админа)."""
    user = get_user_or_404(user_id)
    ensure_admin(user)
    global event_id_counter
    new_event = Event(id=event_id_counter, name=name, description=description, tags=tags, points=points, date=date, is_archived=is_archived)
    events_db.append(new_event)
    event_id_counter += 1
    return new_event

@app.patch("/admin/events/{event_id}", response_model=Event)
async def patch_event(event_id: int, user_id: int = Query(...), name: Optional[str] = None, description: Optional[str] = None, tags: Optional[List[str]] = None, points: Optional[int] = None, date: Optional[str] = None, is_archived: Optional[bool] = None):
    """Редактировать событие (только для админа)."""
    user = get_user_or_404(user_id)
    ensure_admin(user)
    event = next((e for e in events_db if e.id == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    if name is not None: event.name = name
    if description is not None: event.description = description
    if tags is not None: event.tags = tags
    if points is not None: event.points = points
    if date is not None: event.date = date
    if is_archived is not None: event.is_archived = is_archived
    return event

@app.post("/admin/notifications", response_model=Notification)
async def post_notification(user_id: int = Query(...), title: str = "", body: Optional[str] = None):
    """Создать уведомление (только для админа)."""
    user = get_user_or_404(user_id)
    ensure_admin(user)
    global notification_id_counter
    new_notif = Notification(id=notification_id_counter, title=title, body=body)
    notifications_db.append(new_notif)
    notification_id_counter += 1
    return new_notif

@app.patch("/admin/notifications/{notification_id}", response_model=Notification)
async def patch_notification(notification_id: int, user_id: int = Query(...), title: Optional[str] = None, body: Optional[str] = None):
    """Редактировать уведомление (только для админа)."""
    user = get_user_or_404(user_id)
    ensure_admin(user)
    notif = next((n for n in notifications_db if n.id == notification_id), None)
    if not notif:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    if title is not None: notif.title = title
    if body is not None: notif.body = body
    return notif

# ========== Запуск ==========

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)