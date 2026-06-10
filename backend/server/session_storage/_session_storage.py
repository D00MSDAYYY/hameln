from abc import ABC, abstractmethod


class SessionStorage(ABC):
    @property
    @abstractmethod
    def session_ttl(self) -> int:
        raise NotImplementedError

    @abstractmethod
    def generate_uid(self) -> str:
        raise NotImplementedError

    @abstractmethod
    def save_session(self, session_id: str, user_id: int) -> None:
        raise NotImplementedError

    @abstractmethod
    def delete_session(self, session_id: str) -> None:
        raise NotImplementedError

    @abstractmethod
    def get(self, session_id: str) -> str | int | None:
        raise NotImplementedError
