from pydantic import BaseModel  # type: ignore
from typing import Optional, List


class EventResponse(BaseModel):
    id: int
    name: str
    tags: List[str] = []
    points: int = 0
    date: str
    is_registered: bool = False


class EventDetailResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    tags: List[str] = []
    points: int = 0
    date: str
    is_registered: bool = False


class NotificationResponse(BaseModel):
    id: int
    title: str
    body: Optional[str] = None
    created_at: str
