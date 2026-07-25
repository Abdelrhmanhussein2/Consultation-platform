import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Numeric, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from models.database import Base
from models.enums import (
    UserRole, VerificationStatus, AppointmentStatus, ActorRole,
    RatingStatus, NotificationType, InvoiceType, InvoiceStatus
)

# =====================================================================
# USERS
# =====================================================================
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(Text, nullable=False)
    role = Column(PG_ENUM(UserRole, name="user_role", inherit_schema=True), nullable=False, default=UserRole.user)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    profile = relationship("ConsultantProfile", back_populates="user", uselist=False, foreign_keys="ConsultantProfile.user_id")
    reviewed_profiles = relationship("ConsultantProfile", back_populates="reviewer", foreign_keys="ConsultantProfile.reviewed_by")
    reviewed_credentials = relationship("ConsultantCredential", back_populates="reviewer", foreign_keys="ConsultantCredential.reviewed_by")
    reviewed_expansions = relationship("ServiceExpansionRequest", back_populates="reviewer", foreign_keys="ServiceExpansionRequest.reviewed_by")
    appointments = relationship("Appointment", back_populates="user")
    cancellations = relationship("AppointmentCancellation", back_populates="canceller")
    ratings = relationship("Rating", back_populates="user", foreign_keys="Rating.user_id")
    reviewed_ratings = relationship("Rating", back_populates="reviewer", foreign_keys="Rating.reviewed_by")
    notifications = relationship("Notification", back_populates="user")
    invoices = relationship("Invoice", back_populates="user")
    admin_action_logs = relationship("AdminActionLog", back_populates="admin")


# =====================================================================
# SPECIALIZATIONS
# =====================================================================
class Specialization(Base):
    __tablename__ = "specializations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    profiles = relationship("ConsultantProfile", back_populates="specialization")
    credentials = relationship("ConsultantCredential", back_populates="specialization")
    expansion_requests = relationship("ServiceExpansionRequest", back_populates="specialization")
    services = relationship("ConsultantService", back_populates="specialization")


# =====================================================================
# CONSULTANT PROFILES
# =====================================================================
class ConsultantProfile(Base):
    __tablename__ = "consultant_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    main_specialization_id = Column(Integer, ForeignKey("specializations.id"), nullable=True)
    verification_status = Column(PG_ENUM(VerificationStatus, name="verification_status", inherit_schema=True), nullable=False, default=VerificationStatus.pending)
    rejection_reason = Column(Text, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    average_rating = Column(Numeric(3, 2), nullable=False, default=0)
    ratings_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="profile", foreign_keys=[user_id])
    specialization = relationship("Specialization", back_populates="profiles")
    reviewer = relationship("User", back_populates="reviewed_profiles", foreign_keys=[reviewed_by])
    
    credentials = relationship("ConsultantCredential", back_populates="consultant")
    expansion_requests = relationship("ServiceExpansionRequest", back_populates="consultant")
    services = relationship("ConsultantService", back_populates="consultant")
    appointments = relationship("Appointment", back_populates="consultant")
    ratings = relationship("Rating", back_populates="consultant")


# =====================================================================
# CONSULTANT CREDENTIALS
# =====================================================================
class ConsultantCredential(Base):
    __tablename__ = "consultant_credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id", ondelete="CASCADE"), nullable=False)
    specialization_id = Column(Integer, ForeignKey("specializations.id"), nullable=False)
    document_url = Column(Text, nullable=False)
    status = Column(PG_ENUM(VerificationStatus, name="verification_status", inherit_schema=True), nullable=False, default=VerificationStatus.pending)
    submitted_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    consultant = relationship("ConsultantProfile", back_populates="credentials")
    specialization = relationship("Specialization", back_populates="credentials")
    reviewer = relationship("User", back_populates="reviewed_credentials", foreign_keys=[reviewed_by])


# =====================================================================
# SERVICE EXPANSION REQUESTS
# =====================================================================
class ServiceExpansionRequest(Base):
    __tablename__ = "service_expansion_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id", ondelete="CASCADE"), nullable=False)
    requested_specialization_id = Column(Integer, ForeignKey("specializations.id"), nullable=True)
    service_name = Column(String(200), nullable=False)
    service_description = Column(Text, nullable=True)
    proof_document_url = Column(Text, nullable=False)
    status = Column(PG_ENUM(VerificationStatus, name="verification_status", inherit_schema=True), nullable=False, default=VerificationStatus.pending)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    consultant = relationship("ConsultantProfile", back_populates="expansion_requests")
    specialization = relationship("Specialization", back_populates="expansion_requests")
    reviewer = relationship("User", back_populates="reviewed_expansions", foreign_keys=[reviewed_by])
    services = relationship("ConsultantService", back_populates="expansion_request")


