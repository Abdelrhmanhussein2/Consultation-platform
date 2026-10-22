from .super_admin_routes import router as super_admin_router
from .settings_routes import router as settings_router

__all__ = ["super_admin_router", "settings_router"]
