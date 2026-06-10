from sqlmodel import select

from models.internal import Event
from server.aux import event_to_response
import logging

def f(user,session):
    statement = select(Event).where(Event.is_archived == False)
    events = session.exec(statement).all()
    
    logging.info("in get events f")
    return [event_to_response(e, user.role, user.id, session) for e in events]