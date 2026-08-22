from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/consultation_db"
    SECRET_KEY: str = "supersecretkeyformvpdevelopment2026"
    APP_ENCRYPTION_KEY: str = ""
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

    # Qdrant settings
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: str = ""

    # Embedding and Generative AI settings
    COHERE_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-specdec"

    DAILY_API_KEY: str = ""

    # SMTP Settings
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@platform.com"
    SMTP_FROM_NAME: str = "Consultation Platform"
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    FRONTEND_CLIENT_RESET_URL: str = "http://localhost:3000/reset-password"
    FRONTEND_CONSULTANT_RESET_URL: str = "http://localhost:3001/reset-password"
    FRONTEND_ADMIN_RESET_URL: str = "http://localhost:3000/reset-password"

    # Google OAuth settings
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/consultants/auth/google/callback"

    model_config = SettingsConfigDict(env_file=("Docker/.env", ".env"), extra="ignore")

settings = Settings()
