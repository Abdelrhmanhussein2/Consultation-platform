from fastapi import APIRouter

from routes.auth import auth_router
from routes.ai import ai_chat_router, chat_ai_router, legal_router
from routes.finance import (
    invoice_router, recurring_invoice_router, refunded_invoice_router, subscription_router
)
from routes.consultations import (
    appointment_router, consultant_router, session_router, specialization_router
)
from routes.users import (
    user_router, user_document_router, template_router,
    folder_router, favorite_router, highlight_router
)
from routes.admin import super_admin_router, settings_router
from routes.communication import (
    notification_router, chat_router, ticket_router
)

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(ai_chat_router)
api_router.include_router(chat_ai_router)
api_router.include_router(legal_router)
api_router.include_router(invoice_router)
api_router.include_router(recurring_invoice_router)
api_router.include_router(refunded_invoice_router)
api_router.include_router(subscription_router)
api_router.include_router(appointment_router)
api_router.include_router(consultant_router)
api_router.include_router(session_router)
api_router.include_router(specialization_router)
api_router.include_router(user_router)
api_router.include_router(user_document_router)
api_router.include_router(template_router)
api_router.include_router(folder_router)
api_router.include_router(favorite_router)
api_router.include_router(highlight_router)
api_router.include_router(super_admin_router)
api_router.include_router(settings_router)
api_router.include_router(notification_router)
api_router.include_router(chat_router)
api_router.include_router(ticket_router)
