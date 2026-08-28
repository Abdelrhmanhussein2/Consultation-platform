from fastapi import APIRouter
from routes.auth_routes import router as auth_router
from routes.user_routes import router as user_router
from routes.consultant_routes import router as consultant_router
from routes.super_admin_routes import router as super_admin_router
from routes.appointment_routes import router as appointment_router
from routes.legal_routes import router as legal_router
from routes.session_routes import router as session_router
from routes.notification_routes import router as notification_router
from routes.invoice_routes import router as invoice_router
from routes.specialization_routes import router as specialization_router
from routes.chat_routes import router as chat_router
from routes.ticket_routes import router as ticket_router
from routes.settings_routes import router as settings_router
from routes.user_document_routes import router as user_document_router
from routes.template_routes import router as template_router
from routes.favorite_routes import router as favorite_router

api_router = APIRouter(prefix="/api")

# Register routes
api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(consultant_router)
api_router.include_router(super_admin_router)
api_router.include_router(appointment_router)
api_router.include_router(legal_router)
api_router.include_router(session_router)
api_router.include_router(notification_router)
api_router.include_router(invoice_router)
api_router.include_router(specialization_router)
api_router.include_router(chat_router)
api_router.include_router(ticket_router)
api_router.include_router(settings_router)
api_router.include_router(user_document_router)
api_router.include_router(template_router)
api_router.include_router(favorite_router)




