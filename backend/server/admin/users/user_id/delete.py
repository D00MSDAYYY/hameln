from sqlmodel import select
from fastapi import HTTPException


from models.internal import User, Registration, Attendance, UserSettingsLink



def f(user_id, admin, session):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    registrations = session.exec(
        select(Registration).where(Registration.user_id == user_id)
    ).all()
    for reg in registrations:
        session.delete(reg)

    attendances = session.exec(
        select(Attendance).where(Attendance.user_id == user_id)
    ).all()
    for att in attendances:
        session.delete(att)

    user_settings = session.get(UserSettingsLink, user_id)
    if user_settings:
        session.delete(user_settings)

    session.delete(user)
    session.commit()

    return {"message": f"Пользователь {user.nickname} удалён"}