import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Numeric, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from helpers.database import Base

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
