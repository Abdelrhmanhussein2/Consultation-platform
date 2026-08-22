import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, func, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from helpers.database import Base
from helpers.enums import UserRole, EntityType, BusinessSector, LegalForm, VerificationStatus

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(Text, nullable=False)
    role = Column(PG_ENUM(UserRole, name="user_role", inherit_schema=True), nullable=False, default=UserRole.user)
    entity_type = Column(PG_ENUM(EntityType, name="entity_type", inherit_schema=True), nullable=False, default=EntityType.individual)
    legal_form = Column(PG_ENUM(LegalForm, name="legal_form", inherit_schema=True), nullable=True)
    company_name = Column(String(200), nullable=True)
    tax_number = Column(String(50), nullable=True)
    sector = Column(PG_ENUM(BusinessSector, name="business_sector", inherit_schema=True), nullable=True)
    language = Column(String(5), nullable=False, default="ar")
    email_notifications = Column(Boolean, nullable=False, default=True)
    appointment_reminders = Column(Boolean, nullable=False, default=True)
    avatar_url = Column(String(500), nullable=True)
    url_slug = Column(String(100), unique=True, nullable=True)
    commercial_register_url = Column(String(500), nullable=True)
    title = Column(String(50), nullable=True)
    address = Column(String(200), nullable=True)
    verification_status = Column(PG_ENUM(VerificationStatus, name="verification_status", inherit_schema=True), nullable=False, default=VerificationStatus.pending)
    permissions = Column(JSON, nullable=True, default=list)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    profile = relationship("ConsultantProfile", back_populates="user", uselist=False, foreign_keys="ConsultantProfile.user_id")
    policy_agreements = relationship("UserPolicyAgreement", back_populates="user", cascade="all, delete-orphan")
    reviewed_profiles = relationship("ConsultantProfile", back_populates="reviewer", foreign_keys="ConsultantProfile.reviewed_by")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    reviewed_credentials = relationship("ConsultantCredential", back_populates="reviewer", foreign_keys="ConsultantCredential.reviewed_by")
    reviewed_expansions = relationship("ServiceExpansionRequest", back_populates="reviewer", foreign_keys="ServiceExpansionRequest.reviewed_by")
    appointments = relationship("Appointment", back_populates="user")
    cancellations = relationship("AppointmentCancellation", back_populates="canceller")
    ratings = relationship("Rating", back_populates="user", foreign_keys="Rating.user_id")
    reviewed_ratings = relationship("Rating", back_populates="reviewer", foreign_keys="Rating.reviewed_by")
    notifications = relationship("Notification", back_populates="user")
    invoices = relationship("Invoice", back_populates="user")
    admin_action_logs = relationship("AdminActionLog", back_populates="admin")
    sent_messages = relationship("ChatMessage", back_populates="sender", foreign_keys="ChatMessage.sender_id")
    received_messages = relationship("ChatMessage", back_populates="receiver", foreign_keys="ChatMessage.receiver_id")
