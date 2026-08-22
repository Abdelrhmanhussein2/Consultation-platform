import enum

class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"
    consultant = "consultant"
    platform_consultant = "platform_consultant"  # Consultant with approved out-of-specialization services
    super_admin = "super_admin"

class VerificationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class AppointmentStatus(str, enum.Enum):
    pending_approval = "pending_approval"   # Waiting for consultant to accept
    pending_payment  = "pending_payment"    # Consultant approved — waiting for client payment
    confirmed        = "confirmed"          # Paid & confirmed
    completed        = "completed"          # Session done
    cancelled_by_user        = "cancelled_by_user"
    cancelled_by_consultant  = "cancelled_by_consultant"
    no_show = "no_show"

class ActorRole(str, enum.Enum):
    user = "user"
    consultant = "consultant"
    admin = "admin"

class RatingStatus(str, enum.Enum):
    published = "published"
    pending_review = "pending_review"
    rejected = "rejected"

class NotificationType(str, enum.Enum):
    appointment_booked           = "appointment_booked"
    appointment_approved         = "appointment_approved"
    appointment_cancelled        = "appointment_cancelled"
    appointment_reminder         = "appointment_reminder"
    appointment_rescheduled      = "appointment_rescheduled"
    payment_required             = "payment_required"
    credential_status_update     = "credential_status_update"
    service_request_status_update = "service_request_status_update"
    rating_pending_review        = "rating_pending_review"
    rating_status_update         = "rating_status_update"
    consultant_application_reviewed = "consultant_application_reviewed"
    session_link_ready           = "session_link_ready"
    session_started              = "session_started"
    session_ended                = "session_ended"
    general                      = "general"


class InvoiceType(str, enum.Enum):
    client_invoice = "client_invoice"
    consultant_payout = "consultant_payout"
    platform_internal = "platform_internal"

class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    issued = "issued"
    paid = "paid"
    cancelled = "cancelled"
    refunded = "refunded"


class EntityType(str, enum.Enum):
    individual = "individual"      # أفراد
    company = "company"            # شركات ومؤسسات
    researcher = "researcher"      # باحثون وأكاديميون


class BusinessSector(str, enum.Enum):
    banking = "banking"            # القطاع البنكي
    commercial = "commercial"      # القطاع التجاري
    industrial = "industrial"      # القطاع الصناعي
    agricultural = "agricultural"  # القطاع الزراعي
    services = "services"          # قطاع الخدمات
    contracting = "contracting"    # قطاع المقاولات
    other = "other"                # أخرى


class TicketCategory(str, enum.Enum):
    technical = "technical"
    billing = "billing"
    consultation = "consultation"
    account = "account"
    withdrawal = "withdrawal"
    legal = "legal"
    other = "other"


class TicketPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TicketStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class NotificationAudience(str, enum.Enum):
    all = "all"
    users_only = "users_only"
    consultants_only = "consultants_only"
    companies_only = "companies_only"
    researchers_only = "researchers_only"
    admins_only = "admins_only"


class AdminPermission(str, enum.Enum):
    manage_users = "manage_users"
    manage_consultants = "manage_consultants"
    manage_admins = "manage_admins"
    view_analytics = "view_analytics"
    reply_tickets = "reply_tickets"
    manage_sessions = "manage_sessions"
    send_notifications = "send_notifications"


