from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uvicorn
# ========== Модели данных ==========

class User(BaseModel):
    id: int
    nickname: str
    points: int = 0
    role: str = "user"  # "user" или "admin"

class Event(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    tags: List[str] = []
    points: int = 0
    date: str  # для простоты используем строку (можно заменить на datetime)
    is_archived: bool = False  # True, если мероприятие прошло

class Notification(BaseModel):
    id: int
    title: str
    body: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class Registration(BaseModel):
    user_id: int
    event_id: int

# ========== Имитация базы данных ==========
