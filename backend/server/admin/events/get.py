from sqlmodel import select

from aux import event_to_response
from models.internal import Event, Role


def f(admin, session):
    events = session.exec(select(Event)).all()
    return [event_to_response(e, Role.admin, session=session) for e in events]
