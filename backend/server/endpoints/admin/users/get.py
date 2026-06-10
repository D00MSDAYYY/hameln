from sqlmodel import select
from server.aux import user_to_response

from models.internal import User


def f(admin, session):
    users = session.exec(select(User)).all()
    return [user_to_response(u, role=admin.role) for u in users]
