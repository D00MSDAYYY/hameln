from fastapi import Response
from report_generator import generate_excel_report


def f(date_from, date_to, admin, session):
    excel_file = generate_excel_report(session, date_from, date_to)
    filename = f"report_{date_from}_{date_to}.xlsx"
    content = excel_file.getvalue()

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
