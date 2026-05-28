from typing import List
from datetime import datetime

from pydantic_visible_fields import VisibleFieldsModel, field

from ..internal import Role, AppTheme


class UserInfoResponse(VisibleFieldsModel):
    id: int | None = field(visible_to=[Role.admin], default=None)

    nickname: str | None = field(visible_to=[Role.observer], default=None)
    role: Role | None = field(visible_to=[Role.admin], default=None)

    firstname: str | None = field(visible_to=[Role.admin], default=None)
    middlename: str | None = field(visible_to=[Role.admin], default=None)
    lastname: str | None = field(visible_to=[Role.admin], default=None)

    points: int | None = field(visible_to=[Role.observer], default=None)
    company: str | None = field(visible_to=[Role.user], default=None)

    email: str = field(visible_to=[Role.user], default=None)

    created_at: datetime | None = field(visible_to=[Role.admin], default=None)


class SettingsResponse(VisibleFieldsModel):
    app_theme: AppTheme | None = field(visible_to=[Role.user], default=None)

    days_to_notify: int | None = field(visible_to=[Role.user], default=None)
    do_notify: bool | None = field(visible_to=[Role.user], default=None)


class TagInfoResponse(VisibleFieldsModel):
    id: int | None = field(visible_to=[Role.admin], default=None)
    title: str | None = field(visible_to=[Role.observer], default=None)


class EventInfoResponse(VisibleFieldsModel):
    id: int | None = field(visible_to=[Role.admin], default=None)

    title: str | None = field(visible_to=[Role.observer], default=None)
    points: int | None = field(visible_to=[Role.observer], default=None)
    date: datetime | None = field(visible_to=[Role.observer], default=None)

    tags: List["TagInfoResponse"] | None = field(
        visible_to=[Role.observer], default=None
    )

    description: str | None = field(visible_to=[Role.observer], default=None)
    link: str | None = field(visible_to=[Role.observer], default=None)

    is_archived: bool | None = field(visible_to=[Role.admin], default=None)
    is_registered: bool | None = field(visible_to=[Role.user], default=None)

    created_at: datetime | None = field(visible_to=[Role.admin], default=None)


class NotificationInfoResponse(VisibleFieldsModel):
    id: int | None = field(visible_to=[Role.admin], default=None)

    title: str | None = field(visible_to=[Role.user], default=None)
    body: str | None = field(visible_to=[Role.user], default=None)

    created_at: datetime | None = field(visible_to=[Role.admin], default=None)
