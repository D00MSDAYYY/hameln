from models.internal import SignUpRequest
from sqlmodel import Session, select


def f(
    db: Session,
):
    requests = db.exec(select(SignUpRequest)).all()
    return requests
