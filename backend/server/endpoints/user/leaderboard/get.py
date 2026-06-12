from sqlmodel import select
from sqlmodel import Session

from models.external import UserInfoResponse
from models.internal import Role, User
from server.aux import user_to_response


def get_leaderboard(session: Session) -> list[UserInfoResponse]:
    users = session.exec(
        select(User)
        .where(User.points > 0)
        .order_by(User.points.desc(), User.lastname, User.firstname)
    ).all()

    return [user_to_response(user, role=Role.observer, session=session) for user in users]
