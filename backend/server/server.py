import os

from dotenv import load_dotenv
from contextlib import asynccontextmanager

import logging
import sys, traceback

traceback.print_exc(file=sys.stdout)

import redis

from sqlmodel import Session, create_engine, select
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Response, Request, Depends

from server.aux import *
from server.user_session_storage import UserSessionStorage
from models.internal import *
from models.external import *

load_dotenv(".env")

SESSION_TTL = int(os.getenv("SESSION_TTL", "86400"))
VERIFICATION_CODE_TTL = int(os.getenv("VERIFICATION_CODE_TTL", "300"))
BACKEND_DIR = str(os.getenv("BACKEND_DIR", "."))
ADMIN_PHONE = os.getenv("ADMIN_PHONE")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

_db = create_engine(f"sqlite:///{BACKEND_DIR}/hameln.db", echo=False)


def init_admin_user():
    if not ADMIN_PHONE or not ADMIN_PASSWORD:
        return

    admin_phone = normalize_russian_phone(ADMIN_PHONE)

    with Session(_db) as session:
        admin = session.exec(select(User).where(User.phone == admin_phone)).first()

        if admin:
            admin.role = Role.admin
            admin.password = ADMIN_PASSWORD
        else:
            admin = User(
                nickname=admin_phone,
                firstname="Admin",
                lastname="User",
                company=None,
                phone=admin_phone,
                password=ADMIN_PASSWORD,
                role=Role.admin,
            )
            session.add(admin)

        session.commit()


def init_database():
    SQLModel.metadata.create_all(_db)
    init_admin_user()



@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    yield


def get_db_session():
    with Session(_db) as session:
        yield session


def get_session_storage() -> UserSessionStorage:
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", "6379"))
    session_ttl = int(os.getenv("SESSION_TTL", "86400"))

    redis_client = redis.Redis(
        host=redis_host,
        port=redis_port,
        decode_responses=True,
    )
    return UserSessionStorage(redis_client, session_ttl)


server = FastAPI(
    title="Event Manager API",
    version="0.4.0",
    lifespan=lifespan,
)

server.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@server.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Внутренняя ошибка сервера"},
    )


@server.post("/user/signup", response_model=SignupResponse)
async def signup(
    body: SignupRequest,
    db: Session = Depends(get_db_session),
):
    from server.user.signup.post import f

    return f(
        body,
        db,
    )


