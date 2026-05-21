import os
from datetime import date
from dotenv import load_dotenv

import redis

from sqlmodel import Session, create_engine
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Response, Request

from models.internal import *
from models.external import *
from server.user_session_storage import UserSessionStorage
from server.aux import *

load_dotenv(".env")

SESSION_TTL = int(os.getenv("SESSION_TTL", "86400"))
VERIFICATION_CODE_TTL = int(os.getenv("VERIFICATION_CODE_TTL", "300"))
BACKEND_DIR = str(os.getenv("BACKEND_DIR", "."))


db = create_engine(f"sqlite:///{BACKEND_DIR}/hameln.db", echo=False)


def get_db_session():
    with Session(db) as session:
        yield session


user_sessions_storage = UserSessionStorage(
    redis.Redis(
        host="localhost", port=6379, decode_responses=True
    ),  # TODO host port move to env
    SESSION_TTL,
)


server = FastAPI(title="Event Manager API", version="0.4.0")


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
    return JSONResponse(
        status_code=500,
        content={"detail": "Внутренняя ошибка сервера"},
    )


@server.post("/user/login", response_model=UserInfoResponse)
async def login(
    login_data: LoginRequest,
    response: Response,
):
    from server.user.login.post import f

    return f(login_data, response, get_db_session(), user_sessions_storage)


@server.post("/user/logout")
async def logout(
    request: Request,
    response: Response,
):
    from server.user.logout.post import f

    return f(request, response, user_sessions_storage)


@server.get("/user/profile", response_model=UserInfoResponse)
async def get_profile():
    from server.user.profile.get import f

    return f(
        get_current_user(
            get_session_id_from_cookie(),
            get_db_session(),
            user_sessions_storage,
        )
    )


@server.patch("/user/profile", response_model=UserInfoResponse)
async def update_profile(
    profile_data: UserInfoResponse,
):
    from server.user.profile.patch import f

    return f(
        profile_data,
        get_current_user(
            get_session_id_from_cookie(),
            get_db_session(),
            user_sessions_storage,
        ),
        get_db_session(),
    )


@server.get("/user/events", response_model=List[EventInfoResponse])
async def get_events():
    from server.user.events.get import f

    return f(
        get_current_user(
            get_session_id_from_cookie(),
            get_db_session(),
            user_sessions_storage,
        ),
        get_db_session(),
    )


@server.get("/user/events/{event_id}", response_model=EventInfoResponse)
async def get_event_detail(
    event_id: int,
):
    from server.user.events.event_id.get import f

    return f(
        event_id,
        get_current_user(
            get_session_id_from_cookie(),
            get_db_session(),
            user_sessions_storage,
        ),
        get_db_session(),
    )


@server.post("/user/events/{event_id}/register")
async def register_for_event(
    event_id: int,
):
    from server.user.events.event_id.register.post import f

    return f(
        event_id,
        get_current_user(
            get_session_id_from_cookie(),
            get_db_session(),
            user_sessions_storage,
        ),
        get_db_session(),
    )


@server.delete("/user/events/{event_id}/register")
async def unregister_from_event(
    event_id: int,
):
    from server.user.events.event_id.register.delete import f

    return f(
        event_id,
        get_current_user(
            get_session_id_from_cookie(),
            get_db_session(),
            user_sessions_storage,
        ),
        get_db_session(),
    )


@server.get("/user/tags", response_model=List[TagInfoResponse])
async def get_tags():
    from server.user.tags.get import f

    return f(
        get_current_user(
            get_session_id_from_cookie(),
            get_db_session(),
            user_sessions_storage,
        ),
        get_db_session(),
    )


@server.get("/user/notifications", response_model=List[NotificationInfoResponse])
async def get_notifications():
    from server.user.notifications.get import f

    return f(
        get_current_user(
            get_session_id_from_cookie(),
            get_db_session(),
            user_sessions_storage,
        ),
        get_db_session(),
    )


@server.get("/user/settings", response_model=SettingsResponse)
async def get_settings():
    from server.user.settings.get import f

    return f(
        get_current_user(
            get_session_id_from_cookie(),
            get_db_session(),
            user_sessions_storage,
        ),
        get_db_session(),
    )


