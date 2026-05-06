# internal
from enum import Enum
from datetime import datetime
from typing import Optional, List

from sqlmodel import Field, Relationship, SQLModel, func
from pydantic import BaseModel
from sqlalchemy import JSON, Column


class Role(Enum):
    admin = "admin"
    user = "user"
    observer = "observer"


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    nickname: str
    role: Role = Field(default=Role.user)

    firstname: str
    middlename: Optional[str] = Field(default=None)
    lastname: str

    points: int = Field(default=0)
    company: Optional[str] = Field(default=None)
    password: str

    created_at: datetime = Field(
        sa_column_kwargs={"server_default": func.now()}, default=None
    )
    # created_at: datetime = Field(default_factory=datetime.now)


class EventTagLink(SQLModel, table=True):
    event_id: int = Field(foreign_key="event.id", primary_key=True)
    tag_id: int = Field(foreign_key="tag.id", primary_key=True)


class Tag(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str

    events: List["Event"] = Relationship(back_populates="tags", link_model=EventTagLink)


class Event(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    title: str
    points: int = Field(default=0)
    date: datetime

    tags: List["Tag"] = Relationship(
        back_populates="events",
        link_model=EventTagLink,
    )

    description: Optional[str] = Field(default=None)
    link: Optional[str] = Field(default=None)

    is_archived: bool = Field(default=False)

    created_at: Optional[datetime] = Field(
        sa_column_kwargs={"server_default": func.now()}, default=None
    )
    # created_at: datetime = Field(default_factory=datetime.now)


class Notification(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    title: str
    body: Optional[str] = Field(default=None)

    created_at: Optional[datetime] = Field(
        sa_column_kwargs={"server_default": func.now()}, default=None
    )
    # created_at: datetime = Field(default_factory=datetime.now)


class Registration(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    event_id: int = Field(foreign_key="event.id", primary_key=True)

    created_at: Optional[datetime] = Field(
        sa_column_kwargs={"server_default": func.now()}, default=None
    )
    # created_at: datetime = Field(default_factory=datetime.now)


class Attendance(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    event_id: int = Field(foreign_key="event.id", primary_key=True)

    created_at: Optional[datetime] = Field(
        sa_column_kwargs={"server_default": func.now()}, default=None
    )
    # created_at: datetime = Field(default_factory=datetime.now)


class AppTheme(Enum):
    dark = "dark"
    light = "light"


class Settings(BaseModel):
    app_theme: AppTheme = Field(default=AppTheme.light)

    days_to_notify: int = Field(default=3)
    do_notify: bool = Field(default=True)


class UserSettingsLink(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    settings: dict = Field(
        default_factory=lambda: Settings().model_dump(mode="json"),
        sa_column=Column(JSON),
    )
