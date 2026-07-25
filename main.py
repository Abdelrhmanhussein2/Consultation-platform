from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from helpers.database import engine, Base
from routes.api import api_router
from helpers.neo4j_db import init_neo4j_db, neo4j_db

# Optionally create database tables (useful for local development if tables don't exist)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create tables on startup. Make sure database is running and credentials are correct. Error: {e}")

app = FastAPI(
    title="Consultation Platform API",
    description="Decoupled MVC Backend for Consultation Booking and Management",
    version="1.0.0"
)

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
