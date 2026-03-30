from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "sqlite:///./reqext.db"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    GEMINI_API_KEY: str = ""

    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24

    MAX_FILE_SIZE_MB: int = 30
    MAX_TOTAL_SIZE_MB: int = 50


settings = Settings()
