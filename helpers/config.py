from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/consultation_db"
    SECRET_KEY: str = "supersecretkeyformvpdevelopment2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    SUPER_ADMIN_EMAIL: str = "superadmin@platform.com"
    SUPER_ADMIN_PASSWORD: str = "supersecretpassword2026"
    SUPER_ADMIN_FULL_NAME: str = "Super Administrator"
    
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_REGISTER: str = "3/minute"
    
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = "supersecretpassword2026"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
