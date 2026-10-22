from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from helpers.database import get_db
from models import User
from schemes.recurring_invoice_schemes import RecurringInvoiceOut, RecurringInvoiceCreate, RecurringInvoiceUpdate
from controllers.recurring_invoice_controller import RecurringInvoiceController
from routes.deps import get_current_active_user

router = APIRouter(prefix="/recurring-invoices", tags=["Recurring Invoices"])

@router.get(
    "/all",
    response_model=List[RecurringInvoiceOut],
    summary="Get all recurring invoices (Admin)"
)
def get_all_recurring_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return RecurringInvoiceController.get_all_recurring_invoices(db, page=page, limit=limit)

@router.get(
    "/{recurring_id}",
    response_model=RecurringInvoiceOut,
    summary="Get recurring invoice details"
)
def get_recurring_invoice_detail(
    recurring_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return RecurringInvoiceController.get_recurring_invoice_detail(db, recurring_id)

@router.post(
    "/",
    response_model=RecurringInvoiceOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new recurring invoice"
)
def create_recurring_invoice(
    data: RecurringInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return RecurringInvoiceController.create_recurring_invoice(db, data)

@router.put(
    "/{recurring_id}",
    response_model=RecurringInvoiceOut,
    summary="Update a recurring invoice"
)
def update_recurring_invoice(
    recurring_id: str,
    data: RecurringInvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return RecurringInvoiceController.update_recurring_invoice(db, recurring_id, data)

@router.delete(
    "/{recurring_id}",
    summary="Delete a recurring invoice"
)
def delete_recurring_invoice(
    recurring_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return RecurringInvoiceController.delete_recurring_invoice(db, recurring_id)
