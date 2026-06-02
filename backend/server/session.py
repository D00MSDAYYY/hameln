import redis

from server.settings import Settings
from server.user_session_storage import UserSessionStorage


def create_session_storage(settings: Settings) -> UserSessionStorage:
    redis_client = redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        decode_responses=True,
    )
    return UserSessionStorage(redis_client, settings.session_ttl)
