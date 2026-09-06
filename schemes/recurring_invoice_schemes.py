from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class RecurringInvoiceCreate(BaseModel):
    recurring_number: Optional[str] = None
    reference_number: Optional[str] = None
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    cycle: str = "monthly"
    issued_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    amount: float = 0.0
    paid_amount: float = 0.0
    status: str = "active"
    notes: Optional[str] = None

class RecurringInvoiceUpdate(BaseModel):
    recurring_number: Optional[str] = None
    reference_number: Optional[str] = None
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    cycle: Optional[str] = None
    issued_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    amount: Optional[float] = None
    paid_amount: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class RecurringInvoiceOut(BaseModel):
    id: str
    recurring_number: Optional[str] = None
    reference_number: Optional[str] = None
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    cycle: Optional[str] = "monthly"
    issued_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    amount: float = 0.0
    paid_amount: float = 0.0
    status: Optional[str] = "active"
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
