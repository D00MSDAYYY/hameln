from sqlmodel import select

from fastapi import HTTPException
from server.aux import user_to_response

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
    return [user_to_response(u, role=admin.role, session=session) for u in users]
