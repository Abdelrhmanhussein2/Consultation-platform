import uuid
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Text, Boolean, JSON, func
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.orm import relationship

from helpers.database import Base
from helpers.enums import InvoiceType, InvoiceStatus

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    invoice_number = Column(String(50), unique=True, nullable=False)
    reference_number = Column(String(50), unique=True, nullable=True)
    payment_terms = Column(String(100), nullable=True)
    issued_at = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    type = Column(PG_ENUM(InvoiceType, name="invoice_type", inherit_schema=True), nullable=False, default=InvoiceType.client_invoice)
    invoice_class = Column(String(100), nullable=True)
    customer_type = Column(String(100), nullable=True)
    tax_treatment = Column(String(100), nullable=True)
    tax_enabled = Column(Boolean, nullable=False, default=True)
    logo_url = Column(String(500), nullable=True)
    
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)
    issued_to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    seller_name = Column(String(255), nullable=True)
    customer_name = Column(String(255), nullable=True)
    customer_address = Column(Text, nullable=True)
    customer_tax_number = Column(String(100), nullable=True)

    operation_type = Column(String(100), nullable=True)
    operation_details = Column(JSON, nullable=True)
    line_items = Column(JSON, nullable=True)

    amount = Column(Numeric(10, 2), nullable=False, default=0)
    subtotal = Column(Numeric(10, 2), nullable=True, default=0)
    discount_total = Column(Numeric(10, 2), nullable=True, default=0)
    tax_amount = Column(Numeric(10, 2), nullable=False, default=0)
    tax_total = Column(Numeric(10, 2), nullable=True, default=0)
    total_amount = Column(Numeric(10, 2), nullable=False, default=0)
    grand_total = Column(Numeric(10, 2), nullable=True, default=0)
    total_words = Column(String(255), nullable=True)

    currency = Column(String(10), nullable=False, default="JOD")
    status = Column(PG_ENUM(InvoiceStatus, name="invoice_status", inherit_schema=True), nullable=False, default=InvoiceStatus.draft)
    payment_method = Column(String(50), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)

    terms_and_conditions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    collection_account = Column(String(100), nullable=True)
    responsible_dept = Column(String(100), nullable=True)

    e_invoice_id = Column(String(100), nullable=True)
    e_invoice_status = Column(String(50), nullable=True)
    signer_name = Column(String(255), nullable=True)
    signature_url = Column(String(500), nullable=True)

    is_recurring = Column(Boolean, nullable=False, default=False)
    recurring_cycle = Column(String(50), nullable=True)
    recurring_start_date = Column(DateTime(timezone=True), nullable=True)
    recurring_next_date = Column(DateTime(timezone=True), nullable=True)
    recurring_state = Column(String(50), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    appointment = relationship("Appointment", back_populates="invoices")
    user = relationship("User", back_populates="invoices")

