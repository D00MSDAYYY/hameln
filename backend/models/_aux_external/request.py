from pydantic import BaseModel
from pydantic_visible_fields import configure_roles


class SignupRequest(BaseModel):
    email: str
    firstname: str
    lastname: str
    middlename: str
    company: str
