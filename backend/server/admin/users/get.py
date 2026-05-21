from sqlmodel import select
from pydantic_visible_fields import visible_fields_response

from models.internal import User


def f(admin, session):
    users = session.exec(select(User)).all()
    return [visible_fields_response(u, role=admin.role) for u in users]
