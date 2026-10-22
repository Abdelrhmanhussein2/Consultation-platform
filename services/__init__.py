# Re-exports from modular subpackages
from services.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, verify_access_token, verify_refresh_token,
    TokenService
)
from services.ai import (
    BaseLLM, GroqLLM, OpenAILLM, LLMService,
    BaseEmbeddings, CohereEmbeddings, EmbeddingsService, VectorIndexService,
    Neo4jRAGService, HybridSearchService, AIChatService, LegalGraphService, DocxParserService
)
from services.finance import (
    InvoiceService, RecurringInvoiceService, RefundedInvoiceService, WalletService
)
from services.consultations import (
    AppointmentService, ConsultantService, DailyService, GoogleCalendarService,
    SpecializationService, ServiceExpansionService, RatingService
)
from services.users import UserService
from services.admin import (
    SuperAdminService, AdminPermissionService, PlatformSettingsService
)
from services.communication import (
    NotificationService, LiveNotificationService, EmailService, ChatService, TicketService
)

__all__ = [
    # Auth
    "hash_password", "verify_password",
    "create_access_token", "create_refresh_token", "verify_access_token", "verify_refresh_token",
    "TokenService",
    # AI
    "BaseLLM", "GroqLLM", "OpenAILLM", "LLMService",
    "BaseEmbeddings", "CohereEmbeddings", "EmbeddingsService", "VectorIndexService",
    "Neo4jRAGService", "HybridSearchService", "AIChatService", "LegalGraphService", "DocxParserService",
    # Finance
    "InvoiceService", "RecurringInvoiceService", "RefundedInvoiceService", "WalletService",
    # Consultations
    "AppointmentService", "ConsultantService", "DailyService", "GoogleCalendarService",
    "SpecializationService", "ServiceExpansionService", "RatingService",
    # Users
    "UserService",
    # Admin
    "SuperAdminService", "AdminPermissionService", "PlatformSettingsService",
    # Communication
    "NotificationService", "LiveNotificationService", "EmailService", "ChatService", "TicketService",
]
