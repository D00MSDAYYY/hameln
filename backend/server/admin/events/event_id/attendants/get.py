from sqlmodel import select

from fastapi import HTTPException
from pydantic_visible_fields import visible_fields_response

from models.internal import Event, Attendance, User


def f(event_id, admin, session):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")

    attendant_ids = session.exec(
        select(Attendance.user_id).where(Attendance.event_id == event_id)
    ).all()

    if not attendant_ids:
        return []

    statement = select(User).where(
        User.id.in_(attendant_ids)  # type: ignore[attr-defined]
    )
    users = session.exec(statement).all()
    return [visible_fields_response(u, role=admin.role) for u in users]
