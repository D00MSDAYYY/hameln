from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from io import BytesIO

from models.internal import (
    Attendance,
    Event,
    EventTagLink,
    Notification,
    Registration,
    Tag,
    User,
)


@dataclass(frozen=True)
class ReportData:
    users: list[User]
    events: list[Event]
    tag_links: list[tuple[EventTagLink, Tag, Event]]
    registrations: list[tuple[Registration, User, Event]]
    attendances: list[tuple[Attendance, User, Event]]
    notifications: list[Notification]
    company_names_by_id: dict[int, str]


class ReportRepository(ABC):
    @abstractmethod
    def collect(self, date_from: date, date_to: date) -> ReportData:
        raise NotImplementedError


class ReportRenderer(ABC):
    @abstractmethod
    def render(self, data: ReportData) -> BytesIO:
        raise NotImplementedError


class ReportService(ABC):
    @abstractmethod
    def generate(self, date_from: date, date_to: date) -> BytesIO:
        raise NotImplementedError
