from abc import ABC, abstractmethod
from collections.abc import Iterator

from sqlmodel import Session


class Database(ABC):
    @abstractmethod
    def initialize(self) -> None:
        raise NotImplementedError

    @abstractmethod
    def session(self) -> Iterator[Session]:
        raise NotImplementedError
