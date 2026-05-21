from fastapi import HTTPException

from models.internal import Event
from aux import event_to_response


def f(event_id, user, session):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")

    return event_to_response(event, user.role, user.id, session)
