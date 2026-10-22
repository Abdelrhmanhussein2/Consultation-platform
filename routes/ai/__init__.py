from .ai_chat_routes import router as ai_chat_router
from .chat_ai_routes import router as chat_ai_router
from .legal_routes import router as legal_router

__all__ = ["ai_chat_router", "chat_ai_router", "legal_router"]
