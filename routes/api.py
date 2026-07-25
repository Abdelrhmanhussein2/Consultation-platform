from fastapi import APIRouter
from routes.user_routes import router as user_router
from routes.consultant_routes import router as consultant_router
from routes.appointment_routes import router as appointment_router

api_router = APIRouter(prefix="/api")
api_router.include_router(user_router)
api_router.include_router(consultant_router)
api_router.include_router(appointment_router)
