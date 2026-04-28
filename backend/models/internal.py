from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, Field  # type: ignore


class User(BaseModel):
    id: int
    nickname: str
    points: int
    company: Optional[str] = None
    password: str
    role: str = "user"


class LoginRequest(BaseModel):
    password: str


class Event(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    tags: List[str] = []
    points: int = 0
    date: str  # для простоты используем строку
    is_archived: bool = False


class Registration(BaseModel):
    user_id: int
    event_id: int


class Notification(BaseModel):
    id: int
    title: str
    body: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
