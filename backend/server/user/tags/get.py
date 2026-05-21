from sqlmodel import select
from pydantic_visible_fields import visible_fields_response

from models.internal import Tag


def f(user, session):
    tags = session.exec(select(Tag)).all()
    return [visible_fields_response(t, role=user.role) for t in tags]
