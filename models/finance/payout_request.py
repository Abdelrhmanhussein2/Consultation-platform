import uuid
from sqlalchemy import Column, DateTime, Numeric, ForeignKey, Text, String, func
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from helpers.database import Base
from helpers.enums import PayoutStatus

class PayoutRequest(Base):
    """
    Tracks payout/withdrawal requests made by consultants, including bank snapshots,
    admin review, payment references, and uploaded transfer receipts.
    """
    __tablename__ = "payout_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id", ondelete="CASCADE"), nullable=False)
    
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="JOD")
    bank_details_snapshot = Column(Text, nullable=False)  # JSON formatted snapshot of bank info
    status = Column(PG_ENUM(PayoutStatus, name="payout_status", inherit_schema=True), nullable=False, default=PayoutStatus.pending)
    
    transfer_reference = Column(String(150), nullable=True)
    receipt_url = Column(String(500), nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    processed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    requested_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    consultant = relationship("ConsultantProfile", back_populates="payout_requests")
    processor = relationship("User", foreign_keys=[processed_by])
