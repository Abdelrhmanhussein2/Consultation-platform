from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
import uuid
from typing import Optional, Literal, List, Union, Any
from datetime import datetime
from decimal import Decimal
from helpers.enums import (
    UserRole, VerificationStatus, AppointmentStatus, ActorRole,
    RatingStatus, NotificationType, InvoiceType, InvoiceStatus,
    PayoutStatus, EntityType, BusinessSector, TicketCategory, TicketPriority,
    TicketStatus, NotificationAudience, AdminPermission, LegalForm, SessionType
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
    legal_form: Optional[LegalForm] = None
    company_name: Optional[str] = Field(None, max_length=200)
    tax_number: Optional[str] = Field(None, max_length=50)
    sector: Optional[BusinessSector] = None
    commercial_register_url: Optional[str] = Field(None, max_length=500)
    accepted_privacy_policy: bool = Field(..., description="Must accept privacy policy")

    @field_validator('accepted_privacy_policy')
    @classmethod
    def validate_privacy_policy(cls, v: bool) -> bool:
        if not v:
            raise ValueError('يجب الموافقة على سياسة الخصوصية لإتمام عملية التسجيل')
        return v

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
    title: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=200)
    company_name: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = None
    main_specialization_id: Optional[int] = None
    activity_type: Optional[str] = Field(None, max_length=100)
    years_of_experience: Optional[int] = None
    certificates_licenses: Optional[str] = None
    price_per_hour: Optional[Decimal] = None
    accepted_privacy_policy: bool = Field(..., description="Must accept privacy policy")

    @field_validator('accepted_privacy_policy')
    @classmethod
    def validate_privacy_policy(cls, v: bool) -> bool:
        if not v:
            raise ValueError('يجب الموافقة على سياسة الخصوصية لإتمام عملية التسجيل')
        return v

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
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = Field(None, max_length=500)
    url_slug: Optional[str] = Field(None, max_length=100)
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
    confirm_password: Optional[str] = None

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

    @model_validator(mode='after')
    def validate_confirm_password(self):
        if self.confirm_password is not None and self.new_password != self.confirm_password:
            raise ValueError('تأكيد كلمة المرور غير متطابق مع كلمة المرور الجديدة')
        return self

class EmailChangeRequest(BaseModel):
    new_email: EmailStr
    current_password: str

class EmailChangeVerify(BaseModel):
    new_email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6, pattern=r"^[0-9]{6}$", description="6-digit verification code")

class RequestPasswordOtpRequest(BaseModel):
    email: EmailStr

class VerifyPasswordOtpAndResetRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6, pattern=r"^[0-9]{6}$", description="6-digit verification code")
    new_password: str = Field(..., min_length=8)
    confirm_password: Optional[str] = None

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

    @model_validator(mode='after')
    def validate_confirm_password(self):
        if self.confirm_password is not None and self.new_password != self.confirm_password:
            raise ValueError('تأكيد كلمة المرور غير متطابق مع كلمة المرور الجديدة')
        return self

class VerifyMyPasswordOtpAndResetRequest(BaseModel):
    otp_code: str = Field(..., min_length=6, max_length=6, pattern=r"^[0-9]{6}$", description="6-digit verification code")
    new_password: str = Field(..., min_length=8)
    confirm_password: Optional[str] = None

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

    @model_validator(mode='after')
    def validate_confirm_password(self):
        if self.confirm_password is not None and self.new_password != self.confirm_password:
            raise ValueError('تأكيد كلمة المرور غير متطابق مع كلمة المرور الجديدة')
        return self

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

class UserPolicyAgreementOut(BaseModel):
    policy_id: uuid.UUID
    accepted_at: datetime

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    phone: Optional[str]
    avatar_url: Optional[str] = None
    url_slug: Optional[str] = None
    role: UserRole
    entity_type: Optional[EntityType] = EntityType.individual
    legal_form: Optional[LegalForm] = None
    company_name: Optional[str] = None
    tax_number: Optional[str] = None
    sector: Optional[BusinessSector] = None
    commercial_register_url: Optional[str] = None
    title: Optional[str] = None
    address: Optional[str] = None
    language: str = "ar"
    email_notifications: bool = True
    appointment_reminders: bool = True
    permissions: List[AdminPermission] = []
    is_active: bool
    verification_status: VerificationStatus
    policy_agreements: List[UserPolicyAgreementOut] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================================
# SYSTEM POLICIES
# =====================================================================
class SystemPolicyCreate(BaseModel):
    title: str = Field(..., max_length=150)
    policy_type: str = Field(..., max_length=50)
    version: str = Field(..., max_length=50)
    content: str

