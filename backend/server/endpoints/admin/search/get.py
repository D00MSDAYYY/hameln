from sqlmodel import select, func

from server.aux import user_to_response

from models.internal import User


def f(q, admin, session):
    if not q or len(q.strip()) < 2:
        return []

    search_term = f"%{q.strip().lower()}%"
    statement = (
        select(User).where(func.lower(User.nickname).like(search_term)).limit(20)
    )

    users = session.exec(statement).all()

    return [user_to_response(u, role=admin.role, session=session) for u in users]
