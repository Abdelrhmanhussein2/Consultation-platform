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
    general = "general"


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