class SystemPolicyOut(BaseModel):
    id: uuid.UUID
    title: str
    policy_type: str
    version: str
    content: str
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
    activity_type: Optional[str] = None
    years_of_experience: Optional[int] = None
    certificates_licenses: Optional[str] = None
    document_url: Optional[str] = None
    price_per_hour: Optional[Decimal] = None


class ConsultantProfileOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    bio: Optional[str]
    main_specialization_id: Optional[int]
    verification_status: VerificationStatus
    rejection_reason: Optional[str]
    average_rating: Decimal
    ratings_count: int
    activity_type: Optional[str] = None
    years_of_experience: Optional[int] = None
    certificates_licenses: Optional[str] = None
    price_per_hour: Optional[Decimal] = None

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
    activity_type: Optional[str] = None
    years_of_experience: Optional[int] = None
    certificates_licenses: Optional[str] = None
    price_per_hour: Optional[Decimal] = None
    working_days: List[int] = []

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
    price_per_hour: Optional[Decimal] = None
    working_days: List[int] = []

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
    session_type: Optional[SessionType] = SessionType.video_call
    notes: Optional[str] = None

class AppointmentCancel(BaseModel):
    reason: str

class AppointmentReschedule(BaseModel):
    """Request body for rescheduling an appointment to a new time slot."""
    new_scheduled_at: datetime
    reason: Optional[str] = None

