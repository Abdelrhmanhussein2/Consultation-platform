import uuid
from sqlalchemy import Column, DateTime, Integer, Numeric, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from helpers.database import Base
from helpers.enums import VerificationStatus

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
