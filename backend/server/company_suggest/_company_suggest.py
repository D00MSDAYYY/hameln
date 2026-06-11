from abc import ABC, abstractmethod

from models.external import CompanySuggestionResponse


class CompanySuggest(ABC):
    @abstractmethod
    def suggest(self, query: str) -> list[CompanySuggestionResponse]:
        raise NotImplementedError