class PaymentSimulate(BaseModel):
    """Simulates payment confirmation for a pending appointment."""
    payment_method: str = "card"

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
    session_type: Optional[SessionType] = SessionType.video_call
    notes: Optional[str]
    created_at: datetime
    consultant_name: Optional[str] = None
    client_name: Optional[str] = None
    service_name: Optional[str] = None

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
    end_time: Optional[str] = Field(None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$", description="End time formatted as HH:MM")

class ConsultantAvailabilityOut(BaseModel):
    id: uuid.UUID
    consultant_id: uuid.UUID
    day_of_week: int
    start_time: time
    end_time: Optional[time] = None
    is_active: bool

    class Config:
        from_attributes = True

class AvailableSlotOut(BaseModel):
    start_time: datetime
    end_time: datetime


# =====================================================================
# ADMIN USER STATS & LIST
# =====================================================================
class RoleCount(BaseModel):
    role: UserRole
    count: int

class EntityTypeCount(BaseModel):
    entity_type: EntityType
    count: int

class UserStatsOut(BaseModel):
    total_users: int
    by_role: List[RoleCount]
    by_entity_type: List[EntityTypeCount]

class AdminUserListOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    phone: Optional[str]
    role: UserRole
    entity_type: EntityType
    company_name: Optional[str]
    tax_number: Optional[str]
    sector: Optional[BusinessSector]
    is_active: bool
    created_at: datetime
    bio: Optional[str] = None
    verification_status: Optional[VerificationStatus] = None
    price_per_hour: Optional[Decimal] = None

    class Config:
        from_attributes = True

class AdminAddUserRequest(BaseModel):
    full_name: str = Field(..., max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = UserRole.user
    entity_type: Optional[EntityType] = EntityType.individual
    company_name: Optional[str] = Field(None, max_length=200)
    tax_number: Optional[str] = Field(None, max_length=50)
    sector: Optional[BusinessSector] = None
    bio: Optional[str] = None
    main_specialization_id: Optional[int] = None
    price_per_hour: Optional[Decimal] = None

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

# =====================================================================
# ADMIN BROADCAST NOTIFICATION
# =====================================================================
class AdminBroadcastNotification(BaseModel):
    audience: NotificationAudience = NotificationAudience.all
    title: str = Field(..., max_length=200)
    message: str = Field(...)
    notification_type: Optional[Any] = NotificationType.general

    @field_validator('audience', mode='before')
    @classmethod
    def map_audience(cls, v):
        if isinstance(v, str):
            mapping = {
                'all': NotificationAudience.all,
                'users': NotificationAudience.users_only,
                'users_only': NotificationAudience.users_only,
                'clients': NotificationAudience.users_only,
                'consultants': NotificationAudience.consultants_only,
                'consultants_only': NotificationAudience.consultants_only,
                'companies': NotificationAudience.companies_only,
                'companies_only': NotificationAudience.companies_only,
                'researchers': NotificationAudience.researchers_only,
                'researchers_only': NotificationAudience.researchers_only,
                'admins': NotificationAudience.admins_only,
                'admins_only': NotificationAudience.admins_only,
            }
            return mapping.get(v.lower(), NotificationAudience.all)
        return v

    @field_validator('notification_type', mode='before')
    @classmethod
    def map_notif_type(cls, v):
        if isinstance(v, str):
            try:
                return NotificationType(v)
            except ValueError:
                return NotificationType.general
        return v or NotificationType.general

class BroadcastResultOut(BaseModel):
    sent_to: int

# =====================================================================
# SESSIONS (ADMIN)
# =====================================================================
class AdminSessionOut(BaseModel):
    appointment_id: uuid.UUID
    client_id: uuid.UUID
    client_name: str
    consultant_profile_id: uuid.UUID
    consultant_name: str
    scheduled_at: datetime
    duration_minutes: int
    status: AppointmentStatus
    session_room_name: Optional[str]
    session_room_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class AdminSessionJoinOut(BaseModel):
    room_url: str
    token: str
    expires_at: datetime

class AdminUpdateSessionStatus(BaseModel):
    status: AppointmentStatus
    notes: Optional[str] = None


# =====================================================================
# TICKETS (SUPPORT DESK)
# =====================================================================
class TicketCreate(BaseModel):
    subject: str = Field(..., max_length=200)
    description: str
    category: TicketCategory = TicketCategory.other
    priority: TicketPriority = TicketPriority.medium
    sub_category: Optional[str] = None
    extra_fields: Optional[dict] = None

class TicketReplyCreate(BaseModel):
    message: str

class TicketReplyOut(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    author_id: uuid.UUID
    author_name: str
    author_role: UserRole
    message: str
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TicketAttachmentOut(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    filename: str
    file_path: str
    file_size: int
    content_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TicketOut(BaseModel):
    id: uuid.UUID
    submitted_by: uuid.UUID
    submitter_name: str
    assigned_to: Optional[uuid.UUID]
    assignee_name: Optional[str]
    ticket_number: Optional[str] = None
    subject: str
    description: str
    category: TicketCategory
    sub_category: Optional[str] = None
    priority: TicketPriority
    status: TicketStatus
    extra_fields: Optional[dict] = None
    closed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    replies: List[TicketReplyOut] = []
    attachments: List[TicketAttachmentOut] = []

    class Config:
        from_attributes = True

# =====================================================================
# ADMIN TICKETS
# =====================================================================
class AdminTicketCreate(BaseModel):
    submitted_by: uuid.UUID
    subject: str = Field(..., max_length=200)
    description: str
    category: TicketCategory = TicketCategory.other
    priority: TicketPriority = TicketPriority.medium
    assigned_to: Optional[uuid.UUID] = None

class AdminTicketReplyCreate(BaseModel):
    message: Optional[str] = None
    reply_text: Optional[str] = None
    is_internal: bool = False
    status_update: Optional[str] = None

    @model_validator(mode='after')
    def extract_message(self):
        if not self.message and self.reply_text:
            self.message = self.reply_text
        if not self.message:
            self.message = ""
        return self

class AdminTicketUpdate(BaseModel):
    priority: Optional[Union[TicketPriority, str]] = None
    status: Optional[Union[TicketStatus, str]] = None
    internal_note: Optional[str] = None
    internal_notes: Optional[str] = None
    assigned_to: Optional[Union[uuid.UUID, str]] = None
    assignee_id: Optional[Union[uuid.UUID, str]] = None

    @model_validator(mode='after')
    def normalize_fields(self):
        if not self.internal_note and self.internal_notes:
            self.internal_note = self.internal_notes
        if not self.assigned_to and self.assignee_id:
            if isinstance(self.assignee_id, uuid.UUID):
                self.assigned_to = self.assignee_id
        return self


# =====================================================================
# ADMIN RBAC PERMISSIONS MANAGEMENT
# =====================================================================
class AdminCreate(BaseModel):
    full_name: str = Field(..., max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: Optional[str] = Field(None, max_length=20)
    permissions: List[AdminPermission] = []

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

class AdminUpdatePermissions(BaseModel):
    permissions: List[AdminPermission]


# =====================================================================
# CONSULTANT BANK ACCOUNTS & PAYOUTS (PHASE 2)
# =====================================================================
class SupportedBankOut(BaseModel):
    code: str
    name_ar: str
    name_en: str
    country: str


class ConsultantBankAccountCreate(BaseModel):
    bank_name: str = Field(..., min_length=2, max_length=150, description="Name of the selected bank")
    account_holder_name: str = Field(..., min_length=2, max_length=150, description="Full name matching bank records")
    account_number: str = Field(..., min_length=4, max_length=50, description="Bank account number (will be encrypted)")
    iban: Optional[str] = Field(None, max_length=50, description="International Bank Account Number (will be encrypted)")
    swift_code: Optional[str] = Field(None, max_length=20, description="BIC / SWIFT Code (will be encrypted)")
    branch_name: Optional[str] = Field(None, max_length=150)
    currency: str = Field("JOD", max_length=10, description="Account currency: JOD (Default) or USD")


class ConsultantBankAccountUpdate(ConsultantBankAccountCreate):
    pass


class ConsultantBankAccountOut(BaseModel):
    id: uuid.UUID
    consultant_id: uuid.UUID
    bank_name: str
    account_holder_name: str
    masked_account_number: str
    masked_iban: Optional[str] = None
    masked_swift_code: Optional[str] = None
    branch_name: Optional[str] = None
    currency: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConsultantWalletOut(BaseModel):
    available_balance: Decimal = Field(..., description="Available funds eligible for withdrawal in primary currency")
    pending_balance: Decimal = Field(..., description="Escrow funds for upcoming sessions")
    total_earned: Decimal = Field(..., description="Lifetime total earnings from completed sessions")
    total_withdrawn: Decimal = Field(..., description="Lifetime total payouts transferred")
    pending_payouts: Decimal = Field(..., description="In-flight payout requests under review")
    currency: str = Field("JOD", description="Primary currency: JOD")
    secondary_currency: Optional[str] = Field("USD", description="Secondary reference currency: USD")
    secondary_available_balance: Optional[Decimal] = Field(None, description="Equivalent available balance in secondary currency")
    has_bank_account: bool
    bank_account: Optional[ConsultantBankAccountOut] = None



class PayoutRequestCreate(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Amount to withdraw in consultant wallet currency")


class PayoutRequestOut(BaseModel):
    id: uuid.UUID
    consultant_id: uuid.UUID
    consultant_name: Optional[str] = None
    amount: Decimal
    currency: str
    bank_details_snapshot: dict
    status: PayoutStatus
    transfer_reference: Optional[str] = None
    receipt_url: Optional[str] = None
    admin_notes: Optional[str] = None
    processed_by_name: Optional[str] = None
    requested_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminPayoutAction(BaseModel):
    action: Literal["approve", "transfer", "reject"]
    transfer_reference: Optional[str] = Field(None, max_length=150, description="Reference code for bank transfer")
    receipt_url: Optional[str] = Field(None, max_length=500, description="URL to the transfer receipt image/PDF")
    admin_notes: Optional[str] = Field(None, description="Notes or rejection reason")


# =====================================================================
# PLATFORM & SYSTEM SETTINGS SCHEMAS (PHASE 4)
# =====================================================================

class BrandSettingsSchema(BaseModel):
    title_text: str = Field("منصة الاستشارات القانونية والمالية", max_length=200)
    footer_text: str = Field("جميع الحقوق محفوظة © 2026", max_length=200)
    logo_dark_url: Optional[str] = None
    logo_light_url: Optional[str] = None
    favicon_url: Optional[str] = None
    default_language: str = Field("ar", max_length=10)
    default_direction: str = Field("rtl", max_length=10)
    primary_color: str = Field("#1A56DB", max_length=20)
    custom_css: Optional[str] = None


class SystemSettingsSchema(BaseModel):
    date_format: str = Field("YYYY-MM-DD", max_length=50)
    time_format: str = Field("12_hour", max_length=20)
    default_timezone: str = Field("Asia/Amman", max_length=100)
    default_currency_code: str = Field("JOD", max_length=10)
    default_currency_symbol: str = Field("د.أ", max_length=10)
    currency_position: str = Field("after", max_length=10)
    decimal_separator: str = Field(".", max_length=5)
    thousands_separator: str = Field(",", max_length=5)
    decimal_digits: int = Field(2, ge=0, le=4)


class CompanySettingsSchema(BaseModel):
    company_name: str = Field("شركة المنصة للاستشارات ذ.م.م", max_length=200)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field("عمان", max_length=100)
    state: Optional[str] = Field("محافظة العاصمة", max_length=100)
    country: str = Field("الأردن", max_length=100)
    tax_number: Optional[str] = Field(None, max_length=100)
    commercial_register: Optional[str] = Field(None, max_length=100)
    support_email: Optional[EmailStr] = None
    support_phone: Optional[str] = Field(None, max_length=50)


class CurrencyItemSchema(BaseModel):
    code: str = Field(..., max_length=10)
    name_ar: str = Field(..., max_length=100)
    name_en: str = Field(..., max_length=100)
    symbol: str = Field(..., max_length=10)
    rate_to_jod: float = Field(1.0, gt=0)
    is_default: bool = False
    is_active: bool = True


class CurrencySettingsSchema(BaseModel):
    currencies: List[CurrencyItemSchema] = Field(default_factory=list)


class ContractSettingsSchema(BaseModel):
    contract_prefix: str = Field("#CON-", max_length=50)
    invoice_prefix: str = Field("#INV-", max_length=50)
    number_padding: int = Field(5, ge=1, le=10)
    next_contract_number: int = Field(1001, ge=1)
    next_invoice_number: int = Field(5001, ge=1)
    contract_terms_template: Optional[str] = None


class SMTPSettingsSchema(BaseModel):
    mail_driver: str = Field("smtp", max_length=50)
    mail_host: str = Field("smtp.mailtrap.io", max_length=200)
    mail_port: int = Field(587, ge=1, le=65535)
    mail_username: str = Field("", max_length=150)
    mail_password: Optional[str] = Field(None, max_length=150)
    mail_encryption: str = Field("tls", max_length=20)
    mail_from_address: str = Field("no-reply@consultation-jo.com", max_length=150)
    mail_from_name: str = Field("منصة الاستشارات", max_length=150)


class BankTransferGatewaySchema(BaseModel):
    is_enabled: bool = True
    bank_name: str = Field("البنك العربي - Arab Bank", max_length=150)
    account_holder_name: str = Field("شركة المنصة للاستشارات ذ.م.م", max_length=150)
    account_number: str = Field("0123456789", max_length=100)
    iban: Optional[str] = Field("JO94ARAB0000000012345678901234", max_length=100)
    swift_code: Optional[str] = Field("ARABJOAX", max_length=50)
    branch_name: Optional[str] = Field("فرع الشميساني - عمان", max_length=150)
    instructions_ar: Optional[str] = Field("يرجى تحويل قيمة الاستشارة وإرفاق إيصال السداد لتأكيد الحجز فوراً.")


class PayPalGatewaySchema(BaseModel):
    is_enabled: bool = False
    mode: str = Field("sandbox", max_length=20)
    client_id: Optional[str] = Field(None, max_length=255)
    secret_key: Optional[str] = Field(None, max_length=255)
    webhook_id: Optional[str] = Field(None, max_length=255)


class StripeGatewaySchema(BaseModel):
    is_enabled: bool = False
    mode: str = Field("test", max_length=20)
    publishable_key: Optional[str] = Field(None, max_length=255)
    secret_key: Optional[str] = Field(None, max_length=255)
    webhook_secret: Optional[str] = Field(None, max_length=255)


class PaymentGatewaysSchema(BaseModel):
    bank_transfer: BankTransferGatewaySchema = Field(default_factory=BankTransferGatewaySchema)
    paypal: PayPalGatewaySchema = Field(default_factory=PayPalGatewaySchema)
    stripe: StripeGatewaySchema = Field(default_factory=StripeGatewaySchema)


class AllPlatformSettingsOut(BaseModel):
    brand: BrandSettingsSchema
    system: SystemSettingsSchema
    company: CompanySettingsSchema
    currency: CurrencySettingsSchema
    contract: ContractSettingsSchema
    smtp: SMTPSettingsSchema
    gateways: PaymentGatewaysSchema
    sample_price_preview: Optional[str] = None
    sample_contract_preview: Optional[str] = None
    updated_at: Optional[datetime] = None


class PublicPaymentGatewayOut(BaseModel):
    bank_transfer: Optional[BankTransferGatewaySchema] = None
    paypal_enabled: bool = False
    paypal_client_id: Optional[str] = None
    stripe_enabled: bool = False
    stripe_publishable_key: Optional[str] = None


class PublicPlatformSettingsOut(BaseModel):
    brand: BrandSettingsSchema
    system: SystemSettingsSchema
    company: CompanySettingsSchema
    active_currencies: List[CurrencyItemSchema]
    contract_prefix: str
    invoice_prefix: str
    gateways: PublicPaymentGatewayOut


class TestEmailRequest(BaseModel):
    __test__ = False
    email: EmailStr = Field(..., description="Target email address to receive test message")


class TestEmailResponse(BaseModel):
    __test__ = False
    success: bool
    message: str
    host: Optional[str] = None
    port: Optional[int] = None
    from_address: Optional[str] = None
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserDocumentOut(BaseModel):
    id: uuid.UUID
    filename: str
    file_path: str
    file_size: int
    content_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OfficialTemplateOut(BaseModel):
    id: uuid.UUID
    code: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: str
    file_path: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    language: Optional[str] = None
    downloads_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FavoriteOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    item_type: str
    item_id: str
    title: str
    subtitle: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FavoriteToggle(BaseModel):
    item_type: str
    item_id: str
    title: str
    subtitle: Optional[str] = None









