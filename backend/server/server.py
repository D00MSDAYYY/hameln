from sqlmodel import Session
from fastapi import APIRouter, Response, Request, Depends

from server.aux import *
from server.company_suggest._company_suggest import CompanySuggest
from server.log_reader._log_reader import LogReader
from server.report._report import ReportService
from server.session_storage._session_storage import SessionStorage
from models.internal import *
from models.external import *


def get_db_session(request: Request):
    yield from request.app.state.database.session()


def get_session_storage(request: Request) -> SessionStorage:
    return request.app.state.session_storage


def get_log_reader(request: Request) -> LogReader:
    return request.app.state.log_reader


def get_company_suggest(request: Request) -> CompanySuggest:
    return request.app.state.company_suggest


def get_report_service(
    request: Request,
    db: Session = Depends(get_db_session),
) -> ReportService:
    return request.app.state.report_service_factory(db)



def configure_router(router: APIRouter) -> APIRouter:
    @router.get("/companies/suggest", response_model=List[CompanySuggestionResponse])
    async def suggest_companies(
        q: str,
        company_suggest: CompanySuggest = Depends(get_company_suggest),
    ):
        return company_suggest.suggest(q)


    @router.post("/user/signup", response_model=SignupResponse)
    async def signup(
        body: SignupRequest,
        db: Session = Depends(get_db_session),
    ):
        from server.endpoints.user.signup.post import f

        return f(
            body,
            db,
        )


    @router.post("/user/login", response_model=UserInfoResponse)
    async def login(
        login_data: LoginRequest,
        response: Response,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.user.login.post import f

        return f(login_data, response, db, session_storage)


    @router.post("/user/logout")
    async def logout(
        request: Request,
        response: Response,
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.user.logout.post import f

        return f(request, response, session_storage)


    @router.get("/user/profile", response_model=UserInfoResponse)
    async def get_profile(
        request: Request,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.user.profile.get import f

        return f(
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            ),
            db,
        )


    @router.patch("/user/profile", response_model=UserInfoResponse)
    async def update_profile(
        request: Request,
        profile_data: UserInfoResponse,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.user.profile.patch import f

        return f(
            profile_data,
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            ),
            db,
        )


    @router.get("/user/events", response_model=List[EventInfoResponse])
    async def get_events(
        request: Request,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.user.events.get import f

        return f(
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            ),
            db,
        )


    @router.get("/user/events/{event_id}", response_model=EventInfoResponse)
    async def get_event_detail(
        request: Request,
        event_id: int,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.user.events.event_id.get import f

        return f(
            event_id,
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            ),
            db,
        )


    @router.post("/user/events/{event_id}/register")
    async def register_for_event(
        request: Request,
        event_id: int,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.user.events.event_id.register.post import f

        return f(
            event_id,
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            ),
            db,
        )


    @router.delete("/user/events/{event_id}/register")
    async def unregister_from_event(
        request: Request,
        event_id: int,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.user.events.event_id.register.delete import f

        return f(
            event_id,
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            ),
            db,
        )


    @router.get("/user/tags", response_model=List[TagInfoResponse])
    async def get_tags(
        request: Request,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.user.tags.get import f

        return f(
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            ),
            db,
        )


    @router.get("/user/leaderboard", response_model=List[UserInfoResponse])
    async def get_leaderboard(
        request: Request,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.user.leaderboard.get import get_leaderboard

        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        )
        return get_leaderboard(db)


    @router.get("/user/notifications", response_model=List[NotificationInfoResponse])
    async def get_notifications(
        request: Request,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.user.notifications.get import f

        return f(
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            ),
            db,
        )


    @router.get("/user/settings", response_model=SettingsResponse)
    async def get_settings(
        request: Request,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.user.settings.get import f

        return f(
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            ),
            db,
        )


    @router.patch("/user/settings", response_model=SettingsResponse)
    async def update_settings(
        request: Request,
        new_settings: SettingsResponse,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.user.settings.patch import f

        return f(
            new_settings,
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            ),
            db,
        )


    @router.get("/admin/events", response_model=List[EventInfoResponse])
    async def get_admin_events(
        request: Request,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.events.get import f

        return f(
            ensure_admin(
                get_current_user(
                    get_session_id_from_cookie(request),
                    db,
                    session_storage,
                )
            ),
            db,
        )


    @router.post("/admin/events", response_model=EventInfoResponse)
    async def create_event(
        request: Request,
        event_data: EventInfoResponse,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.events.post import f

        return f(
            event_data,
            ensure_admin(
                get_current_user(
                    get_session_id_from_cookie(request),
                    db,
                    session_storage,
                )
            ),
            db,
        )


    @router.patch("/admin/events/{event_id}", response_model=EventInfoResponse)
    async def update_event(
        request: Request,
        event_id: int,
        event_data: EventInfoResponse,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.events.event_id.patch import f

        return f(
            event_id,
            event_data,
            ensure_admin(
                get_current_user(
                    get_session_id_from_cookie(request),
                    db,
                    session_storage,
                )
            ),
            db,
        )


    @router.delete("/admin/events/{event_id}")
    async def delete_event(
        request: Request,
        event_id: int,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.events.event_id.delete import f

        return f(
            event_id,
            ensure_admin(
                get_current_user(
                    get_session_id_from_cookie(request),
                    db,
                    session_storage,
                )
            ),
            db,
        )


    @router.get("/admin/signup_requests", response_model=List[SignupRequestInfoResponse])
    async def get_signup_requests(
        request: Request,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.signup_requests.get import f

        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            )
        )
        return f(db)


    @router.patch(
        "/admin/signup_requests/{request_id}",
        response_model=SignupRequestInfoResponse,
    )
    async def update_signup_request(
        request: Request,
        request_id: int,
        body: SignupRequest,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.signup_requests.request_id.patch import f

        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            )
        )
        return f(request_id, body, db)


    @router.post("/admin/signup_requests/{request_id}/approve", response_model=SignupResponse)
    async def approve_signup_request(
        request: Request,
        request_id: int,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.signup_requests.request_id.approve.post import f

        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            )
        )
        return f(request_id, db)


    @router.delete("/admin/signup_requests/{request_id}", response_model=SignupResponse)
    async def delete_signup_request(
        request: Request,
        request_id: int,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.signup_requests.delete import f

        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            )
        )
        return f(request_id, db)


    @router.get("/admin/search", response_model=List[UserInfoResponse])
    async def search_users(
        request: Request,
        q: str,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.search.get import f

        return f(
            q,
            ensure_admin(
                get_current_user(
                    get_session_id_from_cookie(request),
                    db,
                    session_storage,
                )
            ),
            db,
        )


    @router.get(
        "/admin/events/{event_id}/attendants", response_model=List[UserInfoResponse]
    )
    async def get_event_attendants(
        request: Request,
        event_id: int,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.events.event_id.attendants.get import f

        return f(
            event_id,
            ensure_admin(
                get_current_user(
                    get_session_id_from_cookie(request),
                    db,
                    session_storage,
                )
            ),
            db,
        )


    @router.patch("/admin/events/{event_id}/attendants")
    async def update_event_attendants(
        request: Request,
        event_id: int,
        attendant_ids: List[int],
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.events.event_id.attendants.patch import f

        return f(
            event_id,
            attendant_ids,
            ensure_admin(
                get_current_user(
                    get_session_id_from_cookie(request),
                    db,
                    session_storage,
                )
            ),
            db,
        )


    @router.get("/admin/report", response_class=Response)
    async def generate_report(
        request: Request,
        params: ReportRequest = Depends(),
        db: Session = Depends(get_db_session),
        report_service: ReportService = Depends(get_report_service),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.report.get import f

        return f(
            params.date_from,
            params.date_to,
            ensure_admin(
                get_current_user(
                    get_session_id_from_cookie(request),
                    db,
                    session_storage,
                )
            ),
            report_service,
        )


    @router.get("/admin/logs/{log_source}", response_class=Response)
    async def get_admin_log(
        request: Request,
        log_source: str,
        lines: int = 500,
        db: Session = Depends(get_db_session),
        log_reader: LogReader = Depends(get_log_reader),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.error_logs.log_source.get import f

        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(request),
                db,
                session_storage,
            )
        )
        return f(log_source, log_reader, lines)


    @router.get("/admin/users", response_model=List[UserInfoResponse])
    async def get_all_users(
        request: Request,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.users.get import f

        return f(
            ensure_admin(
                get_current_user(
                    get_session_id_from_cookie(request),
                    db,
                    session_storage,
                )
            ),
            db,
        )


    @router.post("/admin/users", response_model=UserInfoResponse)
    async def create_user(
        request: Request,
        user_data: UserRequest,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.users.post import f

        return f(
            user_data,
            ensure_admin(
                get_current_user(
                    get_session_id_from_cookie(request),
                    db,
                    session_storage,
                )
            ),
            db,
        )


    @router.patch("/admin/users/{user_id}", response_model=UserInfoResponse)
    async def update_user(
        request: Request,
        user_id: int,
        user_data: UserRequest,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.users.user_id.patch import f

        return f(
            user_id,
            user_data,
            ensure_admin(
                get_current_user(
                    get_session_id_from_cookie(request),
                    db,
                    session_storage,
                )
            ),
            db,
        )


    @router.delete("/admin/users/{user_id}")
    async def delete_user(
        request: Request,
        user_id: int,
        db: Session = Depends(get_db_session),
        session_storage: SessionStorage = Depends(get_session_storage),
    ):
        from server.endpoints.admin.users.user_id.delete import f

        return f(
            user_id,
            ensure_admin(
                get_current_user(
                    get_session_id_from_cookie(request),
                    db,
                    session_storage,
                )
            ),
            db,
        )
    return router
