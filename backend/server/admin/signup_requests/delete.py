from models.internal import SignUpRequest
from sqlmodel import Session
from fastapi import HTTPException


def f(
    request_id: int,
    db: Session,
):
    signup_req = db.get(SignUpRequest, request_id)
    if not signup_req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    db.delete(signup_req)
    db.commit()
    return {"message": "Заявка отклонена"}
