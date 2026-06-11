from server.aux import user_to_response

def f(user, session=None):
    return user_to_response(user, role=user.role, session=session)
