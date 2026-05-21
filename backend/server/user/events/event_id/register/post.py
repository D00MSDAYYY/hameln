from fastapi import HTTPException
from sqlmodel import select

from models.internal import Event, Registration


def f(event_id, user, session):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    if event.is_archived:
        raise HTTPException(
            status_code=400, detail="Нельзя зарегистрироваться на прошедшее событие"
        )

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
