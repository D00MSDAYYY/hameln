from pydantic_visible_fields import visible_fields_response

def f(user):
    return visible_fields_response(user, role=user.role)