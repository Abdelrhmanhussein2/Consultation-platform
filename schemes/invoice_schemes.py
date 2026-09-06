import uuid
from decimal import Decimal
from datetime import datetime, date
from typing import Optional, Any, List, Dict
from pydantic import BaseModel
from helpers.enums import InvoiceType, InvoiceStatus

class InvoiceCreate(BaseModel):
    invoice_number: Optional[str] = None
    reference_number: Optional[str] = None
    payment_terms: Optional[str] = None
    issued_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    type: InvoiceType = InvoiceType.client_invoice
    invoice_class: Optional[str] = None
    customer_type: Optional[str] = None
    tax_treatment: Optional[str] = None
    tax_enabled: bool = True
    logo_url: Optional[str] = None

    appointment_id: Optional[uuid.UUID] = None
    issued_to_user_id: Optional[uuid.UUID] = None

    seller_name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    customer_tax_number: Optional[str] = None

    operation_type: Optional[str] = None
    operation_details: Optional[Dict[str, Any]] = None
    line_items: Optional[List[Dict[str, Any]]] = None

    amount: Optional[Decimal] = Decimal('0.00')
    subtotal: Optional[Decimal] = Decimal('0.00')
    discount_total: Optional[Decimal] = Decimal('0.00')
    tax_amount: Optional[Decimal] = Decimal('0.00')
    tax_total: Optional[Decimal] = Decimal('0.00')
    total_amount: Optional[Decimal] = Decimal('0.00')
    grand_total: Optional[Decimal] = Decimal('0.00')
    total_words: Optional[str] = None

    currency: str = "JOD"
    status: InvoiceStatus = InvoiceStatus.draft
    payment_method: Optional[str] = None
    paid_at: Optional[datetime] = None

    terms_and_conditions: Optional[str] = None
    notes: Optional[str] = None
    collection_account: Optional[str] = None
    responsible_dept: Optional[str] = None

    e_invoice_id: Optional[str] = None
    e_invoice_status: Optional[str] = None
    signer_name: Optional[str] = None
    signature_url: Optional[str] = None

    is_recurring: bool = False
    recurring_cycle: Optional[str] = None
    recurring_start_date: Optional[datetime] = None
    recurring_next_date: Optional[datetime] = None
    recurring_state: Optional[str] = None

class InvoiceOut(BaseModel):
    id: uuid.UUID
    invoice_number: str
    reference_number: Optional[str] = None
    payment_terms: Optional[str] = None
    issued_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    type: InvoiceType
    invoice_class: Optional[str] = None
    customer_type: Optional[str] = None
    tax_treatment: Optional[str] = None
    tax_enabled: bool = True
    logo_url: Optional[str] = None

    appointment_id: Optional[uuid.UUID] = None
    issued_to_user_id: Optional[uuid.UUID] = None

    seller_name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    customer_tax_number: Optional[str] = None

    operation_type: Optional[str] = None
    operation_details: Optional[Any] = None
    line_items: Optional[Any] = None

    amount: Optional[Decimal] = Decimal('0.00')
    subtotal: Optional[Decimal] = Decimal('0.00')
    discount_total: Optional[Decimal] = Decimal('0.00')
    tax_amount: Optional[Decimal] = Decimal('0.00')
    tax_total: Optional[Decimal] = Decimal('0.00')
    total_amount: Optional[Decimal] = Decimal('0.00')
    grand_total: Optional[Decimal] = Decimal('0.00')
    total_words: Optional[str] = None

    currency: str = "JOD"
    status: InvoiceStatus
    payment_method: Optional[str] = None
    paid_at: Optional[datetime] = None

    terms_and_conditions: Optional[str] = None
    notes: Optional[str] = None
    collection_account: Optional[str] = None
    responsible_dept: Optional[str] = None

    e_invoice_id: Optional[str] = None
    e_invoice_status: Optional[str] = None
    signer_name: Optional[str] = None
    signature_url: Optional[str] = None

    is_recurring: bool = False
    recurring_cycle: Optional[str] = None
    recurring_start_date: Optional[datetime] = None
    recurring_next_date: Optional[datetime] = None
    recurring_state: Optional[str] = None

    created_at: datetime

    class Config:
        from_attributes = True

