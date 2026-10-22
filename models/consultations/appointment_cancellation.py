import uuid
from sqlalchemy import Column, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from helpers.database import Base
from helpers.enums import ActorRole

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
