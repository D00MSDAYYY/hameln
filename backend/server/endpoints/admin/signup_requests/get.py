from models.internal import SignUpRequest
from models.internal import Role
from server.aux import signup_request_to_response
from sqlmodel import Session, select


def f(
    db: Session,
):
    requests = db.exec(select(SignUpRequest)).all()
    return [
        signup_request_to_response(request, role=Role.admin, session=db)
        for request in requests
    ]
