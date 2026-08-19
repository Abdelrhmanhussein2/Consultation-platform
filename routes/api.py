from fastapi import APIRouter
from routes.auth_routes import router as auth_router
from routes.user_routes import router as user_router
from routes.consultant_routes import router as consultant_router
from routes.super_admin_routes import router as super_admin_router
from routes.appointment_routes import router as appointment_router
from routes.legal_routes import router as legal_router
from routes.session_routes import router as session_router

api_router = APIRouter(prefix="/api")

# Register routes
api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(consultant_router)
api_router.include_router(super_admin_router)
api_router.include_router(appointment_router)
api_router.include_router(legal_router)
api_router.include_router(session_router)
