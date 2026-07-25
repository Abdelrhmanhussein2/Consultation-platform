from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/consultation_db"
    SECRET_KEY: str = "your-secret-key-change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = "supersecretpassword2026"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
