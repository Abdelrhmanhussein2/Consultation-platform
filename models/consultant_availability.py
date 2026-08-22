import uuid
from sqlalchemy import Column, Time, Integer, Boolean, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from helpers.database import Base

class ConsultantAvailability(Base):
    __tablename__ = "consultant_availabilities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0 = Monday, 6 = Sunday
    start_time = Column(Time, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationships
    consultant = relationship("ConsultantProfile", back_populates="availabilities")