@server.patch("/user/settings", response_model=SettingsResponse)
async def update_settings(
    new_settings: SettingsResponse,
):
    from user.settings.patch import f

    return f(
        new_settings,
        get_current_user(
            get_session_id_from_cookie(),
            get_db_session(),
            user_sessions_storage,
        ),
        get_db_session(),
    )


@server.get("/admin/events", response_model=List[EventInfoResponse])
async def get_admin_events():
    from admin.events.get import f

    return f(
        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(),
                get_db_session(),
                user_sessions_storage,
            )
        ),
        get_db_session(),
    )


@server.post("/admin/events", response_model=EventInfoResponse)
async def create_event(
    event_data: EventInfoResponse,
):
    from server.admin.events.post import f

    return f(
        event_data,
        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(),
                get_db_session(),
                user_sessions_storage,
            )
        ),
        get_db_session(),
    )


@server.patch("/admin/events/{event_id}", response_model=EventInfoResponse)
async def update_event(
    event_id: int,
    event_data: EventInfoResponse,
):
    from server.admin.events.event_id.patch import f

    return f(
        event_id,
        event_data,
        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(),
                get_db_session(),
                user_sessions_storage,
            )
        ),
        get_db_session(),
    )


@server.delete("/admin/events/{event_id}")
async def delete_event(
    event_id: int,
):
    from server.admin.events.event_id.delete import f

    return f(
        event_id,
        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(),
                get_db_session(),
                user_sessions_storage,
            )
        ),
        get_db_session(),
    )


@server.get("/admin/search", response_model=List[UserInfoResponse])
async def search_users(
    q: str,
):
    from server.admin.search.get import f

    return f(
        q,
        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(),
                get_db_session(),
                user_sessions_storage,
            )
        ),
        get_db_session(),
    )


@server.get("/admin/events/{event_id}/attendants", response_model=List[UserInfoResponse])
async def get_event_attendants(
    event_id: int,
):
    from server.admin.events.event_id.attendants.get import f

    return f(
        event_id,
        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(),
                get_db_session(),
                user_sessions_storage,
            )
        ),
        get_db_session(),
    )


@server.patch("/admin/events/{event_id}/attendants")
async def update_event_attendants(
    event_id: int,
    attendant_ids: List[int],
):
    from server.admin.events.event_id.attendants.patch import f

    return f(
        event_id,
        attendant_ids,
        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(),
                get_db_session(),
                user_sessions_storage,
            )
        ),
        get_db_session(),
    )


@server.get("/admin/report", response_class=Response)
async def generate_report(
    date_from: date,
    date_to: date,
):
    from server.admin.report.get import f

    return f(
        date_from,
        date_to,
        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(),
                get_db_session(),
                user_sessions_storage,
            )
        ),
        get_db_session(),
    )


@server.get("/admin/users", response_model=List[UserInfoResponse])
async def get_all_users():
    from server.admin.users.get import f

    return f(
        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(),
                get_db_session(),
                user_sessions_storage,
            )
        ),
        get_db_session(),
    )


@server.post("/admin/users", response_model=UserInfoResponse)
async def create_user(
    user_data: UserInfoResponse,
):
    from server.admin.users.post import f

    return f(
        user_data,
        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(),
                get_db_session(),
                user_sessions_storage,
            )
        ),
        get_db_session(),
    )


@server.patch("/admin/users/{user_id}", response_model=UserInfoResponse)
async def update_user(
    user_id: int,
    user_data: UserInfoResponse,
):
    from server.admin.users.user_id.patch import f

    return f(
        user_id,
        user_data,
        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(),
                get_db_session(),
                user_sessions_storage,
            )
        ),
        get_db_session(),
    )


@server.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: int,
):
    from server.admin.users.user_id.delete import f

    return f(
        user_id,
        ensure_admin(
            get_current_user(
                get_session_id_from_cookie(),
                get_db_session(),
                user_sessions_storage,
            )
        ),
        get_db_session(),
    )


