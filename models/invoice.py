import uuid
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from helpers.database import Base
from helpers.enums import InvoiceType, InvoiceStatus

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    invoice_number = Column(String(50), unique=True, nullable=False)
    type = Column(PG_ENUM(InvoiceType, name="invoice_type", inherit_schema=True), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)
    issued_to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), nullable=False, default=0)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="EGP")
    status = Column(PG_ENUM(InvoiceStatus, name="invoice_status", inherit_schema=True), nullable=False, default=InvoiceStatus.draft)
    payment_method = Column(String(50), nullable=True)
    issued_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    appointment = relationship("Appointment", back_populates="invoices")
    user = relationship("User", back_populates="invoices")
