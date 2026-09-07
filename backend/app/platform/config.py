from typing import Annotated, Any

from pydantic import (
    AnyUrl,
    BeforeValidator,
    EmailStr,
    computed_field,
    model_validator,
)
from pydantic_settings import BaseSettings
from typing_extensions import Self


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",") if i.strip()]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


# the value the sample file ships with, the app refuses to start on it
PLACEHOLDER = "changethis"


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    SECRET_KEY: str = "changethis"
    FRONTEND_HOST: str = "https://localhost:8443"
    DATABASE_URL: str = "need to set"
    DMODE: str = "dev"
    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    @computed_field
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    PROJECT_NAME: str = "UNOpposed"

    FIRST_SUPERUSER: EmailStr ="not set"
    FIRST_SUPERUSER_PASSWORD: str = "changethis"
    EMAILS_ENABLED: bool = True
    ALGORITHM: str = "HS256"
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    O42_CLIENT_ID: str ="need to be seted"
    O42_CLIENT_SECRET: str = "changethis" 
    O42_REDIRECT_URI : str = "changethis" 
    O42_TOKEN_URL : str = "changethis"
    REDIS_URL : str = "redis://redis:6379/0"

    @model_validator(mode="after")
    def _refuse_placeholders(self) -> Self:
        secrets = {
            "SECRET_KEY": self.SECRET_KEY,
            "FIRST_SUPERUSER_PASSWORD": self.FIRST_SUPERUSER_PASSWORD,
        }
        left = [name for name, value in secrets.items() if value == PLACEHOLDER]
        if left:
            raise ValueError(
                f"{', '.join(left)} still {'has' if len(left) == 1 else 'have'} "
                f"the sample value, set a real one in .env"
            )
        return self

settings = Settings()