@server.post("/user/login", response_model=UserInfoResponse)
async def login(
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.user.login.post import f

    return f(login_data, response, db, session_storage)


@server.post("/user/logout")
async def logout(
    request: Request,
    response: Response,
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.user.logout.post import f

    return f(request, response, session_storage)


@server.get("/user/profile", response_model=UserInfoResponse)
async def get_profile(
    request: Request,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.user.profile.get import f

    return f(
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        )
    )


@server.patch("/user/profile", response_model=UserInfoResponse)
async def update_profile(
    request: Request,
    profile_data: UserInfoResponse,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.user.profile.patch import f

    return f(
        profile_data,
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        ),
        db,
    )


@server.get("/user/events", response_model=List[EventInfoResponse])
async def get_events(
    request: Request,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.user.events.get import f

    return f(
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        ),
        db,
    )


@server.get("/user/events/{event_id}", response_model=EventInfoResponse)
async def get_event_detail(
    request: Request,
    event_id: int,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.user.events.event_id.get import f

    return f(
        event_id,
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        ),
        db,
    )


@server.post("/user/events/{event_id}/register")
async def register_for_event(
    request: Request,
    event_id: int,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.user.events.event_id.register.post import f

    return f(
        event_id,
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        ),
        db,
    )


@server.delete("/user/events/{event_id}/register")
async def unregister_from_event(
    request: Request,
    event_id: int,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.user.events.event_id.register.delete import f

    return f(
        event_id,
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        ),
        db,
    )


@server.get("/user/tags", response_model=List[TagInfoResponse])
async def get_tags(
    request: Request,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.user.tags.get import f

    return f(
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        ),
        db,
    )


@server.get("/user/notifications", response_model=List[NotificationInfoResponse])
async def get_notifications(
    request: Request,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.user.notifications.get import f

    return f(
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        ),
        db,
    )


@server.get("/user/settings", response_model=SettingsResponse)
async def get_settings(
    request: Request,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.user.settings.get import f

    return f(
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        ),
        db,
    )


@server.patch("/user/settings", response_model=SettingsResponse)
async def update_settings(
    request: Request,
    new_settings: SettingsResponse,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.user.settings.patch import f

    return f(
        new_settings,
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        ),
        db,
    )


@server.get("/admin/events", response_model=List[EventInfoResponse])
async def get_admin_events(
    request: Request,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.events.get import f

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


@server.post("/admin/events", response_model=EventInfoResponse)
async def create_event(
    request: Request,
    event_data: EventInfoResponse,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.events.post import f

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


@server.patch("/admin/events/{event_id}", response_model=EventInfoResponse)
async def update_event(
    request: Request,
    event_id: int,
    event_data: EventInfoResponse,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.events.event_id.patch import f

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


@server.delete("/admin/events/{event_id}")
async def delete_event(
    request: Request,
    event_id: int,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.events.event_id.delete import f

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


@server.get("/admin/signup_requests", response_model=List[SignupRequestInfoResponse])
async def get_signup_requests(
    request: Request,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.signup_requests.get import f

    ensure_admin(
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        )
    )
    return f(db)


@server.patch(
    "/admin/signup_requests/{request_id}",
    response_model=SignupRequestInfoResponse,
)
async def update_signup_request(
    request: Request,
    request_id: int,
    body: SignupRequest,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.signup_requests.request_id.patch import f

    ensure_admin(
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        )
    )
    return f(request_id, body, db)


@server.post("/admin/signup_requests/{request_id}/approve", response_model=SignupResponse)
async def approve_signup_request(
    request: Request,
    request_id: int,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.signup_requests.request_id.approve.post import f

    ensure_admin(
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        )
    )
    return f(request_id, db)


@server.delete("/admin/signup_requests/{request_id}", response_model=SignupResponse)
async def delete_signup_request(
    request: Request,
    request_id: int,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.signup_requests.delete import f

    ensure_admin(
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        )
    )
    return f(request_id, db)


@server.get("/admin/search", response_model=List[UserInfoResponse])
async def search_users(
    request: Request,
    q: str,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.search.get import f

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


@server.get(
    "/admin/events/{event_id}/attendants", response_model=List[UserInfoResponse]
)
async def get_event_attendants(
    request: Request,
    event_id: int,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.events.event_id.attendants.get import f

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


@server.patch("/admin/events/{event_id}/attendants")
async def update_event_attendants(
    request: Request,
    event_id: int,
    attendant_ids: List[int],
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.events.event_id.attendants.patch import f

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


@server.get("/admin/report", response_class=Response)
async def generate_report(
    request: Request,
    params: ReportRequest = Depends(),
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.report.get import f

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
        db,
    )


@server.get("/admin/logs/{log_source}", response_class=Response)
async def get_admin_log(
    request: Request,
    log_source: str,
    lines: int = 500,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.error_logs.log_source.get import f

    ensure_admin(
        get_current_user(
            get_session_id_from_cookie(request),
            db,
            session_storage,
        )
    )
    return f(log_source, lines)


@server.get("/admin/users", response_model=List[UserInfoResponse])
async def get_all_users(
    request: Request,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.users.get import f

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


@server.post("/admin/users", response_model=UserInfoResponse)
async def create_user(
    request: Request,
    user_data: UserRequest,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.users.post import f

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


@server.patch("/admin/users/{user_id}", response_model=UserInfoResponse)
async def update_user(
    request: Request,
    user_id: int,
    user_data: UserRequest,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.users.user_id.patch import f

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


@server.delete("/admin/users/{user_id}")
async def delete_user(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db_session),
    session_storage: UserSessionStorage = Depends(get_session_storage),
):
    from server.admin.users.user_id.delete import f

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
