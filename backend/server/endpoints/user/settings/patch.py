from pydantic_visible_fields import visible_fields_response

from models.internal import Settings, UserSettingsLink


def f(new_settings, user, session):
    if not (user_settings := session.get(UserSettingsLink, user.id)):
        user_settings = UserSettingsLink(user_id=user.id)  # type: ignore
        session.add(user_settings)
        session.commit()
        session.refresh(user_settings)

    if not user_settings.settings:
        user_settings.settings = Settings().model_dump(mode="json")

    updated_dict = {
        **user_settings.settings,
        **new_settings.model_dump(exclude_unset=True),
    }
    validated = Settings(**updated_dict)
    user_settings.settings = validated.model_dump(mode="json")

    session.add(user_settings)
    session.commit()
    session.refresh(user_settings)

    final_settings = Settings(**user_settings.settings)
    return visible_fields_response(final_settings, role=user.role).model_dump()
