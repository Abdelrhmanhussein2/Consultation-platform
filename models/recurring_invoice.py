import uuid
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from helpers.database import Base

class RecurringInvoice(Base):
    __tablename__ = "recurring_invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    recurring_number = Column(String(50), unique=True, nullable=False) # e.g. RINV-0025
    reference_number = Column(String(50), unique=True, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    user_name = Column(String(200), nullable=True)
    user_email = Column(String(200), nullable=True)
    cycle = Column(String(50), nullable=False, default="monthly") # monthly, quarterly, semiannual, annual
    issued_date = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    paid_amount = Column(Numeric(10, 2), nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="active") # active, paid, partial, cancelled, overdue, paused
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", backref="recurring_invoices")
