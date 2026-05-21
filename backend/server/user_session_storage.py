class UserSessionStorage:
    def __init__(self, redis_db, SESSION_TTL) -> None:
        self.SESSION_TTL = SESSION_TTL
        self._redis_db = redis_db

    def save_session(self, session_id, user_id):
        self._redis_db.setex(session_id, self.SESSION_TTL, user_id)

    def delete_session(self, session_id):
        self._redis_db.delete(session_id)

    def get(self, session_id):
        return self._redis_db.get(session_id)
