from sqlmodel import select
from pydantic_visible_fields import visible_fields_response


from models.internal import Notification


def f(user, session):
    notifications = session.exec(select(Notification)).all()
    return [visible_fields_response(n, role=user.role) for n in notifications]
