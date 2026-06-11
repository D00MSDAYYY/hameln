from dadata import Dadata

from models.external import CompanySuggestionResponse
from ._company_suggest import CompanySuggest


class DadataCompanySuggest(CompanySuggest):
    def __init__(
        self,
        *,
        token: str | None,
        limit: int = 10,
    ) -> None:
        self._token = token
        self._limit = limit

    def suggest(self, query: str) -> list[CompanySuggestionResponse]:
        query = query.strip()
        if not query or not self._token:
            return []

        client = Dadata(self._token)
        try:
            suggestions = client.suggest("party", query, count=self._limit)
        finally:
            close = getattr(client, "close", None)
            if callable(close):
                close()

        return [self._suggestion_to_response(item) for item in suggestions]

    @staticmethod
    def _suggestion_to_response(item: dict) -> CompanySuggestionResponse:
        data = item.get("data") or {}
        address = data.get("address") or {}

        return CompanySuggestionResponse(
            name=item.get("value") or data.get("name", {}).get("short_with_opf") or "",
            inn=data.get("inn"),
            address=address.get("value"),
        )
