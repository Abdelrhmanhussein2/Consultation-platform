from helpers.database import Base, get_db, engine, SessionLocal
from helpers.enums import (
    UserRole, VerificationStatus, AppointmentStatus, ActorRole,
    RatingStatus, NotificationType, InvoiceType, InvoiceStatus,
    PayoutStatus, LegalForm, SessionType, AIChatRole
)

# Auth models
from models.auth import RefreshToken

# AI models
from models.ai import AIChatSession, AIChatMessage

# Finance models
from models.finance import (
    Invoice, RecurringInvoice, RefundedInvoice, PayoutRequest, ConsultantBankAccount,
    SubscriptionPlan, SubscriptionPlanCycle, SubscriptionPlanVersion,
    UserSubscription, SubscriptionUsageLog, SubscriptionTimeline,
    SubscriptionRequest, SubscriptionOrder
)

# Consultations models
from models.consultations import (
    Appointment, AppointmentCancellation, ConsultantProfile, ConsultantCredential,
    ConsultantService, ConsultantAvailability, ServiceExpansionRequest,
    Specialization, Rating
)

# Users & Content models
from models.users import (
    User, UserDocument, UserFolder, UserFolderItem, UserFolderFile,
    UserHighlight, Favorite, OfficialTemplate, FileDownloadLog, UserPolicyAgreement
)

# Admin models
from models.admin import (
    AdminActionLog, PlatformSetting, SystemPolicy, AutomationRule
)

# Communication models
from models.communication import (
    Notification, ChatMessage, SupportTicket, TicketReply, TicketAttachment
)

__all__ = [
    "Base", "get_db", "engine", "SessionLocal",
    "UserRole", "VerificationStatus", "AppointmentStatus", "ActorRole",
    "RatingStatus", "NotificationType", "InvoiceType", "InvoiceStatus",
    "PayoutStatus", "LegalForm", "SessionType", "AIChatRole",
    # Auth
    "RefreshToken",
    # AI
    "AIChatSession", "AIChatMessage",
    # Finance
    "Invoice", "RecurringInvoice", "RefundedInvoice", "PayoutRequest", "ConsultantBankAccount",
    "SubscriptionPlan", "SubscriptionPlanCycle", "SubscriptionPlanVersion",
    "UserSubscription", "SubscriptionUsageLog", "SubscriptionTimeline",
    "SubscriptionRequest", "SubscriptionOrder",
    # Consultations
    "Appointment", "AppointmentCancellation", "ConsultantProfile", "ConsultantCredential",
    "ConsultantService", "ConsultantAvailability", "ServiceExpansionRequest",
    "Specialization", "Rating",
    # Users
    "User", "UserDocument", "UserFolder", "UserFolderItem", "UserFolderFile",
    "UserHighlight", "Favorite", "OfficialTemplate", "FileDownloadLog", "UserPolicyAgreement",
    # Admin
    "AdminActionLog", "PlatformSetting", "SystemPolicy", "AutomationRule",
    # Communication
    "Notification", "ChatMessage", "SupportTicket", "TicketReply", "TicketAttachment",
]
