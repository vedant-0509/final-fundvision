from functools import lru_cache
from typing import List, Any, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App Settings
    APP_NAME: str = "FundVision Pro"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    
    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://localhost:5173,http://localhost:8000"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v: Any) -> List[str]:
        if isinstance(v, list): return v
        if isinstance(v, str):
            v = v.replace("[", "").replace("]", "").replace('"', "").replace("'", "")
            return [o.strip() for o in v.split(",") if o.strip()]
        return ["http://localhost:5173"]

    # ── Security (Fixed: Added missing attributes) ──────────────────────────
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # This was the missing line causing the error

    # ── Database ─────────────────────────────────────────────────────────────
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "fundvision"
    DB_USER: str = "root"
    DB_PASSWORD: str = "root"

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+aiomysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # ── AI Config (Google Gemini) ──────────────────────────────────────────
    GOOGLE_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    AMFI_NAV_URL: str = "https://www.amfiindia.com/spages/NAVAll.txt"

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
