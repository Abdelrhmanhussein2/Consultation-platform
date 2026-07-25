from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
from models.enums import (
    UserRole, VerificationStatus, AppointmentStatus, ActorRole,
    RatingStatus, NotificationType, InvoiceType, InvoiceStatus
)

# =====================================================================
# USERS
# =====================================================================
class UserCreate(BaseModel):
    full_name: str = Field(..., max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = UserRole.user

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[UserRole] = None


# =====================================================================
# CONSULTANT PROFILES
# =====================================================================
class ConsultantProfileCreate(BaseModel):
    bio: Optional[str] = None
    main_specialization_id: Optional[int] = None

class ConsultantProfileOut(BaseModel):
    id: str
    user_id: str
    bio: Optional[str]
    main_specialization_id: Optional[int]
    verification_status: VerificationStatus
    rejection_reason: Optional[str]
    average_rating: Decimal
    ratings_count: int

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
    id: str
    consultant_id: str
    specialization_id: int
    document_url: str
    status: VerificationStatus
    submitted_at: datetime
    reviewed_by: Optional[str]
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

class ServiceExpansionRequestOut(BaseModel):
    id: str
    consultant_id: str
    requested_specialization_id: Optional[int]
    service_name: str
    service_description: Optional[str]
    proof_document_url: str
    status: VerificationStatus
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

class ConsultantServiceOut(BaseModel):
    id: str
    consultant_id: str
    specialization_id: Optional[int]
    name: str
    description: Optional[str]
    price: Decimal
    duration_minutes: int
    is_out_of_specialization: bool
    expansion_request_id: Optional[str]
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

class AppointmentOut(BaseModel):
    id: str
    consultant_id: str
    user_id: str
    service_id: Optional[str]
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
    id: str
    appointment_id: str
    consultant_id: str
    user_id: str
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
    id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    related_entity_type: Optional[str]
    related_entity_id: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================================
# INVOICES
# =====================================================================
class InvoiceOut(BaseModel):
    id: str
    invoice_number: str
    type: InvoiceType
    appointment_id: Optional[str]
    issued_to_user_id: Optional[str]
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
