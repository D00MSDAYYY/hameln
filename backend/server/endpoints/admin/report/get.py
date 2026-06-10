from fastapi import Response

from server.report._report import ReportService


def f(date_from, date_to, admin, report_service: ReportService):
    excel_file = report_service.generate(date_from, date_to)
    filename = f"report_{date_from}_{date_to}.xlsx"
    content = excel_file.getvalue()

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
