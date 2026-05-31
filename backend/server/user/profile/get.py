from server.aux import user_to_response

def f(user):
    return user_to_response(user, role=user.role)
