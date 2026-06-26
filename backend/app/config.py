"""Application settings, loaded from environment / .env."""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""

    # GPT-4o for reasoning (gaps + rewrite), GPT-4o-mini for scoring.
    reasoning_model: str = "gpt-4o"
    scoring_model: str = "gpt-4o-mini"

    # Defaults applied when the request omits them.
    default_threshold: int = 80
    default_max_iterations: int = 3

    # CORS: comma-separated origins the frontend is served from.
    frontend_origin: str = "http://localhost:5173"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_origin.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
