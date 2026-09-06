from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class RefundedInvoiceCreate(BaseModel):
    refund_number: Optional[str] = None
    reference_number: Optional[str] = None
    invoice_number: Optional[str] = None
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    service_name: Optional[str] = None
    original_amount: float = 0.0
    refund_amount: float = 0.0
    bearer: str = "المنصة"
    status: str = "pending"
    reason: Optional[str] = None

class RefundedInvoiceUpdate(BaseModel):
    refund_number: Optional[str] = None
    reference_number: Optional[str] = None
    invoice_number: Optional[str] = None
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    service_name: Optional[str] = None
    original_amount: Optional[float] = None
    refund_amount: Optional[float] = None
    bearer: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None

class RefundedInvoiceOut(BaseModel):
    id: str
    refund_number: Optional[str] = None
    reference_number: Optional[str] = None
    invoice_number: Optional[str] = None
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    service_name: Optional[str] = None
    original_amount: float = 0.0
    refund_amount: float = 0.0
    bearer: Optional[str] = "المنصة"
    status: Optional[str] = "pending"
    reason: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
