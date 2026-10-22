from .appointment_routes import router as appointment_router
from .consultant_routes import router as consultant_router
from .session_routes import router as session_router
from .specialization_routes import router as specialization_router

__all__ = [
    "appointment_router",
    "consultant_router",
    "session_router",
    "specialization_router"
]
