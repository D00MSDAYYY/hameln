from sqlmodel import select
from fastapi import HTTPException

from models.internal import Event, Attendance, User


def f(event_id, attendant_ids, admin, session):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")

    old_attendants = session.exec(
        select(Attendance).where(Attendance.event_id == event_id)
    ).all()
    for att in old_attendants:
        session.delete(att)

    for uid in attendant_ids:
        session.add(Attendance(user_id=uid, event_id=event_id))

    session.commit()
    return {"message": "Список посетителей обновлён"}
