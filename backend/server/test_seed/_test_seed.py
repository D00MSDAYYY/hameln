from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime

from models.internal import Event, User


@dataclass(frozen=True)
class TestUserSeed:
    nickname: str
    phone: str
    firstname: str
    lastname: str
    company: str
    points: int = 0


@dataclass(frozen=True)
class TestEventSeed:
    title: str
    description: str
    points: int
    starts_in_days: int
    tags: tuple[str, ...]


class TestSeedRepository(ABC):
    @abstractmethod
    def upsert_user(self, seed: TestUserSeed) -> User:
        raise NotImplementedError

    @abstractmethod
    def upsert_event(self, seed: TestEventSeed, base_date: datetime) -> Event:
        raise NotImplementedError

    @abstractmethod
    def ensure_registration(self, user: User, event: Event) -> None:
        raise NotImplementedError
