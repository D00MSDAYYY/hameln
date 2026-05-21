from sqlmodel import select

from fastapi import HTTPException

from models.internal import Event, Registration



def f(event_id, user, session):
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
