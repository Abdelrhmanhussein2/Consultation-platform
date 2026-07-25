import uuid
from sqlalchemy import Column, DateTime, Integer, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from helpers.database import Base
from helpers.enums import RatingStatus

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
