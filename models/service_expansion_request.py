import uuid
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from helpers.database import Base
from helpers.enums import VerificationStatus

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
