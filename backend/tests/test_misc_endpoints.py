from datetime import date
from io import BytesIO

from fastapi import Response

from models.external import CompanySuggestionResponse
from server.endpoints.admin.error_logs.log_source.get import f as get_log
from server.endpoints.admin.report.get import f as get_report
from server.company_suggest.dadata_company_suggest import DadataCompanySuggest


class FakeLogReader:
    def read(self, source: str, lines: int) -> str:
        return f"{source}:{lines}"


class FakeReportService:
    def generate(self, date_from, date_to):
        return BytesIO(b"excel-bytes")


def test_log_endpoint_returns_plain_text_response():
    response = get_log("backend", FakeLogReader(), lines=12)

    assert isinstance(response, Response)
    assert response.body == b"backend:12"
    assert response.media_type == "text/plain; charset=utf-8"


def test_report_endpoint_returns_xlsx_attachment(user_factory):
    admin = user_factory()

    response = get_report(
        date(2026, 1, 1),
        date(2026, 1, 31),
        admin,
        FakeReportService(),
    )

    assert response.body == b"excel-bytes"
    assert response.media_type == (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert 'filename="report_2026-01-01_2026-01-31.xlsx"' in response.headers[
        "content-disposition"
    ]


def test_dadata_company_suggest_without_token_returns_empty_list():
    assert DadataCompanySuggest(token=None).suggest("query") == []


def test_dadata_company_suggest_maps_raw_suggestion():
    suggestion = DadataCompanySuggest._suggestion_to_response(
        {
            "value": 'ООО "ТЕСТ"',
            "data": {
                "inn": "7700000000",
                "address": {"value": "г Москва"},
            },
        }
    )

    assert suggestion == CompanySuggestionResponse(
        name='ООО "ТЕСТ"',
        inn="7700000000",
        address="г Москва",
    )
