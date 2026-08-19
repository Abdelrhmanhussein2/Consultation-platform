import uuid
from sqlalchemy import Column, DateTime, Integer, Numeric, ForeignKey, Text, String, func
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from helpers.database import Base
from helpers.enums import AppointmentStatus, ActorRole

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    service_id = Column(UUID(as_uuid=True), ForeignKey("consultant_services.id"), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=60)
    status = Column(PG_ENUM(AppointmentStatus, name="appointment_status", inherit_schema=True), nullable=False, default=AppointmentStatus.pending_approval)
    created_by_role = Column(PG_ENUM(ActorRole, name="actor_role", inherit_schema=True), nullable=False)
    price = Column(Numeric(10, 2), nullable=True)
    notes = Column(Text, nullable=True)
    session_room_name = Column(String(100), nullable=True)
    session_room_url = Column(String(300), nullable=True)
    session_started_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    consultant = relationship("ConsultantProfile", back_populates="appointments")
    user = relationship("User", back_populates="appointments")
    service = relationship("ConsultantService", back_populates="appointments")
    cancellation = relationship("AppointmentCancellation", back_populates="appointment", uselist=False)
    rating = relationship("Rating", back_populates="appointment", uselist=False)
    invoices = relationship("Invoice", back_populates="appointment")