# =====================================================================
# CONSULTANT SERVICES
# =====================================================================
class ConsultantService(Base):
    __tablename__ = "consultant_services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id", ondelete="CASCADE"), nullable=False)
    specialization_id = Column(Integer, ForeignKey("specializations.id"), nullable=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=60)
    is_out_of_specialization = Column(Boolean, nullable=False, default=False)
    expansion_request_id = Column(UUID(as_uuid=True), ForeignKey("service_expansion_requests.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    consultant = relationship("ConsultantProfile", back_populates="services")
    specialization = relationship("Specialization", back_populates="services")
    expansion_request = relationship("ServiceExpansionRequest", back_populates="services")
    appointments = relationship("Appointment", back_populates="service")


# =====================================================================
# APPOINTMENTS
# =====================================================================
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    service_id = Column(UUID(as_uuid=True), ForeignKey("consultant_services.id"), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=60)
    status = Column(PG_ENUM(AppointmentStatus, name="appointment_status", inherit_schema=True), nullable=False, default=AppointmentStatus.pending)
    created_by_role = Column(PG_ENUM(ActorRole, name="actor_role", inherit_schema=True), nullable=False)
    price = Column(Numeric(10, 2), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    consultant = relationship("ConsultantProfile", back_populates="appointments")
    user = relationship("User", back_populates="appointments")
    service = relationship("ConsultantService", back_populates="appointments")
    cancellation = relationship("AppointmentCancellation", back_populates="appointment", uselist=False)
    rating = relationship("Rating", back_populates="appointment", uselist=False)
    invoices = relationship("Invoice", back_populates="appointment")


# =====================================================================
# APPOINTMENT CANCELLATIONS
# =====================================================================
class AppointmentCancellation(Base):
    __tablename__ = "appointment_cancellations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    cancelled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    cancelled_by_role = Column(PG_ENUM(ActorRole, name="actor_role", inherit_schema=True), nullable=False)
    reason = Column(Text, nullable=False)
    cancelled_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    within_policy = Column(Boolean, nullable=False)

    appointment = relationship("Appointment", back_populates="cancellation")
    canceller = relationship("User", back_populates="cancellations", foreign_keys=[cancelled_by])


# =====================================================================
# RATINGS
# =====================================================================
class Rating(Base):
    __tablename__ = "ratings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    stars = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    status = Column(PG_ENUM(RatingStatus, name="rating_status", inherit_schema=True), nullable=False, default=RatingStatus.published)
    low_rating_reason = Column(Text, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    appointment = relationship("Appointment", back_populates="rating")
    consultant = relationship("ConsultantProfile", back_populates="ratings")
    user = relationship("User", back_populates="ratings", foreign_keys=[user_id])
    reviewer = relationship("User", back_populates="reviewed_ratings", foreign_keys=[reviewed_by])


# =====================================================================
# NOTIFICATIONS
# =====================================================================
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(PG_ENUM(NotificationType, name="notification_type", inherit_schema=True), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    related_entity_type = Column(String(50), nullable=True)
    related_entity_id = Column(UUID(as_uuid=True), nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", back_populates="notifications")


# =====================================================================
# INVOICES
# =====================================================================
class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    invoice_number = Column(String(50), unique=True, nullable=False)
    type = Column(PG_ENUM(InvoiceType, name="invoice_type", inherit_schema=True), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)
    issued_to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), nullable=False, default=0)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="EGP")
    status = Column(PG_ENUM(InvoiceStatus, name="invoice_status", inherit_schema=True), nullable=False, default=InvoiceStatus.draft)
    payment_method = Column(String(50), nullable=True)
    issued_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    appointment = relationship("Appointment", back_populates="invoices")
    user = relationship("User", back_populates="invoices")


# =====================================================================
# ADMIN ACTION LOGS
# =====================================================================
class AdminActionLog(Base):
    __tablename__ = "admin_action_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action_type = Column(String(100), nullable=False)
    target_entity_type = Column(String(50), nullable=False)
    target_entity_id = Column(UUID(as_uuid=True), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    admin = relationship("User", back_populates="admin_action_logs")
