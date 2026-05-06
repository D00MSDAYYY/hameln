# external
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel
from pydantic_visible_fields import VisibleFieldsModel, field, configure_roles
from .internal import Role, AppTheme

configure_roles(
    role_enum=Role,
    inheritance={
        Role.admin: [Role.user],
        Role.user: [Role.observer],
    },
    default_role=Role.observer,
)


class UserInfoResponse(VisibleFieldsModel):
    id: Optional[int] = field(visible_to=[Role.admin], default=None)

    nickname: Optional[str] = field(visible_to=[Role.observer], default=None)
    role: Optional[Role] = field(visible_to=[Role.admin], default=None)

    firstname: Optional[str] = field(visible_to=[Role.admin], default=None)
    middlename: Optional[str] = field(visible_to=[Role.admin], default=None)
    lastname: Optional[str] = field(visible_to=[Role.admin], default=None)

    points: Optional[int] = field(visible_to=[Role.observer], default=None)
    company: Optional[str] = field(visible_to=[Role.user], default=None)
    password: Optional[str] = field(visible_to=[Role.admin], default=None)

    created_at: Optional[datetime] = field(visible_to=[Role.admin], default=None)


class SettingsResponse(VisibleFieldsModel):
    app_theme: Optional[AppTheme] = field(visible_to=[Role.user], default=None)

    days_to_notify: Optional[int] = field(visible_to=[Role.user], default=None)
    do_notify: Optional[bool] = field(visible_to=[Role.user], default=None)


class TagInfoResponse(VisibleFieldsModel):
    id: Optional[int] = field(visible_to=[Role.admin], default=None)
    title: Optional[str] = field(visible_to=[Role.observer], default=None)


class EventInfoResponse(VisibleFieldsModel):
    id: Optional[int] = field(visible_to=[Role.admin], default=None)

    title: Optional[str] = field(visible_to=[Role.observer], default=None)
    points: Optional[int] = field(visible_to=[Role.observer], default=None)
    date: Optional[datetime] = field(visible_to=[Role.observer], default=None)

    tags: Optional[List["TagInfoResponse"]] = field(
        visible_to=[Role.observer], default=None
    )

    description: Optional[str] = field(visible_to=[Role.observer], default=None)
    link: Optional[str] = field(visible_to=[Role.observer], default=None)

    is_archived: Optional[bool] = field(visible_to=[Role.admin], default=None)
    is_registered: Optional[bool] = field(visible_to=[Role.user], default=None)

    created_at: Optional[datetime] = field(visible_to=[Role.admin], default=None)


class NotificationInfoResponse(VisibleFieldsModel):
    id: Optional[int] = field(visible_to=[Role.admin], default=None)

    title: Optional[str] = field(visible_to=[Role.user], default=None)
    body: Optional[str] = field(visible_to=[Role.user], default=None)

    created_at: Optional[datetime] = field(visible_to=[Role.admin], default=None)


class LoginRequest(BaseModel):
    password: str
