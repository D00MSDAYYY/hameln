from models.internal import SignUpRequest
from pydantic_visible_fields import visible_fields_response
from models.internal import Role
from sqlmodel import Session, select


def f(
    db: Session,
):
    requests = db.exec(select(SignUpRequest)).all()
    return [visible_fields_response(request, role=Role.admin) for request in requests]
