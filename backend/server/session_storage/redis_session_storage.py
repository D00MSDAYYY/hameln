import uuid

from ._session_storage import SessionStorage


class RedisSessionStorage(SessionStorage):
    def __init__(self, redis_db, session_ttl: int) -> None:
        self._session_ttl = session_ttl
        self._redis_db = redis_db

    @property
    def session_ttl(self) -> int:
        return self._session_ttl

    def generate_uid(self) -> str:
        return uuid.uuid4().hex

    def save_session(self, session_id: str, user_id: int) -> None:
        self._redis_db.setex(session_id, self.session_ttl, user_id)

    def delete_session(self, session_id: str) -> None:
        self._redis_db.delete(session_id)

    def get(self, session_id: str):
        return self._redis_db.get(session_id)
