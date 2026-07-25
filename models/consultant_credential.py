import uuid
from sqlalchemy import Column, DateTime, Integer, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from helpers.database import Base
from helpers.enums import VerificationStatus

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
