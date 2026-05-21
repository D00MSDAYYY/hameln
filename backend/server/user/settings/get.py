from pydantic_visible_fields import visible_fields_response

from models.internal import Settings, UserSettingsLink


def f(user, session):
    if not (user_settings := session.get(UserSettingsLink, user.id)):
        user_settings = UserSettingsLink(user_id=user.id)  # type: ignore
        session.add(user_settings)
        session.commit()
        session.refresh(user_settings)

    if not user_settings.settings:
        user_settings.settings = Settings().model_dump(mode="json")
        session.add(user_settings)
        session.commit()
        session.refresh(user_settings)

    settings_obj = Settings(**user_settings.settings)
    return visible_fields_response(settings_obj, role=user.role).model_dump()
