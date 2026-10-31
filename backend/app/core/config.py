from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="VQCW_")

    app_name: str = "VQC Workbench"
    api_prefix: str = "/api"
    cors_origins: list[str] = ["http://localhost:5174", "http://127.0.0.1:5174"]

    data_dir: Path = Path(__file__).resolve().parents[2] / "data"
    database_url: str = "sqlite:///" + str(Path(__file__).resolve().parents[2] / "data" / "workbench.db")

    max_training_samples: int = 400


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    return settings
