from typing import List
from datetime import datetime

from pydantic_visible_fields import VisibleFieldsModel, field

from ..internal import Role, AppTheme
from .aux import PersonName


class UserInfoResponse(VisibleFieldsModel):
    id: int | None = field(visible_to=[Role.admin], default=None)

    role: Role | None = field(visible_to=[Role.admin], default=None)
    password: str | None = field(visible_to=[Role.admin], default=None)

    firstname: PersonName | None = field(visible_to=[Role.observer], default=None)
    lastname: PersonName | None = field(visible_to=[Role.observer], default=None)

    points: int | None = field(visible_to=[Role.observer], default=None)
    company: str | None = field(visible_to=[Role.observer], default=None)

    phone: str | None = field(visible_to=[Role.user], default=None)

    created_at: datetime | None = field(visible_to=[Role.admin], default=None)


class SettingsResponse(VisibleFieldsModel):
    app_theme: AppTheme | None = field(visible_to=[Role.user], default=None)

    days_to_notify: int | None = field(visible_to=[Role.user], default=None)
    do_notify: bool | None = field(visible_to=[Role.user], default=None)


class TagInfoResponse(VisibleFieldsModel):
    id: int | None = field(visible_to=[Role.admin], default=None)
    title: str | None = field(visible_to=[Role.observer], default=None)


class EventRegistrantResponse(VisibleFieldsModel):
    firstname: PersonName | None = field(visible_to=[Role.user], default=None)
    lastname: PersonName | None = field(visible_to=[Role.user], default=None)
    company: str | None = field(visible_to=[Role.user], default=None)


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
    registered_users: List["EventRegistrantResponse"] | None = field(
        visible_to=[Role.user], default=None
    )

    created_at: datetime | None = field(visible_to=[Role.admin], default=None)


class NotificationInfoResponse(VisibleFieldsModel):
    id: int | None = field(visible_to=[Role.admin], default=None)

    title: str | None = field(visible_to=[Role.user], default=None)
    body: str | None = field(visible_to=[Role.user], default=None)

    created_at: datetime | None = field(visible_to=[Role.admin], default=None)


class SignupRequestInfoResponse(VisibleFieldsModel):
    id: int | None = field(visible_to=[Role.admin], default=None)

    firstname: PersonName | None = field(visible_to=[Role.admin], default=None)
    lastname: PersonName | None = field(visible_to=[Role.admin], default=None)
    company: str | None = field(visible_to=[Role.admin], default=None)

    phone: str | None = field(visible_to=[Role.admin], default=None)

    created_at: datetime | None = field(visible_to=[Role.admin], default=None)


class SignupResponse(VisibleFieldsModel):
    message: str = field(visible_to=[Role.observer])


class CompanySuggestionResponse(VisibleFieldsModel):
    name: str = field(visible_to=[Role.observer])
    inn: str | None = field(visible_to=[Role.observer], default=None)
    address: str | None = field(visible_to=[Role.observer], default=None)
