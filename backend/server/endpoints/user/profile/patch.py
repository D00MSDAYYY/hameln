from server.aux import user_to_response


def f(profile_data, user, session):
    data = profile_data.model_dump(
        exclude_unset=True,
        exclude={"id", "role", "created_at"},
    )
    for field, value in data.items():
        if hasattr(user, field):
            setattr(user, field, value)

    session.add(user)
    session.commit()
    session.refresh(user)

    return user_to_response(user, role=user.role)
