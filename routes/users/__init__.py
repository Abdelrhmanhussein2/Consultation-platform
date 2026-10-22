from .user_routes import router as user_router
from .user_document_routes import router as user_document_router
from .template_routes import router as template_router
from .folder_routes import router as folder_router
from .favorite_routes import router as favorite_router
from .highlight_routes import router as highlight_router

__all__ = [
    "user_router",
    "user_document_router",
    "template_router",
    "folder_router",
    "favorite_router",
    "highlight_router"
]
