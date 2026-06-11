import os
from dataclasses import dataclass

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    backend_dir: str = "."
    redis_host: str = "localhost"
    redis_port: int = 6379
    session_ttl: int = 86400
    verification_code_ttl: int = 300
    admin_phone: str | None = None
    admin_password: str | None = None
    dadata_token: str | None = None
    host: str = "0.0.0.0"
    port: int = 8000

    @classmethod
    def from_env(cls, env_file: str = ".env", default_backend_dir: str = "."):
        load_dotenv(env_file)

        return cls(
            backend_dir=str(os.getenv("BACKEND_DIR", default_backend_dir)),
            redis_host=os.getenv("REDIS_HOST", "localhost"),
            redis_port=int(os.getenv("REDIS_PORT", "6379")),
            session_ttl=int(os.getenv("SESSION_TTL", "86400")),
            verification_code_ttl=int(os.getenv("VERIFICATION_CODE_TTL", "300")),
            admin_phone=os.getenv("ADMIN_PHONE"),
            admin_password=os.getenv("ADMIN_PASSWORD"),
            dadata_token=os.getenv("DADATA_TOKEN"),
            host=os.getenv("HOST", "0.0.0.0"),
            port=int(os.getenv("PORT", "8000")),
        )
