# internal
from enum import Enum
from datetime import datetime
from typing import List

from sqlmodel import Field, Relationship, SQLModel, func
from pydantic import BaseModel
from sqlalchemy import JSON, Column
from pydantic_visible_fields import configure_roles


class Role(Enum):
    admin = "admin"
    user = "user"
    observer = "observer"


configure_roles(
    role_enum=Role,
    inheritance={
        Role.admin: [Role.user],
        Role.user: [Role.observer],
    },
    default_role=Role.observer,
)


class AppTheme(Enum):
    dark = "dark"
    light = "light"


class Settings(BaseModel):
    app_theme: AppTheme = Field(default=AppTheme.light)

    days_to_notify: int = Field(default=3)
    do_notify: bool = Field(default=True)


class UserBase(SQLModel):
    id: int | None = Field(default=None, primary_key=True)

    firstname: str
    lastname: str

    company: str | None = Field(default=None)

    phone: str = Field(unique=True, index=True)

    created_at: datetime = Field(
        sa_column_kwargs={"server_default": func.now()}, default=None
    )


class User(UserBase, table=True):
    role: Role = Field(default=Role.user)
    nickname: str
    password: str
    points: int = Field(default=0)


class SignUpRequest(UserBase, table=True):
    nickname: str


class Notification(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    title: str
    body: str | None = Field(default=None)

    created_at: datetime | None = Field(
        sa_column_kwargs={"server_default": func.now()}, default=None
    )


class EventTagLink(SQLModel, table=True):
    event_id: int = Field(foreign_key="event.id", primary_key=True, ondelete="CASCADE")
    tag_id: int = Field(foreign_key="tag.id", primary_key=True, ondelete="CASCADE")


class Tag(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    events: List["Event"] = Relationship(back_populates="tags", link_model=EventTagLink)


class Event(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    points: int = Field(default=0)
    date: datetime
    tags: List["Tag"] = Relationship(back_populates="events", link_model=EventTagLink)
    description: str | None = Field(default=None)
    link: str | None = Field(default=None)
    is_archived: bool = Field(default=False)
    created_at: datetime | None = Field(
        sa_column_kwargs={"server_default": func.now()}, default=None
    )


class Registration(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True, ondelete="CASCADE")
    event_id: int = Field(foreign_key="event.id", primary_key=True, ondelete="CASCADE")
    created_at: datetime | None = Field(
        sa_column_kwargs={"server_default": func.now()}, default=None
    )


class Attendance(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True, ondelete="CASCADE")
    event_id: int = Field(foreign_key="event.id", primary_key=True, ondelete="CASCADE")
    created_at: datetime | None = Field(
        sa_column_kwargs={"server_default": func.now()}, default=None
    )


class UserSettingsLink(
    SQLModel, table=True
):  # TODO remove this in future and use index
    user_id: int = Field(foreign_key="user.id", primary_key=True, ondelete="CASCADE")
    settings: dict = Field(
        default_factory=lambda: Settings().model_dump(mode="json"),
        sa_column=Column(JSON),
    )
