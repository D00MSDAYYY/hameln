from sqlmodel import select, func

from pydantic_visible_fields import visible_fields_response


from models.internal import User


def f(q, admin, session):
    if not q or len(q.strip()) < 2:
        return []

    search_term = f"%{q.strip().lower()}%"
    statement = (
        select(User).where(func.lower(User.nickname).like(search_term)).limit(20)
    )

    users = session.exec(statement).all()

    return [visible_fields_response(u, role=admin.role) for u in users]
