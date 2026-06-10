from abc import ABC, abstractmethod


class LogReader(ABC):
    @abstractmethod
    def read(self, log_source: str, lines: int) -> str:
        raise NotImplementedError
