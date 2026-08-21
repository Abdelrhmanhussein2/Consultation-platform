from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from helpers.database import get_db
from helpers.enums import InvoiceStatus
from models import User
from schemes import InvoiceOut
from controllers import InvoiceController
from routes.deps import get_current_active_user

router = APIRouter(prefix="/invoices", tags=["Invoices & Billing"])


@router.get(
    "/my",
    response_model=List[InvoiceOut],
    summary="Get user invoices history",
)
def get_my_invoices(
    status_filter: Optional[InvoiceStatus] = Query(None, alias="status", description="Filter by invoice status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the authenticated user's invoices and payment history, newest first.
    Supports filtering by invoice status (draft, issued, paid, cancelled, refunded).
    """
    return InvoiceController.get_my_invoices(
        db, current_user, status_filter=status_filter, page=page, limit=limit
    )


@router.get(
    "/{invoice_id}",
    response_model=InvoiceOut,
    summary="Get invoice details",
)
def get_invoice_detail(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the full details of a specific invoice.
    Users can only view their own invoices; admins can view any invoice.
    """
    return InvoiceController.get_invoice_detail(db, current_user, invoice_id)
