from pydantic import BaseModel, EmailStr, Field, field_validator
import uuid
from typing import Optional, Literal, List
from datetime import datetime
from decimal import Decimal
from helpers.enums import (
    UserRole, VerificationStatus, AppointmentStatus, ActorRole,
    RatingStatus, NotificationType, InvoiceType, InvoiceStatus,
    EntityType, BusinessSector
)

# =====================================================================
# USERS
# =====================================================================
class UserCreate(BaseModel):
    full_name: str = Field(..., max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: Optional[str] = Field(None, max_length=20)
    entity_type: Optional[EntityType] = EntityType.individual
    company_name: Optional[str] = Field(None, max_length=200)
    tax_number: Optional[str] = Field(None, max_length=50)
    sector: Optional[BusinessSector] = None

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        special_chars = set("!@#$%&*()_+-=[]{}|;':\",.//<>?~`")
        if not any(c in special_chars for c in v):
            raise ValueError('Password must contain at least one special character')
        return v

class ConsultantRegister(BaseModel):
    full_name: str = Field(..., max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: str = Field(..., max_length=20)
    bio: Optional[str] = None
    main_specialization_id: Optional[int] = None

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        special_chars = set("!@#$%&*()_+-=[]{}|;':\",.//<>?~`")
        if not any(c in special_chars for c in v):
            raise ValueError('Password must contain at least one special character')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=150)
    phone: Optional[str] = Field(None, max_length=20)
    entity_type: Optional[EntityType] = None
    company_name: Optional[str] = Field(None, max_length=200)
    tax_number: Optional[str] = Field(None, max_length=50)
    sector: Optional[BusinessSector] = None
    language: Optional[str] = Field(None, pattern="^(ar|en)$")
    email_notifications: Optional[bool] = None
    appointment_reminders: Optional[bool] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

    @field_validator('new_password')
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        special_chars = set("!@#$%&*()_+-=[]{}|;':\",.//<>?~`")
        if not any(c in special_chars for c in v):
            raise ValueError('Password must contain at least one special character')
        return v

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    redirect_url: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

    @field_validator('new_password')
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        special_chars = set("!@#$%&*()_+-=[]{}|;':\",.//<>?~`")
        if not any(c in special_chars for c in v):
            raise ValueError('Password must contain at least one special character')
        return v

class UserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    phone: Optional[str]
    role: UserRole
    entity_type: Optional[EntityType] = EntityType.individual
    company_name: Optional[str] = None
    tax_number: Optional[str] = None
    sector: Optional[BusinessSector] = None
    language: str = "ar"
    email_notifications: bool = True
    appointment_reminders: bool = True
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[uuid.UUID] = None
    role: Optional[UserRole] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class ConsultantApplicationAction(BaseModel):
    action: Literal["approve", "reject"]
    rejection_reason: Optional[str] = None

    @field_validator('rejection_reason')
    @classmethod
    def check_rejection_reason(cls, v: Optional[str], info) -> Optional[str]:
        action = info.data.get('action')
        if action == "reject" and (not v or not v.strip()):
            raise ValueError('Rejection reason is required when rejecting a consultant application')
        return v

class ConsultantApplicationStatus(BaseModel):
    status: VerificationStatus
    rejection_reason: Optional[str]
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# =====================================================================
# SPECIALIZATIONS
# =====================================================================
class SpecializationOut(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True


# =====================================================================
# CONSULTANT PROFILES
# =====================================================================
class ConsultantProfileCreate(BaseModel):
    bio: Optional[str] = None
    main_specialization_id: Optional[int] = None

class ConsultantProfileOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    bio: Optional[str]
    main_specialization_id: Optional[int]
    verification_status: VerificationStatus
    rejection_reason: Optional[str]
    average_rating: Decimal
    ratings_count: int

    class Config:
        from_attributes = True

class ConsultantServiceSummary(BaseModel):
    """Lightweight service info used inside public consultant profiles."""
    id: uuid.UUID
    name: str
    description: Optional[str]
    price: Decimal
    duration_minutes: int
    specialization_id: Optional[int]

    class Config:
        from_attributes = True

class ConsultantPublicProfileOut(BaseModel):
    """Full public-facing consultant profile — visible to all authenticated users."""
    id: uuid.UUID
    full_name: str
    bio: Optional[str]
    main_specialization_id: Optional[int]
    specialization_name: Optional[str]
    average_rating: Decimal
    ratings_count: int
    role: UserRole
    services: List[ConsultantServiceSummary] = []

    class Config:
        from_attributes = True

class ConsultantListItemOut(BaseModel):
    """Compact consultant card used in the listing/browse page."""
    profile_id: uuid.UUID
    full_name: str
    bio: Optional[str]
    main_specialization_id: Optional[int]
    specialization_name: Optional[str]
    average_rating: Decimal
    ratings_count: int
    role: UserRole
    services_count: int

    class Config:
        from_attributes = True


# =====================================================================
# CONSULTANT CREDENTIALS
# =====================================================================
class CredentialCreate(BaseModel):
    specialization_id: int
    document_url: str

class CredentialReview(BaseModel):
    status: VerificationStatus
    rejection_reason: Optional[str] = None

class CredentialOut(BaseModel):
    id: uuid.UUID
    consultant_id: uuid.UUID
    specialization_id: int
    document_url: str
    status: VerificationStatus
    submitted_at: datetime
    reviewed_by: Optional[uuid.UUID]
    reviewed_at: Optional[datetime]
    rejection_reason: Optional[str]

    class Config:
        from_attributes = True


# =====================================================================
# SERVICE EXPANSION REQUESTS
# =====================================================================
class ServiceExpansionRequestCreate(BaseModel):
    requested_specialization_id: Optional[int] = None
    service_name: str = Field(..., max_length=200)
    service_description: Optional[str] = None
    proof_document_url: str

class ServiceExpansionReview(BaseModel):
    status: VerificationStatus
    rejection_reason: Optional[str] = None

class ServiceExpansionReviewAction(BaseModel):
    """Admin action on a service expansion request."""
    action: Literal["approve", "reject"]
    rejection_reason: Optional[str] = None

    @field_validator('rejection_reason')
    @classmethod
    def check_rejection_reason(cls, v: Optional[str], info) -> Optional[str]:
        action = info.data.get('action')
        if action == "reject" and (not v or not v.strip()):
            raise ValueError('Rejection reason is required when rejecting an expansion request')
        return v

class ServiceExpansionRequestOut(BaseModel):
    id: uuid.UUID
    consultant_id: uuid.UUID
    requested_specialization_id: Optional[int]
    service_name: str
    service_description: Optional[str]
    proof_document_url: str
    status: VerificationStatus
    rejection_reason: Optional[str]
    reviewed_by: Optional[uuid.UUID]
    reviewed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================================
# CONSULTANT SERVICES
# =====================================================================
class ConsultantServiceCreate(BaseModel):
    specialization_id: Optional[int] = None
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    price: Decimal = Field(..., ge=0)
    duration_minutes: int = Field(60, ge=1)
    is_out_of_specialization: bool = False
    expansion_request_id: Optional[str] = None

class ConsultantServiceUpdate(BaseModel):
    """Partial update for an existing consultant service."""
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    duration_minutes: Optional[int] = Field(None, ge=1)

class ConsultantServiceOut(BaseModel):
    id: uuid.UUID
    consultant_id: uuid.UUID
    specialization_id: Optional[int]
    name: str
    description: Optional[str]
    price: Decimal
    duration_minutes: int
    is_out_of_specialization: bool
    expansion_request_id: Optional[uuid.UUID]
    is_active: bool

    class Config:
        from_attributes = True


# =====================================================================
# APPOINTMENTS
# =====================================================================
class AppointmentCreate(BaseModel):
    consultant_id: str
    service_id: Optional[str] = None
    scheduled_at: datetime
    duration_minutes: int = Field(60, ge=1)
    notes: Optional[str] = None

class AppointmentCancel(BaseModel):
    reason: str

class AppointmentReschedule(BaseModel):
    """Request body for rescheduling an appointment to a new time slot."""
    new_scheduled_at: datetime
    reason: Optional[str] = None

class PaymentSimulate(BaseModel):
    """Simulates payment confirmation for a pending appointment."""
    payment_method: Literal["card", "cash", "wallet"] = "card"

class AppointmentOut(BaseModel):
    id: uuid.UUID
    consultant_id: uuid.UUID
    user_id: uuid.UUID
    service_id: Optional[uuid.UUID]
    scheduled_at: datetime
    duration_minutes: int
    status: AppointmentStatus
    created_by_role: ActorRole
    price: Optional[Decimal]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================================
# RATINGS
# =====================================================================
class RatingCreate(BaseModel):
    stars: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    low_rating_reason: Optional[str] = None

    @field_validator('low_rating_reason')
    @classmethod
    def check_low_rating_reason(cls, v: Optional[str], info) -> Optional[str]:
        stars = info.data.get('stars')
        if stars is not None and stars < 2 and not v:
            raise ValueError('Reason is required for ratings under 2 stars')
        return v

class RatingReview(BaseModel):
    status: RatingStatus
    low_rating_reason: Optional[str] = None

class RatingOut(BaseModel):
    id: uuid.UUID
    appointment_id: uuid.UUID
    consultant_id: uuid.UUID
    user_id: uuid.UUID
    stars: int
    comment: Optional[str]
    status: RatingStatus
    low_rating_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================================
# NOTIFICATIONS
# =====================================================================
class NotificationOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: NotificationType
    title: str
    message: str
    related_entity_type: Optional[str]
    related_entity_id: Optional[uuid.UUID]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UnreadCountOut(BaseModel):
    unread_count: int

class NotificationBulkReadOut(BaseModel):
    message: str
    updated_count: int


# =====================================================================
# INVOICES
# =====================================================================
class InvoiceOut(BaseModel):
    id: uuid.UUID
    invoice_number: str
    type: InvoiceType
    appointment_id: Optional[uuid.UUID]
    issued_to_user_id: Optional[uuid.UUID]
    amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    currency: str
    status: InvoiceStatus
    payment_method: Optional[str]
    issued_at: Optional[datetime]
    paid_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================================
# SESSIONS & CLIENT SUMMARIES
# =====================================================================
class SessionJoinOut(BaseModel):
    room_url: str
    token: str
    expires_at: datetime
    appointment_id: uuid.UUID

class ClientSummaryOut(BaseModel):
    user_id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: Optional[str]
    total_sessions: int
    completed_sessions: int
    cancelled_sessions: int
    total_paid: Decimal
    average_rating_given: Optional[float]
    last_appointment_at: Optional[datetime]
    next_appointment_at: Optional[datetime]
    first_session_at: Optional[datetime]


# =====================================================================
# CHAT MESSAGES
# =====================================================================
class ChatMessageCreate(BaseModel):
    message_text: Optional[str] = None
    attachment_url: Optional[str] = Field(None, max_length=500)

class ChatMessageOut(BaseModel):
    id: uuid.UUID
    appointment_id: uuid.UUID
    sender_id: uuid.UUID
    receiver_id: uuid.UUID
    message_text: Optional[str]
    attachment_url: Optional[str]
    is_read: bool
    created_at: datetime
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True

class ChatReadResponse(BaseModel):
    message: str
    marked_read_count: int


# =====================================================================
# CONSULTANT AVAILABILITY
# =====================================================================
from datetime import time

class ConsultantAvailabilityCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0 = Monday, 6 = Sunday")
    start_time: str = Field(..., pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$", description="Start time formatted as HH:MM")

class ConsultantAvailabilityOut(BaseModel):
    id: uuid.UUID
    consultant_id: uuid.UUID
    day_of_week: int
    start_time: time
    is_active: bool

    class Config:
        from_attributes = True

class AvailableSlotOut(BaseModel):
    start_time: datetime
    end_time: datetime

