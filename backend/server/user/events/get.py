from sqlmodel import select

from models.internal import Event
from aux import event_to_response

def f(user,session):
    statement = select(Event).where(Event.is_archived == False)
    events = session.exec(statement).all()

    return [event_to_response(e, user.role, user.id, session) for e in events]