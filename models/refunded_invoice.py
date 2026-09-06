import uuid
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from helpers.database import Base

class RefundedInvoice(Base):
    __tablename__ = "refunded_invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    refund_number = Column(String(50), unique=True, nullable=False) # e.g. REF-2026-0016
    reference_number = Column(String(50), unique=True, nullable=True)
    invoice_number = Column(String(50), nullable=True) # Original Invoice ID e.g. INV-2026-00842
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    user_name = Column(String(200), nullable=True)
    service_name = Column(String(300), nullable=True)
    original_amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    refund_amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    bearer = Column(String(100), nullable=False, default="المنصة") # المنصة / المستشار / المنصة والمستشار
    status = Column(String(50), nullable=False, default="pending") # pending, processing, completed, rejected
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", backref="refunded_invoices")
