from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from helpers.database import engine, Base
from routes.api import api_router
from helpers.neo4j_db import init_neo4j_db, neo4j_db
from helpers.qdrant_client import qdrant_db
from helpers.limiter import limiter
from helpers.redis_client import redis_client
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Optionally create database tables (useful for local development if tables don't exist)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create tables on startup. Make sure database is running and credentials are correct. Error: {e}")

# Migrate PostgreSQL enum types — safely add new values if they don't already exist
try:
    from sqlalchemy import text
    with engine.connect() as _conn:
        _conn.execute(text("COMMIT"))  # exit any implicit transaction
        for _val in ("pending_approval", "pending_payment"):
            _conn.execute(text(
                f"ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS '{_val}'"
            ))
        for _val in ("appointment_approved", "appointment_rescheduled", "payment_required", "session_link_ready", "session_started", "session_ended"):
            _conn.execute(text(
                f"ALTER TYPE notification_type ADD VALUE IF NOT EXISTS '{_val}'"
            ))
    print("INFO: Enum migration completed successfully.")
except Exception as e:
    print(f"Warning: Enum migration failed (safe to ignore if using SQLite or first boot): {e}")


app = FastAPI(
    title="Consultation Platform API",
    description="Decoupled MVC Backend for Consultation Booking and Management",
    version="1.0.0"
)

# Wire SlowAPI rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)

# Include central MVC router
app.include_router(api_router)

@app.on_event("startup")
def startup_event():
    # Initialize Neo4j constraints
    init_neo4j_db()
    
    # Initialize Qdrant collection
    qdrant_db.init_collection()
    
    # Verify Redis connectivity
    try:
        redis_client.ping()
        print("INFO: Connected to Redis successfully.")
    except Exception as e:
        print(f"WARNING: Could not connect to Redis at startup. Access token blacklisting will not work. Error: {e}")

@app.on_event("shutdown")
def shutdown_event():
    # Close Neo4j driver
    neo4j_db.close()

@app.get("/")
def root():
    return {
        "message": "Welcome to the Consultation Platform API",
        "docs_url": "/docs",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
