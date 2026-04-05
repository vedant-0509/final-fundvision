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
    
    # We use Union here so Pydantic accepts BOTH during the transition 
    # and then our validator converts it to a clean List[str]
    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://localhost:5173,http://localhost:8000"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v: Any) -> List[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            # Strip brackets/quotes just in case they are in the .env
            v = v.replace("[", "").replace("]", "").replace('"', "").replace("'", "")
            return [o.strip() for o in v.split(",") if o.strip()]
        return ["http://localhost:5173"]

    # Security
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "fundvision"
    DB_USER: str = "root"
    DB_PASSWORD: str = "root"

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+aiomysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # AI & APIs
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-sonnet-4-20250514"
    AMFI_NAV_URL: str = "https://www.amfiindia.com/spages/NAVAll.txt"

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()