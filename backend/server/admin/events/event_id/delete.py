from fastapi import HTTPException

from models.internal import Event


def f(event_id, admin, session):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")

    session.delete(event)
    session.commit()
    return {"message": f"Событие удалено"}
