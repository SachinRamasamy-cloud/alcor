from functools import lru_cache
from typing import Literal

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: Literal["development", "test", "staging", "production"] = "development"
    database_url: SecretStr = SecretStr(
        "postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor"
    )
    redis_url: SecretStr = SecretStr("redis://127.0.0.1:56379/0")
    allowed_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    metadata_provider: Literal["fixture", "disabled"] = "fixture"
    anilist_use_approved: bool = False
    supabase_url: str = ""
    jwt_issuer: str = ""
    jwt_audience: str = "authenticated"

    @model_validator(mode="after")
    def production_is_explicit(self):
        if self.app_env in {"staging", "production"}:
            if self.metadata_provider == "fixture":
                raise ValueError(
                    "Development catalogue fixtures are forbidden outside development/test"
                )
            if not self.supabase_url.startswith("https://") or not self.jwt_issuer.startswith(
                "https://"
            ):
                raise ValueError("HTTPS identity configuration is required")
            if not self.allowed_origins or any(
                not origin.startswith("https://") or "localhost" in origin or "*" in origin
                for origin in self.allowed_origins
            ):
                raise ValueError("Explicit HTTPS production origins are required")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
